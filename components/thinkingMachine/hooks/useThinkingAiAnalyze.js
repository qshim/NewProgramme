import { useCallback } from "react";
import { analyze } from "@/lib/thinkingMachine/apiClient";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { getNodeSnapshot } from "@/components/thinkingMachine/utils/graphSnapshots";
import { mergeSuggestionUnique } from "@/components/thinkingMachine/utils/suggestionUtils";
import { placeIncomingNodesPreservingLayout } from "@/lib/thinkingMachine/graphMerge";
import { normalizeRelationLabel, normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

export function useThinkingAiAnalyze({
  nodes,
  edges,
  stage,
  projectTitle,
  setNodes,
  setEdges,
  setSuggestions,
  setHighlightedNodeIds,
  setDrawerMode,
  setIsDrawerOpen,
  recordProjectActivity,
  animateViewportToNodes,
  setIsAnalyzing,
  setInputGuidance,
  uiLanguage = "en",
  modelProfile = "auto",
  currentUserId,
  currentUserName = "You",
}) {
  const handleInputSubmit = useCallback(
    async ({ text, preferredType, selectedNode: inputContextNode } = {}) => {
      const rawText = typeof text === "string" ? text.trim() : "";
      if (!rawText) return;
      setIsAnalyzing(true);

      try {
        const contextualText = inputContextNode
          ? [
              `Project: ${projectTitle}`,
              `Selected node context: [${inputContextNode.data?.category}] ${inputContextNode.data?.title} - ${
                inputContextNode.data?.content || ""
              }`,
              preferredType ? `Preferred new node type: ${preferredType}.` : "",
              `User follow-up: ${rawText}`,
            ]
              .filter(Boolean)
              .join("\n")
          : [projectTitle ? `Project: ${projectTitle}` : "", rawText].filter(Boolean).join("\n");

        const payload = {
          text: contextualText,
          history: nodes.map((n) => ({
            id: n.id,
            data: {
              title: n.data.title,
              category: n.data.category,
              phase: n.data.phase,
            },
            position: n.position,
          })),
          stage,
          uiLanguage,
          modelProfile,
        };

        const data = await analyze(payload);

        if (data?.status !== "ready" || data?.inputGuidance) {
          setInputGuidance?.(data?.inputGuidance || null);
          setDrawerMode("chat");
          setIsDrawerOpen(true);
          return;
        }

        setInputGuidance?.(null);

        const responseNodes = Array.isArray(data?.nodes) ? data.nodes : [];
        const responseEdges = Array.isArray(data?.edges) ? data.edges : [];
        const suggestionNodeData = responseNodes.find((n) => n.data.is_ai_generated);
        const userNodeDatas = responseNodes
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

        const suggestEdge = responseEdges.find((e) => e.id.startsWith("e-suggest-"));
        const highlightedMainNodeId = suggestEdge ? suggestEdge.source : null;
        const rawEdges = responseEdges.filter((e) => !e.id.startsWith("e-suggest-"));

        const rawNewNodes = userNodeDatas.map((n) => toReactFlowNode(n, highlightedMainNodeId));
        const enrichedNodes = placeIncomingNodesPreservingLayout(nodes, rawNewNodes, rawEdges, {
          anchorNode: inputContextNode || null,
        });
        const viewportTargets = inputContextNode ? [inputContextNode, ...enrichedNodes] : enrichedNodes;

        if (suggestionNodeData) {
          const newSuggestion = {
            id: `suggestion-${Date.now()}`,
            title: suggestionNodeData.data.label,
            content: suggestionNodeData.data.content,
            category: suggestionNodeData.data.category,
            phase: suggestionNodeData.data.phase,
            sourceType: suggestionNodeData.data.sourceType,
            visibility: normalizeVisibility(suggestionNodeData.data.visibility),
            confidence: suggestionNodeData.data.confidence,
            ownerId: suggestionNodeData.data.ownerId,
            suggestionTags: suggestionNodeData.data.suggestionTags || null,
            relatedNodeId: highlightedMainNodeId,
          };
          setSuggestions((prev) => mergeSuggestionUnique(prev, newSuggestion));
          if (highlightedMainNodeId) {
            setHighlightedNodeIds((prev) => new Set([...prev, highlightedMainNodeId]));
          }
        }

        const updatedExistingNodes = nodes.map((n) => ({
          ...n,
          className: n.className || "",
        }));
        const mergedNodes = [...updatedExistingNodes, ...enrichedNodes];
        const newReactFlowEdges = toConnectorEdges(
          rawEdges.map((e) => ({
            ...e,
            label: normalizeRelationLabel(e?.label),
          })),
          mergedNodes,
          edges
        );
        const nextEdges = [...edges, ...newReactFlowEdges];
        const insertedIds = new Set(enrichedNodes.map((node) => node.id));
        const insertedViewportTargets = inputContextNode
          ? mergedNodes.filter((node) => node.id === inputContextNode.id || insertedIds.has(node.id))
          : mergedNodes.filter((node) => insertedIds.has(node.id));

        setNodes(mergedNodes);
        setEdges(nextEdges);
        animateViewportToNodes(insertedViewportTargets.length ? insertedViewportTargets : viewportTargets);
        setDrawerMode("tip");
        setIsDrawerOpen(true);
        userNodeDatas.forEach((node) => {
          const targetNode = mergedNodes.find((item) => item.id === node.id);
          const snapshot = getNodeSnapshot(targetNode, nextEdges);
          void recordProjectActivity("node_created", {
            nodeId: node.id,
            nodeTitle: node?.data?.label,
            nodeType: node?.data?.category,
            before: null,
            after: snapshot,
            relatedNodeIds: snapshot?.linkedNodeIds || [],
            stage,
          });
          if (node?.data?.category === "Conflict") {
            void recordProjectActivity("conflict_created", {
              nodeId: node.id,
              nodeTitle: node?.data?.label,
              nodeType: node?.data?.category,
              before: null,
              after: snapshot,
              relatedNodeIds: snapshot?.linkedNodeIds || [],
              stage,
            });
          }
        });
      } catch (error) {
        console.error("Failed to analyze input:", error);
        const serverMsg =
          error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message;
        const fallbackMessage = getWorkspaceCopy(uiLanguage).errors.analyze;
        alert(serverMsg ? `AI Agent: ${serverMsg}` : fallbackMessage);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [
      animateViewportToNodes,
      currentUserId,
      currentUserName,
      edges,
      nodes,
      projectTitle,
      recordProjectActivity,
      setDrawerMode,
      setEdges,
      setHighlightedNodeIds,
      setIsAnalyzing,
      setInputGuidance,
      setIsDrawerOpen,
      setNodes,
      setSuggestions,
      stage,
      uiLanguage,
      modelProfile,
    ]
  );

  return { handleInputSubmit };
}
