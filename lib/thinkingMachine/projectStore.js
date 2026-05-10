import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getDefaultMeetingMemory, sanitizeMeetingMemory } from "@/lib/thinkingMachine/meetingMemory";
import {
  createActivityEntry,
  createSanitizeMember,
  createSanitizeProject,
  createUpsertMember,
  getProjectSummary,
  MAX_PROJECT_ACTIVITY_ITEMS,
} from "@/lib/thinkingMachine/projectStoreShared";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "thinking-machine-store.json");
const MAX_ACTIVITY_ITEMS = MAX_PROJECT_ACTIVITY_ITEMS;

const DEFAULT_STORE = {
  projects: {},
};

function nowIso() {
  return new Date().toISOString();
}

const sanitizeMember = createSanitizeMember({
  generateId: (prefix) => `${prefix}-${randomUUID()}`,
  nowIso,
});

const sanitizeProject = createSanitizeProject({
  sanitizeMember,
  nowIso,
  maxActivityItems: MAX_ACTIVITY_ITEMS,
});

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = raw ? JSON.parse(raw) : DEFAULT_STORE;
    const projects = Object.fromEntries(
      Object.entries(parsed?.projects || {}).map(([projectId, project]) => [projectId, sanitizeProject(project)])
    );
    return { projects };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store) {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

const upsertMember = createUpsertMember({ sanitizeMember, nowIso });

async function mutateProject(projectId, updater) {
  const store = await readStore();
  const existing = sanitizeProject(store.projects[projectId] || { id: projectId });
  const nextProject = sanitizeProject(await updater(existing));
  store.projects[projectId] = nextProject;
  await writeStore(store);
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

export async function listProjects(options = {}) {
  const { currentUserId, query, scope } = normalizeProjectListQuery(options);
  const store = await readStore();
  return Object.values(store.projects)
    .filter((project) => {
      if (query && !String(project?.title || "").toLowerCase().includes(query)) return false;
      if (scope === "member" && currentUserId) return isProjectMember(project, currentUserId);
      return true;
    })
    .map((project) => getProjectSummary(project, currentUserId))
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export async function createProject({ title, actor } = {}) {
  const timestamp = nowIso();
  const id = randomUUID();
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
  const store = await readStore();
  store.projects[id] = project;
  await writeStore(store);
  return project;
}

export async function getProject(projectId) {
  if (!projectId) return null;
  const store = await readStore();
  const project = store.projects[projectId];
  return project ? sanitizeProject(project) : null;
}

export async function updateProject(projectId, patch = {}) {
  return mutateProject(projectId, async (project) => {
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

export async function registerProjectMember(projectId, member) {
  return mutateProject(projectId, async (project) => {
    upsertMember(project, member);
    return {
      ...project,
      updatedAt: nowIso(),
    };
  });
}

export async function getProjectMembers(projectId) {
  const project = await getProject(projectId);
  return project?.members || [];
}

export async function getProjectGraph(projectId) {
  const project = await getProject(projectId);
  if (!project) return null;
  return {
    project: getProjectSummary(project),
    graph: project.graph,
    meetingMemory: project.meetingMemory,
  };
}

export async function saveProjectGraph(projectId, graph = {}, actor) {
  const nextProject = await mutateProject(projectId, async (project) => {
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

export async function getProjectActivity(projectId) {
  const project = await getProject(projectId);
  return project?.activity || [];
}

export async function appendProjectActivity(projectId, activity = {}) {
  const nextProject = await mutateProject(projectId, async (project) => {
    if (activity.actor) upsertMember(project, activity.actor);
    const timestamp = nowIso();
    const entry = createActivityEntry({
      activity,
      timestamp,
      stage: project.graph?.stage || "research-diverge",
      generateId: (prefix) => `${prefix}-${randomUUID()}`,
    });
    return {
      ...project,
      updatedAt: timestamp,
      activity: [entry, ...project.activity].slice(0, MAX_ACTIVITY_ITEMS),
    };
  });
  return nextProject.activity[0] || null;
}
