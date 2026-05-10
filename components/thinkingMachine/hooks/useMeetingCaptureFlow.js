"use client";

import { useCallback } from "react";
import { ingestMeetingChunk } from "@/lib/thinkingMachine/apiClient";
import { mergeMeetingMemory } from "@/lib/thinkingMachine/meetingMemory";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import {
  relayoutTopLevelThinkingNodes,
  shiftClusterRightOfExisting,
} from "@/lib/thinkingMachine/graphMerge";
import { normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";

export function useMeetingCaptureFlow({
  projectId,
  projectTitle,
  nodes,
  edges,
  currentUserId,
  currentUserName,
  normalizedStage,
  meetingMemory,
  meetingMemoryReadout,
  meetingSessionIdRef,
  setNodes,
  setEdges,
  setMeetingMemory,
  setMeetingCaptureSummary,
  setIsMeetingCaptureLoading,
  setTeamContextError,
  setIsTeamContextPanelOpen,
  setHighlightedNodeIds,
  animateViewportToNodes,
  recordProjectActivity,
}) {
  const applyMeetingGraphPatch = useCallback((graphPatch = {}) => {
    const incomingNodes = Array.isArray(graphPatch?.nodes) ? graphPatch.nodes : [];
    const incomingEdges = Array.isArray(graphPatch?.edges) ? graphPatch.edges : [];
    if (!incomingNodes.length && !incomingEdges.length) {
      return {
        nextNodes: nodes,
        nextEdges: edges,
        createdNodeIds: [],
      };
    }

    const normalizedIncoming = incomingNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        ownerId: node?.data?.ownerId || currentUserId,
        editedBy: currentUserName,
        visibility: normalizeVisibility(node?.data?.visibility),
      },
    }));
    const rawNewNodes = normalizedIncoming.map((node) => toReactFlowNode(node, null));
    const placedNodes = nodes.length ? shiftClusterRightOfExisting(nodes, rawNewNodes) : rawNewNodes;
    const mergedNodes = [...nodes, ...placedNodes];
    const existingEdgeIds = new Set(edges.map((edge) => edge.id));
    const nextRawEdges = incomingEdges.filter((edge) => edge?.id && !existingEdgeIds.has(edge.id));
    const nextConnectorEdges = toConnectorEdges(nextRawEdges, mergedNodes, edges);
    const nextEdges = [...edges, ...nextConnectorEdges];
    const relaidNodes = relayoutTopLevelThinkingNodes(mergedNodes, nextEdges);

    setNodes(relaidNodes);
    setEdges(nextEdges);

    return {
      nextNodes: relaidNodes,
      nextEdges,
      createdNodeIds: placedNodes.map((node) => node.id),
    };
  }, [currentUserId, currentUserName, edges, nodes, setEdges, setNodes]);

  const handleMeetingCaptureSubmit = useCallback(async (chunkText) => {
    if (!projectId) return;

    const trimmedChunk = String(chunkText || "").trim();
    if (!trimmedChunk) return;

    const existingThinkingNodes = nodes
      .filter((node) => node?.type === "thinkingNode")
      .map((node) => ({
        id: node.id,
        data: {
          title: node?.data?.title || "",
          content: node?.data?.content || "",
          category: node?.data?.category,
          phase: node?.data?.phase,
        },
        position: node.position,
      }));

    setIsMeetingCaptureLoading(true);
    setTeamContextError("");
    try {
      const result = await ingestMeetingChunk(projectId, {
        projectTitle,
        chunkText: trimmedChunk,
        chunkType: "speaker_turn",
        speakerName: currentUserName,
        meetingSessionId: meetingSessionIdRef.current,
        existing_nodes: existingThinkingNodes,
        meeting_memory: {
          working: {
            activeIssueTitles: meetingMemoryReadout.activeIssues.map((item) => item.title),
            unresolvedQuestions: meetingMemoryReadout.unresolvedQuestions.map((item) => item.title),
            decisionCandidates: meetingMemoryReadout.decisionCandidates.map((item) => item.title),
            repeatedIssueKeys: meetingMemoryReadout.repeatedIssues,
          },
          executive: {
            currentDirection: meetingMemoryReadout.currentDirection,
            unresolvedAreas: meetingMemoryReadout.unresolvedAreas,
            nextStepImplications: meetingMemoryReadout.nextStepImplications,
          },
        },
        stage: normalizedStage,
      });

      const mergeResult = applyMeetingGraphPatch(result?.graphPatch || {});
      const nextMeetingMemory = mergeMeetingMemory(meetingMemory, result?.memoryPatch || {});
      setMeetingMemory(nextMeetingMemory);
      setMeetingCaptureSummary(result?.meetingSummary || null);
      setIsTeamContextPanelOpen(true);

      const focusIds = result?.meetingSummary?.linkedNodeIds || mergeResult.createdNodeIds;
      if (focusIds?.length) {
        setHighlightedNodeIds(new Set(focusIds));
        const targetNodes = mergeResult.nextNodes.filter((node) => focusIds.includes(node.id));
        if (targetNodes.length) animateViewportToNodes(targetNodes);
      }

      void recordProjectActivity("meeting_chunk_ingested", {
        nodeTitle: result?.meetingSummary?.chunkSummary || trimmedChunk.slice(0, 80),
        nodeType: "MeetingChunk",
        relatedNodeIds: result?.meetingSummary?.linkedNodeIds || [],
        stage: normalizedStage,
        metadata: {
          chunkType: "speaker_turn",
          createdNodeIds: result?.meetingSummary?.createdNodeIds || [],
          strengthenedNodeIds: result?.meetingSummary?.strengthenedNodeIds || [],
          repeatedIssueKeys: result?.meetingSummary?.repeatedIssueKeys || [],
        },
      });
    } catch (error) {
      setTeamContextError(
        error?.response?.data?.error ||
        error?.message ||
        "Failed to ingest the meeting chunk."
      );
    } finally {
      setIsMeetingCaptureLoading(false);
    }
  }, [
    animateViewportToNodes,
    applyMeetingGraphPatch,
    currentUserName,
    meetingMemory,
    meetingMemoryReadout.activeIssues,
    meetingMemoryReadout.currentDirection,
    meetingMemoryReadout.decisionCandidates,
    meetingMemoryReadout.nextStepImplications,
    meetingMemoryReadout.repeatedIssues,
    meetingMemoryReadout.unresolvedAreas,
    meetingMemoryReadout.unresolvedQuestions,
    meetingSessionIdRef,
    nodes,
    normalizedStage,
    projectId,
    projectTitle,
    recordProjectActivity,
    setHighlightedNodeIds,
    setIsMeetingCaptureLoading,
    setIsTeamContextPanelOpen,
    setMeetingCaptureSummary,
    setMeetingMemory,
    setTeamContextError,
  ]);

  return {
    applyMeetingGraphPatch,
    handleMeetingCaptureSubmit,
  };
}
