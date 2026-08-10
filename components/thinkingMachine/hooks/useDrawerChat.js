import { useCallback, useEffect, useRef, useState } from "react";
import { chat, chatToNodes, toChatErrorMessage } from "@/lib/thinkingMachine/apiClient";

function serializeMessagesForApi(messages) {
  return (Array.isArray(messages) ? messages : []).map((message) => {
    const sources = Array.isArray(message?.sources) ? message.sources : [];
    const sourceContext = sources.length
      ? `\n\n[Live web sources]\n${sources.map((source) => `- ${source.title}: ${source.url}`).join("\n")}`
      : "";
    return {
      role: message.role,
      content: `${message.content}${sourceContext}`,
    };
  });
}

function serializeGraphNodes(nodes, limit = 24) {
  return (Array.isArray(nodes) ? nodes : []).slice(-limit).map((node) => ({
    id: node.id,
    data: {
      title: node.data?.title || node.data?.label,
      content: node.data?.content,
      category: node.data?.category,
      phase: node.data?.phase,
      sourceType: node.data?.sourceType,
      visibility: node.data?.visibility,
      confidence: node.data?.confidence,
    },
    position: node.position,
  }));
}

function serializeGraphEdges(edges, limit = 48) {
  return (Array.isArray(edges) ? edges : []).slice(-limit).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
  }));
}

export function useDrawerChat({
  suggestions,
  nodes,
  edges,
  onPreviewNodesFromChat,
  isDrawerOpen,
  setIsDrawerOpen,
  drawerMode,
  setDrawerMode,
  stage = "research-diverge",
  uiLanguage = "en",
  modelProfile = "auto",
} = {}) {
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatConverting, setIsChatConverting] = useState(false);
  const [chatConversionError, setChatConversionError] = useState("");

  const activeSuggestionIdRef = useRef(null);
  const modelProfileRef = useRef(modelProfile);
  const latestCandidateGraphRef = useRef(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  const resetChat = useCallback(() => {
    setChatMessages([]);
    setChatInput("");
    setIsChatLoading(false);
    setIsChatConverting(false);
    setChatConversionError("");
    latestCandidateGraphRef.current = null;
  }, []);

  useEffect(() => {
    activeSuggestionIdRef.current = activeSuggestion?.id ?? null;
  }, [activeSuggestion?.id]);

  useEffect(() => {
    modelProfileRef.current = modelProfile;
  }, [modelProfile]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [edges, nodes]);

  const handleDrawerModeToggle = useCallback(
    (nextMode) => {
      setDrawerMode(nextMode);
      setIsDrawerOpen(true);
      // Chat 모드는 "첨부 노드 컨텍스트" 전용 (Tip 컨텍스트와 분리)
      if (nextMode === "chat" && activeSuggestion?.type !== "attachedNodes") {
        setActiveSuggestion(null);
      }
      if (nextMode === "tip" && activeSuggestion?.type === "attachedNodes") {
        setActiveSuggestion(suggestions?.[0] || null);
      }
    },
    [activeSuggestion?.type, setDrawerMode, setIsDrawerOpen, suggestions]
  );

  useEffect(() => {
    if (!activeSuggestion) {
      resetChat();
      return;
    }

    let cancelled = false;
    const targetSuggestion = activeSuggestion;

    const bootstrapChat = async () => {
      setChatMessages([]);
      setChatInput("");
      setIsChatLoading(true);
      try {
        const isAttachedNodesContext = targetSuggestion?.type === "attachedNodes";
        const attached = isAttachedNodesContext ? targetSuggestion?.attached_nodes ?? [] : [];
        const defaultUserMessage = isAttachedNodesContext
          ? "Analyze the attached nodes, summarize what they collectively imply, and ask me one clarifying question to move forward."
          : "Please explain this suggestion first.";
        const payload = {
          suggestion_title: targetSuggestion.title,
          suggestion_content: targetSuggestion.content,
          suggestion_category: targetSuggestion.category,
          suggestion_phase: targetSuggestion.phase,
          messages: [],
          attached_nodes: attached,
          existing_nodes: serializeGraphNodes(nodesRef.current),
          existing_edges: serializeGraphEdges(edgesRef.current),
          user_message: targetSuggestion.initialUserMessage || defaultUserMessage,
          stage,
          uiLanguage,
          modelProfile: modelProfileRef.current,
          webSearchEnabled: true,
        };
        const res = await chat(payload);
        if (cancelled || activeSuggestionIdRef.current !== targetSuggestion.id) return;
        setChatMessages([{
          role: "assistant",
          content: res.reply,
          sources: res.sources || [],
          webSearchUsed: Boolean(res.webSearchUsed),
          webSearchError: res.webSearchError || "",
          convergence: res.convergence,
        }]);
      } catch (error) {
        if (cancelled || activeSuggestionIdRef.current !== targetSuggestion.id) return;
        setChatMessages([{ role: "assistant", content: toChatErrorMessage(error) }]);
      } finally {
        if (!cancelled && activeSuggestionIdRef.current === targetSuggestion.id) {
          setIsChatLoading(false);
        }
      }
    };

    void bootstrapChat();
    return () => {
      cancelled = true;
    };
  }, [activeSuggestion, resetChat, stage, uiLanguage]);

  const handleDrawerChatSubmit = useCallback(async () => {
    const targetSuggestion = activeSuggestion;
    const trimmedInput = chatInput.trim();

    if (!targetSuggestion || !trimmedInput || isChatLoading) return;

    const historyForApi = serializeMessagesForApi(chatMessages);
    const targetSuggestionId = targetSuggestion.id;
    setChatMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
    setChatInput("");
    setChatConversionError("");
    setIsChatLoading(true);

    try {
      const isAttachedNodesContext = targetSuggestion?.type === "attachedNodes";
      const attached = isAttachedNodesContext ? targetSuggestion?.attached_nodes ?? [] : [];
      const latestCandidateGraph = latestCandidateGraphRef.current;
      const existingNodes = serializeGraphNodes(nodes);
      const existingEdges = serializeGraphEdges(edges);
      const candidateNodes = serializeGraphNodes(latestCandidateGraph?.nodes, 4);
      const candidateEdges = serializeGraphEdges(latestCandidateGraph?.edges, 6);
      const payload = {
        suggestion_title: targetSuggestion.title,
        suggestion_content: targetSuggestion.content,
        suggestion_category: targetSuggestion.category,
        suggestion_phase: targetSuggestion.phase,
        messages: historyForApi,
        user_message: trimmedInput,
        attached_nodes: attached,
        existing_nodes: existingNodes,
        existing_edges: existingEdges,
        candidate_nodes: candidateNodes,
        candidate_edges: candidateEdges,
        stage,
        uiLanguage,
        modelProfile,
        webSearchEnabled: true,
      };
      const res = await chat(payload);
      if (activeSuggestionIdRef.current !== targetSuggestionId) return;
      const completedMessages = [
        ...chatMessages,
        { role: "user", content: trimmedInput },
        {
          role: "assistant",
          content: res.reply,
          sources: res.sources || [],
          webSearchUsed: Boolean(res.webSearchUsed),
          webSearchError: res.webSearchError || "",
          convergence: res.convergence,
        },
      ];
      setChatMessages(completedMessages);

      setIsChatConverting(true);
      try {
        const conversionPayload = {
          suggestion_title: targetSuggestion.title,
          suggestion_content: targetSuggestion.content,
          suggestion_category: targetSuggestion.category,
          suggestion_phase: targetSuggestion.phase,
          messages: serializeMessagesForApi(completedMessages),
          attached_nodes: attached,
          existing_nodes: existingNodes,
          existing_edges: existingEdges,
          candidate_nodes: candidateNodes,
          candidate_edges: candidateEdges,
          stage,
          uiLanguage,
          modelProfile,
        };
        const candidateGraph = await chatToNodes(conversionPayload);
        if (activeSuggestionIdRef.current !== targetSuggestionId) return;
        latestCandidateGraphRef.current = candidateGraph;
        onPreviewNodesFromChat?.(candidateGraph);
        setIsDrawerOpen(true);
      } catch (conversionError) {
        if (activeSuggestionIdRef.current !== targetSuggestionId) return;
        const serverMessage =
          conversionError?.response?.data?.error ||
          conversionError?.response?.data?.detail ||
          conversionError?.message;
        setChatConversionError(
          serverMessage ||
            (uiLanguage === "ko"
              ? "대화를 노드 후보로 만드는 데 실패했습니다. 다시 시도해 주세요."
              : uiLanguage === "ja"
                ? "会話をノード候補に変換できませんでした。もう一度お試しください。"
                : "Failed to create node candidates from the conversation. Please try again.")
        );
      } finally {
        setIsChatConverting(false);
      }
    } catch (error) {
      if (activeSuggestionIdRef.current !== targetSuggestionId) return;
      setChatMessages((prev) => [...prev, { role: "assistant", content: toChatErrorMessage(error) }]);
    } finally {
      if (activeSuggestionIdRef.current === targetSuggestionId) {
        setIsChatLoading(false);
      }
    }
  }, [activeSuggestion, chatInput, chatMessages, edges, isChatLoading, modelProfile, nodes, onPreviewNodesFromChat, setIsDrawerOpen, stage, uiLanguage]);

  const handleDrawerContextSelect = useCallback(
    (item) => {
      if (!item) return;
      setActiveSuggestion(item);
      // attachedNodes는 Chat 모드, 그 외 suggestion은 Tip 모드로
      setDrawerMode(item?.type === "attachedNodes" ? "chat" : "tip");
      setIsDrawerOpen(true);
    },
    [setDrawerMode, setIsDrawerOpen]
  );

  return {
    activeSuggestion,
    setActiveSuggestion,
    chatMessages,
    setChatMessages,
    chatInput,
    setChatInput,
    isChatLoading,
    setIsChatLoading,
    isChatConverting,
    chatConversionError,
    handleDrawerModeToggle,
    handleDrawerChatSubmit,
    handleDrawerContextSelect,
    resetChat,
  };
}
