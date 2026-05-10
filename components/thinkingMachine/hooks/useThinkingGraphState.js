import { useMemo } from "react";
import { normalizeOwnerId, normalizeRelationLabel, normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";
import { NODE_CARD_TOKENS } from "@/lib/thinkingMachine/reactflowTransforms";

const PERSONAL_VISIBILITY = new Set(["private", "candidate"]);
const TEAM_VISIBILITY = new Set(["shared", "reviewed", "agreed"]);

export function useThinkingGraphState({ nodes, edges, selectedNodeId, canvasMode, currentUserId }) {
  const hasThinkingGraph = useMemo(() => {
    return nodes.some(
      (n) =>
        n?.type === "thinkingNode" ||
        n?.type === "ideaGroup" ||
        n?.type === "postitDraft" ||
        n?.type === "imageDraft"
    );
  }, [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node?.id === selectedNodeId && node?.type === "thinkingNode") || null,
    [nodes, selectedNodeId]
  );

  const visibleCanvasNodeIds = useMemo(() => {
    const visibleIds = new Set();

    const isThinkingNodeVisible = (node) => {
      const visibility = normalizeVisibility(node?.data?.visibility);
      const ownerId = normalizeOwnerId(node?.data?.ownerId);
      if (canvasMode === "personal") return ownerId === currentUserId && PERSONAL_VISIBILITY.has(visibility);
      return TEAM_VISIBILITY.has(visibility);
    };

    nodes.forEach((node) => {
      if (!node?.id) return;

      if (node.type === "thinkingNode") {
        if (isThinkingNodeVisible(node)) {
          visibleIds.add(node.id);
          if (node.parentNode) visibleIds.add(node.parentNode);
        }
        return;
      }

      if (canvasMode === "personal" && (node.type === "postitDraft" || node.type === "imageDraft")) {
        visibleIds.add(node.id);
        if (node.parentNode) visibleIds.add(node.parentNode);
        return;
      }

      if (node.type === "ideaGroup") {
        const hasVisibleChildren = nodes.some(
          (candidate) => candidate?.parentNode === node.id && visibleIds.has(candidate.id)
        );
        if (hasVisibleChildren) visibleIds.add(node.id);
      }
    });

    nodes.forEach((node) => {
      if (node?.type === "ideaGroup") {
        const hasVisibleChildren = nodes.some(
          (candidate) => candidate?.parentNode === node.id && visibleIds.has(candidate.id)
        );
        if (hasVisibleChildren) visibleIds.add(node.id);
      }
    });

    return visibleIds;
  }, [canvasMode, currentUserId, nodes]);

  const canvasNodes = useMemo(
    () =>
      nodes
        .filter((node) => visibleCanvasNodeIds.has(node.id))
        .map((node) => ({
          ...node,
          ...(node?.type === "thinkingNode"
            ? {
                style: {
                  ...(node.style || {}),
                  width: NODE_CARD_TOKENS.width,
                  minWidth: NODE_CARD_TOKENS.width,
                  maxWidth: NODE_CARD_TOKENS.width,
                },
              }
            : {}),
          className: [node.className || "", node.id === selectedNodeId ? "node-selected-focus" : ""]
            .filter(Boolean)
            .join(" "),
        })),
    [nodes, selectedNodeId, visibleCanvasNodeIds]
  );

  const canvasEdges = useMemo(
    () => edges.filter((edge) => visibleCanvasNodeIds.has(edge?.source) && visibleCanvasNodeIds.has(edge?.target)),
    [edges, visibleCanvasNodeIds]
  );

  const selectedNodeLinkedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    return edges
      .filter((edge) => edge?.source === selectedNode.id || edge?.target === selectedNode.id)
      .map((edge) => {
        const isOutgoing = edge.source === selectedNode.id;
        const linkedId = isOutgoing ? edge.target : edge.source;
        const linkedNode = nodeMap.get(linkedId);
        if (!linkedNode || linkedNode.type !== "thinkingNode") return null;
        return {
          id: linkedNode.id,
          title: linkedNode.data?.title || "Untitled node",
          category: linkedNode.data?.category,
          visibility: linkedNode.data?.visibility,
          relation: normalizeRelationLabel(edge?.data?.label || edge?.label),
          direction: isOutgoing ? "outgoing" : "incoming",
        };
      })
      .filter(Boolean);
  }, [edges, nodes, selectedNode]);

  return {
    hasThinkingGraph,
    selectedNode,
    visibleCanvasNodeIds,
    canvasNodes,
    canvasEdges,
    selectedNodeLinkedNodes,
  };
}

