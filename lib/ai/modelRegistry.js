export const AI_TASKS = Object.freeze({
  GRAPH_ANALYSIS: "graph_analysis",
  SUGGESTION_CHAT: "suggestion_chat",
  CONCEPT_STUDIO: "concept_studio",
  GRAPH_EXTRACTION: "graph_extraction",
  MEETING_INGEST: "meeting_ingest",
  TEAM_CONTEXT: "team_context",
  CONFLICT_EXPLAIN: "conflict_explain",
  WEB_RESEARCH: "web_research",
  TRANSLATION: "translation",
  SCHEMA_REPAIR: "schema_repair",
});

const MODEL_CATALOG = Object.freeze([
  {
    id: "openai:gpt-4o-2024-08-06",
    provider: "openai",
    model: "gpt-4o-2024-08-06",
    label: "GPT-4o",
    role: "Deep structured reasoning",
    relativeCost: "high",
    relativeLatency: "medium",
    capabilities: ["chat", "json"],
  },
  {
    id: "openai:gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    label: "GPT-4o mini",
    role: "Fast support tasks",
    relativeCost: "low",
    relativeLatency: "fast",
    capabilities: ["chat", "json"],
  },
  {
    id: "openai:gpt-5.6-luna",
    provider: "openai",
    model: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    role: "Live web research",
    relativeCost: "medium",
    relativeLatency: "medium",
    capabilities: ["chat", "web_search"],
  },
]);

const DEFAULT_MODEL_BY_TASK = Object.freeze({
  [AI_TASKS.GRAPH_ANALYSIS]: "openai:gpt-4o-2024-08-06",
  [AI_TASKS.SUGGESTION_CHAT]: "openai:gpt-4o-mini",
  [AI_TASKS.CONCEPT_STUDIO]: "openai:gpt-4o-2024-08-06",
  [AI_TASKS.GRAPH_EXTRACTION]: "openai:gpt-4o-2024-08-06",
  [AI_TASKS.MEETING_INGEST]: "openai:gpt-4o-2024-08-06",
  [AI_TASKS.TEAM_CONTEXT]: "openai:gpt-4o-mini",
  [AI_TASKS.CONFLICT_EXPLAIN]: "openai:gpt-4o-mini",
  [AI_TASKS.WEB_RESEARCH]: "openai:gpt-5.6-luna",
  [AI_TASKS.TRANSLATION]: "openai:gpt-4o-mini",
  [AI_TASKS.SCHEMA_REPAIR]: "openai:gpt-4o-mini",
});

const MODEL_PROFILES = Object.freeze([
  {
    id: "auto",
    label: "Auto",
    modelLabel: "GPT-4o + mini · GPT-5.6 web",
    selection: {},
  },
  {
    id: "deep",
    label: "Deep",
    modelLabel: "GPT-4o · GPT-5.6 web",
    selection: {
      [AI_TASKS.GRAPH_ANALYSIS]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.SUGGESTION_CHAT]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.CONCEPT_STUDIO]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.GRAPH_EXTRACTION]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.MEETING_INGEST]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.TEAM_CONTEXT]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.CONFLICT_EXPLAIN]: "openai:gpt-4o-2024-08-06",
      [AI_TASKS.WEB_RESEARCH]: "openai:gpt-5.6-luna",
    },
  },
  {
    id: "fast",
    label: "Fast",
    modelLabel: "GPT-4o mini · GPT-5.6 web",
    selection: {
      [AI_TASKS.GRAPH_ANALYSIS]: "openai:gpt-4o-mini",
      [AI_TASKS.SUGGESTION_CHAT]: "openai:gpt-4o-mini",
      [AI_TASKS.CONCEPT_STUDIO]: "openai:gpt-4o-mini",
      [AI_TASKS.GRAPH_EXTRACTION]: "openai:gpt-4o-mini",
      [AI_TASKS.MEETING_INGEST]: "openai:gpt-4o-mini",
      [AI_TASKS.TEAM_CONTEXT]: "openai:gpt-4o-mini",
      [AI_TASKS.CONFLICT_EXPLAIN]: "openai:gpt-4o-mini",
      [AI_TASKS.WEB_RESEARCH]: "openai:gpt-5.6-luna",
    },
  },
]);

const MODEL_BY_ID = new Map(MODEL_CATALOG.map((model) => [model.id, model]));

export function listAiModels() {
  return MODEL_CATALOG.map((model) => ({ ...model, capabilities: [...model.capabilities] }));
}

export function getDefaultModelSelection() {
  return { ...DEFAULT_MODEL_BY_TASK };
}

export function listAiModelProfiles() {
  return MODEL_PROFILES.map(({ selection: _selection, ...profile }) => ({ ...profile }));
}

export function normalizeAiModelProfile(value) {
  return MODEL_PROFILES.some((profile) => profile.id === value) ? value : "auto";
}

export function getModelSelectionForProfile(value) {
  const profileId = normalizeAiModelProfile(value);
  const profile = MODEL_PROFILES.find((item) => item.id === profileId) || MODEL_PROFILES[0];
  return { ...profile.selection };
}

export function resolveAiModel(task, selection = {}) {
  const requestedId = selection?.[task] || DEFAULT_MODEL_BY_TASK[task];
  const model = MODEL_BY_ID.get(requestedId);
  if (!model) {
    throw new Error(`No supported AI model is configured for task: ${task}`);
  }
  return model;
}

export function isSupportedAiTask(task) {
  return Object.values(AI_TASKS).includes(task);
}
