"use client";

import { useCallback, useMemo } from "react";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import {
  relayoutTopLevelThinkingNodes,
  shiftClusterRightOfExisting,
} from "@/lib/thinkingMachine/graphMerge";
import { normalizeRelationLabel, normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";
import {
  getNodeSnapshot,
  getRelatedNodeIds,
} from "@/components/thinkingMachine/utils/graphSnapshots";

export function useChatGraphIngest({
  nodes,
  edges,
  currentUserId,
  currentUserName,
  normalizedStage,
  setNodes,
  setEdges,
  setActiveSuggestion,
  pendingChatCandidateGraph,
  setPendingChatCandidateGraph,
  animateViewportToNodes,
  recordProjectActivity,
}) {
  const handleAddNodesFromChat = useCallback((data, { commitVisibility = "shared" } = {}) => {
    const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
    const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
    const normalizedIncoming = incoming.map((node) => ({
      ...node,
      data: {
        ...node.data,
        ownerId: currentUserId,
        editedBy: currentUserName,
        visibility: normalizeVisibility(
          node?.data?.visibility === "candidate" ? commitVisibility : node?.data?.visibility
        ),
      },
    }));
    const rawNewNodes = normalizedIncoming.map((node) => toReactFlowNode(node, null));
    const seededNodes = nodes.length ? shiftClusterRightOfExisting(nodes, rawNewNodes) : rawNewNodes;
    const mergedNodes = [...nodes, ...seededNodes];
    const nextEdges = [...edges, ...toConnectorEdges(incomingEdges, mergedNodes, edges)];
    const relaidNodes = relayoutTopLevelThinkingNodes(mergedNodes, nextEdges);
    const insertedIds = new Set(seededNodes.map((node) => node.id));

    setNodes(relaidNodes);
    setEdges(nextEdges);
    animateViewportToNodes(relaidNodes.filter((node) => insertedIds.has(node.id)));
    normalizedIncoming.forEach((node) => {
      const targetNode = relaidNodes.find((item) => item.id === node.id);
      const relatedNodeIds = getRelatedNodeIds(node.id, nextEdges);
      void recordProjectActivity("node_created", {
        nodeId: node.id,
        nodeTitle: node?.data?.label,
        nodeType: node?.data?.category,
        before: null,
        after: getNodeSnapshot(targetNode, nextEdges),
        relatedNodeIds,
        stage: normalizedStage,
      });
      if (node?.data?.category === "Conflict") {
        void recordProjectActivity("conflict_created", {
          nodeId: node.id,
          nodeTitle: node?.data?.label,
          nodeType: node?.data?.category,
          before: null,
          after: getNodeSnapshot(targetNode, nextEdges),
          relatedNodeIds,
          stage: normalizedStage,
        });
      }
    });
  }, [
    animateViewportToNodes,
    currentUserId,
    currentUserName,
    edges,
    nodes,
    normalizedStage,
    recordProjectActivity,
    setEdges,
    setNodes,
  ]);

  const handlePreviewNodesFromChat = useCallback((data) => {
    const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
    const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
    if (!incoming.length) return;

    handleAddNodesFromChat(
      {
        nodes: incoming.map((node) => ({
          ...node,
          data: {
            ...node.data,
            ownerId: currentUserId,
            editedBy: currentUserName,
            visibility: "candidate",
          },
        })),
        edges: incomingEdges.map((edge) => ({
          ...edge,
          label: normalizeRelationLabel(edge?.label),
        })),
      },
      { commitVisibility: "candidate" }
    );

    setActiveSuggestion(null);
    setPendingChatCandidateGraph(null);
  }, [currentUserId, currentUserName, handleAddNodesFromChat, setActiveSuggestion, setPendingChatCandidateGraph]);

  const handleCommitCandidateNodes = useCallback(() => {
    if (!pendingChatCandidateGraph) return;
    handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "candidate" });
    setPendingChatCandidateGraph(null);
    setActiveSuggestion(null);
  }, [handleAddNodesFromChat, pendingChatCandidateGraph, setActiveSuggestion, setPendingChatCandidateGraph]);

  const handleCommitCandidateNodesAsPrivate = useCallback(() => {
    if (!pendingChatCandidateGraph) return;
    handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "private" });
    setPendingChatCandidateGraph(null);
    setActiveSuggestion(null);
  }, [handleAddNodesFromChat, pendingChatCandidateGraph, setActiveSuggestion, setPendingChatCandidateGraph]);

  const handleDiscardCandidateNodes = useCallback(() => {
    setPendingChatCandidateGraph(null);
    setActiveSuggestion(null);
  }, [setActiveSuggestion, setPendingChatCandidateGraph]);

  const pendingCandidatePreview = useMemo(() => {
    if (!pendingChatCandidateGraph) return null;
    return {
      ...pendingChatCandidateGraph,
      nodes: pendingChatCandidateGraph.nodes.map((node) => toReactFlowNode(node, null)),
    };
  }, [pendingChatCandidateGraph]);

  return {
    handleAddNodesFromChat,
    handlePreviewNodesFromChat,
    handleCommitCandidateNodes,
    handleCommitCandidateNodesAsPrivate,
    handleDiscardCandidateNodes,
    pendingCandidatePreview,
  };
}
