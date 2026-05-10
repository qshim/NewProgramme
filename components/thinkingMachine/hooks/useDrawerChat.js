import { useCallback, useEffect, useRef, useState } from "react";
import { chat, chatToNodes, toChatErrorMessage } from "@/lib/thinkingMachine/apiClient";

export function useDrawerChat({
  suggestions,
  nodes,
  onPreviewNodesFromChat,
  isDrawerOpen,
  setIsDrawerOpen,
  drawerMode,
  setDrawerMode,
  stage = "research-diverge",
} = {}) {
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatConverting, setIsChatConverting] = useState(false);

  const activeSuggestionIdRef = useRef(null);

  const resetChat = useCallback(() => {
    setChatMessages([]);
    setChatInput("");
    setIsChatLoading(false);
  }, []);

  useEffect(() => {
    activeSuggestionIdRef.current = activeSuggestion?.id ?? null;
  }, [activeSuggestion?.id]);

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
          user_message: targetSuggestion.initialUserMessage || defaultUserMessage,
          stage,
        };
        const res = await chat(payload);
        if (cancelled || activeSuggestionIdRef.current !== targetSuggestion.id) return;
        setChatMessages([{ role: "assistant", content: res.reply }]);
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
  }, [activeSuggestion, resetChat, stage]);

  const handleDrawerChatSubmit = useCallback(async () => {
    const targetSuggestion = activeSuggestion;
    const trimmedInput = chatInput.trim();

    if (!targetSuggestion || !trimmedInput || isChatLoading) return;

    const historyForApi = chatMessages;
    const targetSuggestionId = targetSuggestion.id;
    setChatMessages((prev) => [...prev, { role: "user", content: trimmedInput }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const isAttachedNodesContext = targetSuggestion?.type === "attachedNodes";
      const attached = isAttachedNodesContext ? targetSuggestion?.attached_nodes ?? [] : [];
      const payload = {
        suggestion_title: targetSuggestion.title,
        suggestion_content: targetSuggestion.content,
        suggestion_category: targetSuggestion.category,
        suggestion_phase: targetSuggestion.phase,
        messages: historyForApi,
        user_message: trimmedInput,
        attached_nodes: attached,
        stage,
      };
      const res = await chat(payload);
      if (activeSuggestionIdRef.current !== targetSuggestionId) return;
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (error) {
      if (activeSuggestionIdRef.current !== targetSuggestionId) return;
      setChatMessages((prev) => [...prev, { role: "assistant", content: toChatErrorMessage(error) }]);
    } finally {
      if (activeSuggestionIdRef.current === targetSuggestionId) {
        setIsChatLoading(false);
      }
    }
  }, [activeSuggestion, chatInput, chatMessages, isChatLoading, stage]);

  const handleDrawerChatConvertToNodes = useCallback(async () => {
    if (!activeSuggestion || chatMessages.length === 0 || isChatConverting) return;
    setIsChatConverting(true);

    try {
      const isAttachedNodesContext = activeSuggestion?.type === "attachedNodes";
      const attached = isAttachedNodesContext ? activeSuggestion?.attached_nodes ?? [] : [];
      const payload = {
        suggestion_title: activeSuggestion.title,
        suggestion_content: activeSuggestion.content,
        suggestion_category: activeSuggestion.category,
        suggestion_phase: activeSuggestion.phase,
        messages: chatMessages,
        attached_nodes: attached,
        existing_nodes: (Array.isArray(nodes) ? nodes : []).map((n) => ({
          id: n.id,
          data: {
            title: n.data.title,
            category: n.data.category,
            phase: n.data.phase,
          },
          position: n.position,
        })),
        stage,
      };
      const data = await chatToNodes(payload);
      onPreviewNodesFromChat?.(data);
      setIsDrawerOpen(true);
    } catch (error) {
      const serverMsg = error?.response?.data?.error || error?.response?.data?.detail || error?.message;
      alert(
        serverMsg
          ? `Failed to convert conversation to nodes: ${serverMsg}`
          : "Failed to convert conversation to nodes. Please try again shortly."
      );
    } finally {
      setIsChatConverting(false);
    }
  }, [activeSuggestion, chatMessages, isChatConverting, nodes, onPreviewNodesFromChat, setIsDrawerOpen, stage]);

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
    handleDrawerModeToggle,
    handleDrawerChatSubmit,
    handleDrawerChatConvertToNodes,
    handleDrawerContextSelect,
    resetChat,
  };
}
