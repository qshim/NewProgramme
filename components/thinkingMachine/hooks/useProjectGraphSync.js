"use client";

import { useEffect } from "react";
import {
  fetchProjectGraph,
  saveProjectGraph,
  updateProject,
} from "@/lib/thinkingMachine/apiClient";
import {
  getDefaultMeetingMemory,
} from "@/lib/thinkingMachine/meetingMemory";
import {
  hydrateProjectEdges,
  hydrateProjectNodes,
  serializeProjectGraph,
} from "@/lib/thinkingMachine/projectGraph";

export function useProjectGraphSync({
  projectId,
  nodes,
  edges,
  normalizedStage,
  meetingMemory,
  currentUserId,
  currentUserName,
  currentUserEmail,
  currentUserPicture,
  effectiveCurrentUserRole,
  isGraphHydrating,
  setNodes,
  setEdges,
  setStage,
  setMeetingMemory,
  setProjectTitle,
  setHasStartedInput,
  setIsGraphHydrating,
  refreshProjectCollaborationMeta,
  lastSavedGraphRef,
  lastSyncedTitleRef,
  projectTitle,
}) {
  useEffect(() => {
    let cancelled = false;
    const hydrateGraph = async () => {
      if (!projectId) {
        setIsGraphHydrating(false);
        return;
      }
      try {
        const payload = await fetchProjectGraph(projectId);
        if (cancelled) return;
        const hydratedNodes = hydrateProjectNodes(payload?.graph?.nodes || []);
        const hydratedEdges = hydrateProjectEdges(payload?.graph?.edges || []);
        const nextStage = payload?.graph?.stage || "research-diverge";
        const nextMeetingMemory = payload?.meetingMemory || getDefaultMeetingMemory();
        setNodes(hydratedNodes);
        setEdges(hydratedEdges);
        setStage(nextStage);
        setMeetingMemory(nextMeetingMemory);
        if (payload?.project?.title) {
          setProjectTitle(payload.project.title);
          lastSyncedTitleRef.current = payload.project.title;
        }
        setHasStartedInput(hydratedNodes.some((node) => node?.type === "thinkingNode"));
        lastSavedGraphRef.current = JSON.stringify({
          graph: serializeProjectGraph(hydratedNodes, hydratedEdges, nextStage),
          meetingMemory: nextMeetingMemory,
        });
      } catch (error) {
        console.error("Failed to hydrate project graph:", error);
      } finally {
        if (!cancelled) setIsGraphHydrating(false);
      }
    };

    void hydrateGraph();
    return () => {
      cancelled = true;
    };
  }, [
    lastSavedGraphRef,
    lastSyncedTitleRef,
    projectId,
    setEdges,
    setHasStartedInput,
    setIsGraphHydrating,
    setMeetingMemory,
    setNodes,
    setProjectTitle,
    setStage,
  ]);

  useEffect(() => {
    if (!projectId || !currentUserId || isGraphHydrating) return undefined;
    const timeoutId = window.setTimeout(async () => {
      const serialized = serializeProjectGraph(nodes, edges, normalizedStage);
      const nextKey = JSON.stringify({
        graph: serialized,
        meetingMemory,
      });
      if (nextKey === lastSavedGraphRef.current) return;
      try {
        await saveProjectGraph(projectId, {
          ...serialized,
          meetingMemory,
          actor: {
            id: currentUserId,
            name: currentUserName,
            email: currentUserEmail,
            picture: currentUserPicture,
            role: effectiveCurrentUserRole,
          },
        });
        lastSavedGraphRef.current = nextKey;
      } catch (error) {
        console.error("Failed to persist graph:", error);
      }
    }, 450);
    return () => window.clearTimeout(timeoutId);
  }, [
    currentUserEmail,
    currentUserId,
    currentUserName,
    currentUserPicture,
    edges,
    effectiveCurrentUserRole,
    isGraphHydrating,
    lastSavedGraphRef,
    meetingMemory,
    nodes,
    normalizedStage,
    projectId,
  ]);

  useEffect(() => {
    if (!projectId || !currentUserId || isGraphHydrating) return undefined;
    const nextTitle = String(projectTitle || "").trim() || "Untitled Project";
    if (nextTitle === lastSyncedTitleRef.current) return undefined;
    const timeoutId = window.setTimeout(async () => {
      try {
        await updateProject(projectId, {
          title: nextTitle,
          actor: {
            id: currentUserId,
            name: currentUserName,
            email: currentUserEmail,
            picture: currentUserPicture,
            role: effectiveCurrentUserRole,
          },
        });
        lastSyncedTitleRef.current = nextTitle;
        await refreshProjectCollaborationMeta?.();
      } catch (error) {
        console.error("Failed to sync project title:", error);
      }
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [
    currentUserEmail,
    currentUserId,
    currentUserName,
    currentUserPicture,
    effectiveCurrentUserRole,
    isGraphHydrating,
    lastSyncedTitleRef,
    projectId,
    projectTitle,
    refreshProjectCollaborationMeta,
  ]);
}
