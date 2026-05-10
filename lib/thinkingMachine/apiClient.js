import axios from "axios";
import {
  appendBrowserProjectActivity,
  createBrowserProject,
  getBrowserProject,
  getBrowserProjectActivity,
  getBrowserProjectGraph,
  getBrowserProjectMembers,
  listBrowserProjects,
  registerBrowserProjectMember,
  saveBrowserProjectGraph,
  updateBrowserProject,
} from "@/lib/thinkingMachine/browserProjectStore";
import { getDefaultMeetingMemory } from "@/lib/thinkingMachine/meetingMemory";

export function toChatErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    "Sorry, something went wrong. Please try again."
  );
}

export async function analyze(payload) {
  const response = await axios.post("/api/analyze", payload);
  return response.data;
}

export async function chat(payload) {
  const response = await axios.post("/api/chat", payload);
  return response.data;
}

export async function chatToNodes(payload) {
  const response = await axios.post("/api/chat-to-nodes", payload);
  return response.data;
}

export async function fetchProjects(options = {}) {
  const params = {
    currentUserId: options?.currentUserId || "",
    query: options?.query || "",
    scope: options?.scope || "member",
  };
  if (typeof window !== "undefined") {
    return listBrowserProjects(params);
  }
  const response = await axios.get("/api/projects", { params });
  return response.data.projects || [];
}

export async function createProject(payload) {
  if (typeof window !== "undefined") {
    return createBrowserProject(payload);
  }
  const response = await axios.post("/api/projects", payload);
  return response.data.project;
}

export async function fetchProject(projectId) {
  if (typeof window !== "undefined") {
    return getBrowserProject(projectId);
  }
  const response = await axios.get(`/api/projects/${projectId}`);
  return response.data.project;
}

export async function updateProject(projectId, payload) {
  if (typeof window !== "undefined") {
    return updateBrowserProject(projectId, payload);
  }
  const response = await axios.patch(`/api/projects/${projectId}`, payload);
  return response.data.project;
}

export async function fetchProjectGraph(projectId) {
  if (typeof window !== "undefined") {
    const payload = getBrowserProjectGraph(projectId);
    if (payload) return payload;
  }
  try {
    const response = await axios.get(`/api/projects/${projectId}/graph`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const timestamp = new Date().toISOString();
      return {
        project: {
          id: projectId,
          title: "Untitled Project",
          createdAt: timestamp,
          updatedAt: timestamp,
          members: [],
        },
        graph: {
          nodes: [],
          edges: [],
          stage: "research-diverge",
          updatedAt: timestamp,
        },
        meetingMemory: getDefaultMeetingMemory(),
      };
    }
    throw error;
  }
}

export async function saveProjectGraph(projectId, payload) {
  if (typeof window !== "undefined") {
    return saveBrowserProjectGraph(projectId, payload, payload?.actor || null);
  }
  const response = await axios.put(`/api/projects/${projectId}/graph`, payload);
  return response.data;
}

export async function fetchProjectActivity(projectId) {
  if (typeof window !== "undefined") {
    return getBrowserProjectActivity(projectId);
  }
  const response = await axios.get(`/api/projects/${projectId}/activity`);
  return response.data.activity || [];
}

export async function recordProjectActivity(projectId, payload) {
  if (typeof window !== "undefined") {
    return appendBrowserProjectActivity(projectId, payload);
  }
  const response = await axios.post(`/api/projects/${projectId}/activity`, payload);
  return response.data.entry;
}

export async function fetchProjectMembers(projectId) {
  if (typeof window !== "undefined") {
    return getBrowserProjectMembers(projectId);
  }
  const response = await axios.get(`/api/projects/${projectId}/members`);
  return response.data.members || [];
}

export async function registerProjectMember(projectId, payload) {
  if (typeof window !== "undefined") {
    return registerBrowserProjectMember(projectId, payload);
  }
  const response = await axios.post(`/api/projects/${projectId}/members`, payload);
  return response.data.members || [];
}

export async function joinProject(projectId, payload) {
  return registerProjectMember(projectId, payload);
}

export async function summarizeTeamContext(payload) {
  const response = await axios.post("/api/team-context", payload);
  return response.data;
}

export async function explainConflict(payload) {
  const response = await axios.post("/api/conflict-explain", payload);
  return response.data;
}

export async function ingestMeetingChunk(projectId, payload) {
  const response = await axios.post(`/api/projects/${projectId}/meeting-ingest`, payload);
  return response.data;
}

