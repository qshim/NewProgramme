import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchProject,
  fetchProjectActivity,
  fetchProjectMembers,
  recordProjectActivity as postProjectActivity,
  registerProjectMember,
} from "@/lib/thinkingMachine/apiClient";

export function useThinkingCollaboration({
  projectId,
  currentUserId,
  currentUserRole = "editor",
  currentUserName = "You",
  currentUserEmail = "",
  currentUserPicture = "",
  autoRefreshMs = 15000,
} = {}) {
  const [projectLastUpdated, setProjectLastUpdated] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const actor = useMemo(
    () => ({
      id: currentUserId,
      name: currentUserName,
      email: currentUserEmail,
      picture: currentUserPicture,
      role: currentUserRole,
    }),
    [currentUserEmail, currentUserId, currentUserName, currentUserPicture, currentUserRole]
  );

  const refreshProjectCollaborationMeta = useCallback(async () => {
    if (!projectId) return;
    try {
      const [project, nextActivity, nextMembers] = await Promise.all([
        fetchProject(projectId),
        fetchProjectActivity(projectId),
        fetchProjectMembers(projectId),
      ]);
      startTransition(() => {
        setProjectLastUpdated(project?.updatedAt || null);
        setActivityLog(Array.isArray(nextActivity) ? nextActivity : []);
        setTeamMembers(Array.isArray(nextMembers) ? nextMembers : []);
        setLastRefreshedAt(new Date().toISOString());
      });
    } catch {
      startTransition(() => {
        setLastRefreshedAt(new Date().toISOString());
      });
    }
  }, [projectId]);

  const recordProjectActivity = useCallback(
    async (actionType, payload = {}) => {
      if (!projectId || !currentUserId) return null;
      const entry = await postProjectActivity(projectId, {
        actionType,
        actor,
        ...payload,
      });
      await refreshProjectCollaborationMeta();
      return entry;
    },
    [actor, currentUserId, projectId, refreshProjectCollaborationMeta]
  );

  const registerCurrentUser = useCallback(async () => {
    if (!projectId || !currentUserId) return [];
    const members = await registerProjectMember(projectId, actor);
    startTransition(() => {
      setTeamMembers(Array.isArray(members) ? members : []);
      setLastRefreshedAt(new Date().toISOString());
    });
    return members;
  }, [actor, currentUserId, projectId]);

  const currentMember = useMemo(
    () => teamMembers.find((member) => member?.id === currentUserId) || null,
    [currentUserId, teamMembers]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!projectId || !currentUserId) return;
      try {
        if (!cancelled) await refreshProjectCollaborationMeta();
      } catch {
        if (!cancelled) setLastRefreshedAt(new Date().toISOString());
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, projectId, refreshProjectCollaborationMeta]);

  useEffect(() => {
    if (!projectId) return undefined;
    const intervalId = window.setInterval(() => {
      void refreshProjectCollaborationMeta();
    }, autoRefreshMs);
    return () => window.clearInterval(intervalId);
  }, [autoRefreshMs, projectId, refreshProjectCollaborationMeta]);

  return {
    projectLastUpdated,
    activityLog,
    teamMembers,
    currentMember,
    currentUserRole: currentMember?.role || currentUserRole,
    lastRefreshedAt,
    refreshProjectCollaborationMeta,
    recordProjectActivity,
    registerCurrentUser,
  };
}

