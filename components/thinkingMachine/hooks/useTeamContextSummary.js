"use client";

import { useCallback, useMemo } from "react";
import { summarizeTeamContext } from "@/lib/thinkingMachine/apiClient";

export function useTeamContextSummary({
  activityLog,
  teamMembers,
  selectedTeamMemberId,
  setSelectedTeamMemberId,
  selectedActivityEventId,
  setSelectedActivityEventId,
  setTeamContextSummary,
  setIsTeamContextLoading,
  setTeamContextError,
  nodes,
  focusNodesByIds,
  normalizedStage,
  projectId,
  projectTitle,
}) {
  const filteredTeamActivity = useMemo(() => {
    const items = Array.isArray(activityLog) ? activityLog : [];
    if (!selectedTeamMemberId) return items;
    return items.filter((item) => item?.userId === selectedTeamMemberId);
  }, [activityLog, selectedTeamMemberId]);

  const selectedActivityItem = useMemo(
    () => filteredTeamActivity.find((item) => item?.id === selectedActivityEventId) || null,
    [filteredTeamActivity, selectedActivityEventId]
  );

  const handleSelectTeamMember = useCallback((memberId) => {
    setSelectedTeamMemberId(memberId);
    setSelectedActivityEventId(null);
    setTeamContextSummary(null);
    setTeamContextError("");
  }, [setSelectedActivityEventId, setSelectedTeamMemberId, setTeamContextError, setTeamContextSummary]);

  const handleSelectActivity = useCallback((item) => {
    if (!item) return;
    setSelectedActivityEventId(item.id);
    if (item?.userId) setSelectedTeamMemberId(item.userId);
    setTeamContextSummary(null);
    setTeamContextError("");
    focusNodesByIds([item.nodeId, ...(item.relatedNodeIds || [])]);
  }, [
    focusNodesByIds,
    setSelectedActivityEventId,
    setSelectedTeamMemberId,
    setTeamContextError,
    setTeamContextSummary,
  ]);

  const handleExplainTeamContext = useCallback(async () => {
    const eventScope = selectedActivityItem ? [selectedActivityItem] : filteredTeamActivity.slice(0, 8);
    const relatedNodeIds = Array.from(
      new Set(
        eventScope
          .flatMap((item) => [item?.nodeId, ...((Array.isArray(item?.relatedNodeIds) ? item.relatedNodeIds : []))])
          .filter(Boolean)
      )
    );
    const relatedNodes = nodes
      .filter((node) => relatedNodeIds.includes(node.id))
      .map((node) => ({
        id: node.id,
        title: node?.data?.title || "",
        content: node?.data?.content || "",
        category: node?.data?.category,
        phase: node?.data?.phase,
      }));

    setIsTeamContextLoading(true);
    setTeamContextError("");
    try {
      const member = teamMembers.find((item) => item?.id === selectedTeamMemberId) || null;
      const result = await summarizeTeamContext({
        projectId,
        projectTitle,
        memberId: member?.id || null,
        memberName: member?.name || "",
        memberRole: member?.role || "",
        activityEvents: eventScope,
        relatedNodes,
        stage: normalizedStage,
      });
      setTeamContextSummary(result);
      if (Array.isArray(result?.keyNodeIds) && result.keyNodeIds.length) {
        focusNodesByIds(result.keyNodeIds);
      }
    } catch (error) {
      setTeamContextError(
        error?.response?.data?.error ||
        error?.message ||
        "Failed to summarize the team context."
      );
    } finally {
      setIsTeamContextLoading(false);
    }
  }, [
    filteredTeamActivity,
    focusNodesByIds,
    nodes,
    normalizedStage,
    projectId,
    projectTitle,
    selectedActivityItem,
    selectedTeamMemberId,
    setIsTeamContextLoading,
    setTeamContextError,
    setTeamContextSummary,
    teamMembers,
  ]);

  return {
    filteredTeamActivity,
    selectedActivityItem,
    handleSelectTeamMember,
    handleSelectActivity,
    handleExplainTeamContext,
  };
}
