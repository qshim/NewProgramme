import { useCallback, useEffect, useRef, useState } from "react";
import { analyze } from "@/lib/thinkingMachine/apiClient";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { computeNodeBounds, shiftClusterRightOfExisting } from "@/lib/thinkingMachine/graphMerge";
import {
  GROUP_PADDING,
  GROUP_TOP_PADDING,
  IMAGE_DRAFT_SIZE,
  POSTIT_DRAFT_SIZE,
  buildDraftBundleText,
  layoutDraftsInGroupGrid,
  layoutThinkingNodesInGroup,
} from "@/lib/thinkingMachine/draftLayout";
import { mergeSuggestionUnique } from "@/components/thinkingMachine/utils/suggestionUtils";

export function useDraftGrouping({
  nodes,
  edges,
  setNodes,
  setEdges,
  isAnalyzing,
  setIsAnalyzing,
  setSuggestions,
  reactFlowRef,
  stage = "research-diverge",
  currentUserId = "mock-user-1",
  currentUserName = "You",
} = {}) {
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [showDraftConvertPrompt, setShowDraftConvertPrompt] = useState(false);
  const [selectionBoxEnabled, setSelectionBoxEnabled] = useState(false);
  const [draftSubmittingIds, setDraftSubmittingIds] = useState(() => new Set());

  const draftConvertIdsRef = useRef([]);
  const prevDraftSelectionRef = useRef({ idsKey: "", shouldPrompt: false });
  const convertDraftsToGroupRef = useRef(null);

  const screenCenterToFlowPosition = useCallback(() => {
    const inst = reactFlowRef?.current;
    if (!inst || typeof window === "undefined") return { x: 0, y: 0 };
    const pt = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    if (typeof inst.screenToFlowPosition === "function") return inst.screenToFlowPosition(pt);
    // fallback for older APIs
    if (typeof inst.project === "function") return inst.project(pt);
    return { x: 0, y: 0 };
  }, [reactFlowRef]);

  const buildDraftStyle = useCallback((kind) => {
    const size = kind === "image" ? IMAGE_DRAFT_SIZE : POSTIT_DRAFT_SIZE;
    return {
      width: size.w,
      height: size.h,
      border: "none",
      background: "transparent",
      padding: 0,
      zIndex: 60,
    };
  }, []);

  const createPostitDraft = useCallback(() => {
    const center = screenCenterToFlowPosition();
    const topLevelDraftCount = (Array.isArray(nodes) ? nodes : []).filter(
      (n) => (n?.type === "postitDraft" || n?.type === "imageDraft") && !n?.parentNode
    ).length;
    const offset = (topLevelDraftCount % 9) * 26;
    const id = `draft-postit-${Date.now()}`;
    const node = {
      id,
      type: "postitDraft",
      position: {
        x: center.x - POSTIT_DRAFT_SIZE.w / 2 + offset,
        y: center.y - POSTIT_DRAFT_SIZE.h / 2 + offset,
      },
      data: {
        text: "",
      },
      style: buildDraftStyle("postit"),
    };
    setNodes((prev) => [...prev, node]);
  }, [nodes, screenCenterToFlowPosition, setNodes, buildDraftStyle]);

  const createImageDraft = useCallback(() => {
    const center = screenCenterToFlowPosition();
    const topLevelDraftCount = (Array.isArray(nodes) ? nodes : []).filter(
      (n) => (n?.type === "postitDraft" || n?.type === "imageDraft") && !n?.parentNode
    ).length;
    const offset = (topLevelDraftCount % 9) * 26;
    const id = `draft-image-${Date.now()}`;
    const node = {
      id,
      type: "imageDraft",
      position: {
        x: center.x - IMAGE_DRAFT_SIZE.w / 2 + offset,
        y: center.y - IMAGE_DRAFT_SIZE.h / 2 + offset,
      },
      data: {
        imageUrl: "",
        fileName: "",
        caption: "",
      },
      style: buildDraftStyle("image"),
    };
    setNodes((prev) => [...prev, node]);
  }, [nodes, screenCenterToFlowPosition, setNodes, buildDraftStyle]);

  const handlePostitChangeText = useCallback(
    (nodeId, nextText) => {
      setNodes((prev) => prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, text: nextText } } : n)));
    },
    [setNodes]
  );

  const handleImageChangeCaption = useCallback(
    (nodeId, nextCaption) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, caption: nextCaption } } : n))
      );
    },
    [setNodes]
  );

  const handleImagePick = useCallback(
    (nodeId, file) => {
      const url = URL.createObjectURL(file);
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== nodeId) return n;
          const prevUrl = typeof n?.data?.imageUrl === "string" ? n.data.imageUrl : "";
          if (prevUrl && prevUrl.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(prevUrl);
            } catch {
              // ignore
            }
          }
          return {
            ...n,
            data: {
              ...n.data,
              imageUrl: url,
              fileName: file?.name || "",
            },
          };
        })
      );
    },
    [setNodes]
  );

  const handleSelectionChange = useCallback(({ nodes: selectedNodes } = {}) => {
    const selected = Array.isArray(selectedNodes) ? selectedNodes : [];
    const draftIds = selected
      .filter((n) => n?.type === "postitDraft" || n?.type === "imageDraft")
      .map((n) => n.id)
      .filter(Boolean)
      .sort();

    const shouldPrompt = draftIds.length >= 2;
    const idsKey = draftIds.join("|");
    const prev = prevDraftSelectionRef.current;

    // Prevent infinite update loops: only update state when selection actually changes.
    if (prev.idsKey !== idsKey) {
      setSelectedDraftIds(draftIds);
      draftConvertIdsRef.current = draftIds;
      prevDraftSelectionRef.current = { ...prevDraftSelectionRef.current, idsKey };
    }
    if (prev.shouldPrompt !== shouldPrompt) {
      setShowDraftConvertPrompt(shouldPrompt);
      prevDraftSelectionRef.current = { ...prevDraftSelectionRef.current, shouldPrompt };
    }
  }, []);

  useEffect(() => {
    const handleDown = (event) => {
      if (event.key === "Shift") setSelectionBoxEnabled(true);
    };
    const handleUp = (event) => {
      if (event.key === "Shift") setSelectionBoxEnabled(false);
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, []);

  const toggleIdeaGroupMode = useCallback(
    (groupId) => {
      setNodes((prev) => {
        const group = prev.find((n) => n.id === groupId);
        const currentMode = group?.data?.mode === "raw" ? "raw" : "nodes";
        const nextMode = currentMode === "raw" ? "nodes" : "raw";
        const groupW = group?.style?.width ?? 520;
        const groupH = group?.style?.height ?? 360;

        let rawGridMap = null;
        if (nextMode === "raw") {
          const draftChildren = prev
            .filter((n) => n.parentNode === groupId && (n.type === "postitDraft" || n.type === "imageDraft"))
            .map((n) => ({ ...n, hidden: false }));
          const laidOutDrafts = layoutDraftsInGroupGrid({ draftNodes: draftChildren, groupW, groupH });
          rawGridMap = new Map(laidOutDrafts.map((n) => [n.id, n]));
        }
        return prev.map((n) => {
          if (n.id === groupId) return { ...n, data: { ...n.data, mode: nextMode } };
          if (n.parentNode !== groupId) return n;
          const isDraft = n.type === "postitDraft" || n.type === "imageDraft";
          const isThinking = n.type === "thinkingNode";
          if (nextMode === "raw") {
            if (isDraft) return rawGridMap?.get?.(n.id) || { ...n, hidden: false };
            if (isThinking) return { ...n, hidden: true };
          } else {
            if (isDraft) return { ...n, hidden: true };
            if (isThinking) return { ...n, hidden: false };
          }
          return n;
        });
      });
    },
    [setNodes]
  );

  const convertDraftsToGroup = useCallback(
    async (draftIds) => {
      const ids = Array.isArray(draftIds) ? draftIds : [];
      if (ids.length === 0 || isAnalyzing) return;

      const draftNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => ids.includes(n.id));
      const bundleText = buildDraftBundleText(draftNodes);
      if (!bundleText.trim()) return;

      setDraftSubmittingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      setIsAnalyzing(true);
      try {
        const history = (Array.isArray(nodes) ? nodes : [])
          .filter((n) => n.type === "thinkingNode")
          .map((n) => ({
            id: n.id,
            data: { title: n.data.title, category: n.data.category, phase: n.data.phase },
            position: n.position,
          }));
        const payload = { text: bundleText, history, stage };
        const data = await analyze(payload);

        const suggestionNodeData = data.nodes.find((n) => n.data.is_ai_generated);
        // Draft 에서 생성되는 사용자 노드는 항상
        // - ownerId: 현재 사용자
        // - editedBy: "You"
        // - visibility: "private" (Personal 레이어에서 바로 보이도록)
        const userNodeDatas = data.nodes
          .filter((n) => !n.data.is_ai_generated)
          .map((n) => ({
            ...n,
            data: {
              ...n.data,
              ownerId: currentUserId,
              editedBy: currentUserName,
              visibility: "private",
            },
          }));
        const rawEdges = data.edges.filter((e) => !e.id.startsWith("e-suggest-"));

        const bounds = computeNodeBounds(draftNodes) || { minX: 0, minY: 0, maxX: 520, maxY: 420 };
        const groupId = `idea-group-${Date.now()}`;
        const groupPos = { x: bounds.minX - GROUP_PADDING, y: bounds.minY - GROUP_PADDING - 12 };
        const DRAFT_AREA_W = bounds.maxX - bounds.minX + GROUP_PADDING * 2;
        const DRAFT_AREA_H = bounds.maxY - bounds.minY + GROUP_PADDING * 2 + GROUP_TOP_PADDING;

        const tempRfNodes = userNodeDatas.map((n) => toReactFlowNode(n, null));
        const CARD_W = 232;
        const CARD_H = 186;
        const seedLayout = layoutThinkingNodesInGroup(tempRfNodes, 820);
        const seedMaxX = Math.max(0, ...seedLayout.map((n) => (n.position?.x ?? 0) + CARD_W));
        const seedMaxY = Math.max(0, ...seedLayout.map((n) => (n.position?.y ?? 0) + CARD_H));
        const thinkingAreaW = seedMaxX + 36;
        const thinkingAreaH = seedMaxY + 40;

        const groupW = Math.max(DRAFT_AREA_W, thinkingAreaW, 520);
        // Height는 원래 드래프트 위치(DRAFT_AREA_H)에 끌려 지나치게 커지는 문제가 있어
        // 실제 생성된 사고 노드(thinkingAreaH)를 기준으로 적당한 여유만 두고 계산한다.
        const GROUP_MIN_H = 360;
        const GROUP_EXTRA_MARGIN_H = 72;
        const groupH = Math.max(thinkingAreaH + GROUP_EXTRA_MARGIN_H, GROUP_MIN_H);

        const groupNode = {
          id: groupId,
          type: "ideaGroup",
          position: groupPos,
          data: {
            mode: "nodes",
            title: ids.length === 1 ? "Post-it idea" : `Draft bundle (${ids.length})`,
            onToggle: toggleIdeaGroupMode,
            category: "Insight",
            phase: "Problem",
          },
          style: { width: groupW, height: groupH, background: "transparent", border: "none", zIndex: 0 },
        };

        // Move drafts into group as children (grid layout so they don't dominate the space in Raw mode)
        const draftChildrenBase = draftNodes.map((n) => ({
          ...n,
          parentNode: groupId,
          extent: "parent",
          hidden: true, // nodes mode default
        }));
        const draftChildrenGrid = layoutDraftsInGroupGrid({ draftNodes: draftChildrenBase, groupW, groupH });
        const movedDrafts = draftChildrenGrid.map((n) => ({
          ...n,
          parentNode: groupId,
          extent: "parent",
          hidden: true,
        }));

        // Create thinking nodes inside group
        const laidOut = layoutThinkingNodesInGroup(tempRfNodes, groupW).map((n) => ({
          ...n,
          parentNode: groupId,
          extent: "parent",
          position: { x: n.position.x, y: n.position.y },
          hidden: false,
        }));

        // Merge nodes: remove drafts from base, then add group (behind) + moved drafts + new thinking nodes
        const otherNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => !ids.includes(n.id));
        const nextNodes = [...otherNodes, groupNode, ...movedDrafts, ...laidOut];

        // Route cross-boundary edges to groups (group-to-group / group-to-outside)
        const childToGroup = new Map();
        nextNodes.forEach((n) => {
          if (n?.parentNode && n.type === "thinkingNode") childToGroup.set(n.id, n.parentNode);
        });
        // include existing grouped thinking nodes already in state
        (Array.isArray(nodes) ? nodes : []).forEach((n) => {
          if (n?.parentNode && n.type === "thinkingNode") childToGroup.set(n.id, n.parentNode);
        });

        const routedRawEdges = [];
        const seenPairs = new Set();
        rawEdges.forEach((e) => {
          const src = e?.source;
          const tgt = e?.target;
          if (!src || !tgt) return;
          const sG = childToGroup.get(src);
          const tG = childToGroup.get(tgt);
          // Keep internal edges within same group
          let nextSource = src;
          let nextTarget = tgt;
          if (sG && tG && sG === tG) {
            // no change
          } else {
            if (sG) nextSource = sG;
            if (tG) nextTarget = tG;
          }
          if (nextSource === nextTarget) return;
          const key = `${nextSource}->${nextTarget}`;
          if (seenPairs.has(key)) return;
          seenPairs.add(key);
          routedRawEdges.push({ ...e, source: nextSource, target: nextTarget });
        });

        // Build edges (connector styling)
        const nextEdges = toConnectorEdges(routedRawEdges, nextNodes, edges);
        setNodes(nextNodes);
        setEdges((prev) => [...prev, ...nextEdges]);

        // Push suggestion to Tip shelf
        if (suggestionNodeData) {
          const newSuggestion = {
            id: `suggestion-${Date.now()}`,
            title: suggestionNodeData.data.label,
            content: suggestionNodeData.data.content,
            category: suggestionNodeData.data.category,
            phase: suggestionNodeData.data.phase,
            sourceType: suggestionNodeData.data.sourceType,
            visibility: suggestionNodeData.data.visibility,
            confidence: suggestionNodeData.data.confidence,
            suggestionTags: suggestionNodeData.data.suggestionTags || null,
            relatedNodeId: null,
          };
          setSuggestions?.((prev) => mergeSuggestionUnique(prev, newSuggestion));
        }

        setShowDraftConvertPrompt(false);
        setSelectedDraftIds([]);
      } catch (error) {
        const serverMsg = error?.response?.data?.error || error?.response?.data?.detail || error?.message;
        alert(serverMsg ? `Failed to analyze draft: ${serverMsg}` : "Failed to analyze draft. Please try again.");
      } finally {
        setIsAnalyzing(false);
        setDraftSubmittingIds((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [currentUserId, currentUserName, edges, isAnalyzing, nodes, setEdges, setIsAnalyzing, setNodes, setSuggestions, stage, toggleIdeaGroupMode]
  );

  // Keep a ref to the latest converter so draft nodes never call stale closures.
  convertDraftsToGroupRef.current = convertDraftsToGroup;

  const handleDraftSubmit = useCallback((nodeId) => {
    const fn = convertDraftsToGroupRef.current;
    if (typeof fn === "function") void fn([nodeId]);
  }, []);

  return {
    selectedDraftIds,
    setSelectedDraftIds,
    showDraftConvertPrompt,
    setShowDraftConvertPrompt,
    draftConvertIdsRef,
    selectionBoxEnabled,
    draftSubmittingIds,
    createPostitDraft,
    createImageDraft,
    handlePostitChangeText,
    handleImageChangeCaption,
    handleImagePick,
    handleDraftSubmit,
    handleSelectionChange,
    convertDraftsToGroup,
    toggleIdeaGroupMode,
  };
}
