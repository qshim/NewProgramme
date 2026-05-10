import {
  getDefaultMeetingMemory,
  sanitizeMeetingMemory,
} from "@/lib/thinkingMachine/meetingMemory";

export const MAX_PROJECT_ACTIVITY_ITEMS = 80;

function cleanString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function matchesMember(project, currentUserId) {
  if (typeof currentUserId !== "string" || !currentUserId.trim()) return false;
  return (Array.isArray(project?.members) ? project.members : []).some((member) => member?.id === currentUserId.trim());
}

export function createSanitizeMember({ generateId, nowIso }) {
  return function sanitizeMember(member = {}) {
    const id = cleanString(member.id, generateId("user"));
    return {
      id,
      name: cleanString(member.name, "Unknown teammate"),
      email: typeof member.email === "string" ? member.email.trim() : "",
      picture: typeof member.picture === "string" ? member.picture.trim() : "",
      role: cleanString(member.role, "editor"),
      lastSeenAt: nowIso(),
    };
  };
}

export function createSanitizeProject({ sanitizeMember, nowIso, maxActivityItems = MAX_PROJECT_ACTIVITY_ITEMS, generateProjectId }) {
  return function sanitizeProject(project = {}) {
    const timestamp = nowIso();
    return {
      id: typeof generateProjectId === "function"
        ? cleanString(project.id, generateProjectId("project"))
        : project.id,
      title: cleanString(project.title, "Untitled Project"),
      createdAt: project.createdAt || timestamp,
      updatedAt: project.updatedAt || timestamp,
      graph: {
        nodes: Array.isArray(project?.graph?.nodes) ? project.graph.nodes : [],
        edges: Array.isArray(project?.graph?.edges) ? project.graph.edges : [],
        stage: cleanString(project?.graph?.stage, "research-diverge"),
        updatedAt: project?.graph?.updatedAt || project.updatedAt || timestamp,
      },
      meetingMemory: sanitizeMeetingMemory(project?.meetingMemory || getDefaultMeetingMemory()),
      activity: Array.isArray(project.activity) ? project.activity.slice(0, maxActivityItems) : [],
      members: Array.isArray(project.members) ? project.members.map(sanitizeMember) : [],
    };
  };
}

export function getProjectSummary(project) {
  const currentUserId =
    arguments.length > 1 && typeof arguments[1] === "string"
      ? arguments[1].trim()
      : "";
  return {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    members: project.members,
    memberCount: Array.isArray(project.members) ? project.members.length : 0,
    isMember: matchesMember(project, currentUserId),
  };
}

export function createUpsertMember({ sanitizeMember, nowIso }) {
  return function upsertMember(project, member, preferredRole) {
    const safeMember = sanitizeMember({
      ...member,
      role: preferredRole || member?.role || (project.members.length === 0 ? "owner" : "editor"),
    });
    const index = project.members.findIndex((item) => item.id === safeMember.id);
    if (index === -1) {
      project.members.unshift(safeMember);
      return safeMember;
    }
    project.members[index] = {
      ...project.members[index],
      ...safeMember,
      role: project.members[index].role || safeMember.role,
      lastSeenAt: nowIso(),
    };
    return project.members[index];
  };
}

export function createActivityEntry({ activity, timestamp, stage, generateId }) {
  return {
    id: activity.id || generateId("activity"),
    type:
      cleanString(activity.actionType) ||
      cleanString(activity.type, "activity"),
    timestamp,
    stage: cleanString(activity.stage, stage),
    userId: activity?.actor?.id || activity.userId || "unknown-user",
    userName: activity?.actor?.name || activity.userName || "Unknown teammate",
    userRole: activity?.actor?.role || activity.userRole || "editor",
    nodeId: activity.nodeId || null,
    nodeTitle: activity.nodeTitle || "",
    nodeType: activity.nodeType || "",
    before: activity.before || null,
    after: activity.after || null,
    relatedNodeIds: Array.isArray(activity.relatedNodeIds) ? activity.relatedNodeIds.filter(Boolean) : [],
    metadata: activity.metadata && typeof activity.metadata === "object" ? activity.metadata : {},
  };
}
