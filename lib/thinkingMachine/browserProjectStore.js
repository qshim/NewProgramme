"use client";

import { getDefaultMeetingMemory, sanitizeMeetingMemory } from "@/lib/thinkingMachine/meetingMemory";
import {
  createActivityEntry,
  createSanitizeMember,
  createSanitizeProject,
  createUpsertMember,
  getProjectSummary,
  MAX_PROJECT_ACTIVITY_ITEMS,
} from "@/lib/thinkingMachine/projectStoreShared";

const STORE_KEY = "thinking-machine-browser-store-v1";
const MAX_ACTIVITY_ITEMS = MAX_PROJECT_ACTIVITY_ITEMS;

const DEFAULT_STORE = {
  projects: {},
};

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStore() {
  if (!canUseStorage()) return { ...DEFAULT_STORE };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw);
    return {
      projects: parsed?.projects && typeof parsed.projects === "object" ? parsed.projects : {},
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function writeStore(store) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

const sanitizeMember = createSanitizeMember({
  generateId,
  nowIso,
});

const sanitizeProject = createSanitizeProject({
  sanitizeMember,
  nowIso,
  maxActivityItems: MAX_ACTIVITY_ITEMS,
  generateProjectId: generateId,
});

const upsertMember = createUpsertMember({ sanitizeMember, nowIso });

function mutateProject(projectId, updater) {
  const store = readStore();
  const existing = sanitizeProject(store.projects[projectId] || { id: projectId });
  const nextProject = sanitizeProject(updater(existing));
  store.projects[projectId] = nextProject;
  writeStore(store);
  return nextProject;
}

function normalizeProjectListQuery({ currentUserId = "", query = "", scope = "member" } = {}) {
  return {
    currentUserId: typeof currentUserId === "string" ? currentUserId.trim() : "",
    query: typeof query === "string" ? query.trim().toLowerCase() : "",
    scope: scope === "discover" ? "discover" : "member",
  };
}

function isProjectMember(project, currentUserId) {
  if (!currentUserId) return false;
  return Array.isArray(project?.members) && project.members.some((member) => member?.id === currentUserId);
}

export function listBrowserProjects(options = {}) {
  const { currentUserId, query, scope } = normalizeProjectListQuery(options);
  const store = readStore();
  return Object.values(store.projects)
    .map((project) => sanitizeProject(project))
    .filter((project) => {
      if (query && !String(project?.title || "").toLowerCase().includes(query)) return false;
      if (scope === "member" && currentUserId) return isProjectMember(project, currentUserId);
      return true;
    })
    .map((project) => getProjectSummary(project, currentUserId))
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export function createBrowserProject({ title, actor } = {}) {
  const timestamp = nowIso();
  const id = generateId("project");
  const member = sanitizeMember({ ...actor, role: "owner" });
  const project = sanitizeProject({
    id,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    graph: {
      nodes: [],
      edges: [],
      stage: "research-diverge",
      updatedAt: timestamp,
    },
    activity: [],
    members: [member],
  });
  const store = readStore();
  store.projects[id] = project;
  writeStore(store);
  return project;
}

export function getBrowserProject(projectId) {
  if (!projectId) return null;
  const store = readStore();
  const project = store.projects[projectId];
  return project ? sanitizeProject(project) : null;
}

export function updateBrowserProject(projectId, patch = {}) {
  return mutateProject(projectId, (project) => {
    if (patch.actor) upsertMember(project, patch.actor);
    const timestamp = nowIso();
    return {
      ...project,
      title: typeof patch.title === "string" && patch.title.trim() ? patch.title.trim() : project.title,
      updatedAt: timestamp,
      graph: {
        ...project.graph,
        updatedAt: project.graph?.updatedAt || timestamp,
      },
    };
  });
}

export function getBrowserProjectGraph(projectId) {
  const project = getBrowserProject(projectId);
  if (!project) return null;
  return {
    project: getProjectSummary(project),
    graph: project.graph,
    meetingMemory: project.meetingMemory,
  };
}

export function saveBrowserProjectGraph(projectId, graph = {}, actor) {
  const nextProject = mutateProject(projectId, (project) => {
    if (actor) upsertMember(project, actor);
    const timestamp = nowIso();
    return {
      ...project,
      updatedAt: timestamp,
      graph: {
        nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
        edges: Array.isArray(graph.edges) ? graph.edges : [],
        stage: typeof graph.stage === "string" ? graph.stage : project.graph?.stage || "research-diverge",
        updatedAt: timestamp,
      },
      meetingMemory: sanitizeMeetingMemory(graph?.meetingMemory || project.meetingMemory || getDefaultMeetingMemory()),
    };
  });
  return {
    project: getProjectSummary(nextProject),
    graph: nextProject.graph,
    meetingMemory: nextProject.meetingMemory,
  };
}

export function getBrowserProjectActivity(projectId) {
  const project = getBrowserProject(projectId);
  return project?.activity || [];
}

export function appendBrowserProjectActivity(projectId, activity = {}) {
  const nextProject = mutateProject(projectId, (project) => {
    if (activity.actor) upsertMember(project, activity.actor);
    const timestamp = nowIso();
    const entry = createActivityEntry({
      activity,
      timestamp,
      stage: project.graph?.stage || "research-diverge",
      generateId,
    });
    return {
      ...project,
      updatedAt: timestamp,
      activity: [entry, ...project.activity].slice(0, MAX_ACTIVITY_ITEMS),
    };
  });
  return nextProject.activity[0] || null;
}

export function getBrowserProjectMembers(projectId) {
  const project = getBrowserProject(projectId);
  return project?.members || [];
}

export function registerBrowserProjectMember(projectId, member) {
  const nextProject = mutateProject(projectId, (project) => {
    upsertMember(project, member);
    return {
      ...project,
      updatedAt: nowIso(),
    };
  });
  return nextProject.members;
}
