export const REASONING_NODE_TYPES = [
  "Problem",
  "Goal",
  "Insight",
  "Evidence",
  "Assumption",
  "Constraint",
  "Idea",
  "Option",
  "Risk",
  "Conflict",
  "Decision",
  "OpenQuestion",
];

export const NODE_SOURCE_TYPES = ["user", "agent", "mixed"];
export const NODE_VISIBILITY_STATES = ["private", "candidate", "shared", "reviewed", "agreed"];
export const NODE_VISIBILITY_FLOW = ["private", "candidate", "shared", "reviewed", "agreed"];
export const NODE_CONFIDENCE_LEVELS = ["low", "medium", "high"];
export const NODE_LAYER_ORIGINS = ["personal", "team"];
export const NODE_CONFLICT_STATES = ["none", "tension", "contradictory"];
export const NODE_PHASES = ["Problem", "Solution"];
export const SUGGESTION_REASONING_TAGS = ["Insight", "Problem", "Constraint", "Decision", "Idea", "Action", "Risk", "Reference"];
export const SUGGESTION_LENS_TAGS = ["User", "Team", "AI", "Brand", "Market", "Product", "Space", "Operation"];
export const SUGGESTION_QUESTION_TAGS = ["Why", "What", "How", "When", "Where", "Who"];
export const COLLABORATION_ROLES = ["owner", "editor", "viewer"];
export const REASONING_FOCUS_VALUES = ["research", "design"];
export const REASONING_BREADTH_VALUES = ["diverge", "converge"];
export const REASONING_STAGE_VALUES = [
  "research-diverge",
  "research-converge",
  "design-diverge",
  "design-converge",
  "ideation-diverge",
  "ideation-converge",
];
export const RELATION_LABELS = [
  "supports",
  "contradicts",
  "causes",
  "refines",
  "depends_on",
  "proposes",
  "blocks",
];

export const LEGACY_CATEGORY_MAP = {
  Who: "Problem",
  What: "Idea",
  When: "Constraint",
  Where: "Constraint",
  Why: "Insight",
  How: "Option",
  Solution: "Decision",
};

export const REASONING_TYPE_META = {
  Problem: {
    color: "#F59E8B",
    tint: "bg-rose-50",
    bg: "bg-rose-50",
    header: "bg-rose-100/60",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-400",
    accent: "#F59E8B",
  },
  Goal: {
    color: "#F5C96A",
    tint: "bg-amber-50",
    bg: "bg-amber-50",
    header: "bg-amber-100/60",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-400",
    accent: "#F5C96A",
  },
  Insight: {
    color: "#A78BFA",
    tint: "bg-violet-50",
    bg: "bg-violet-50",
    header: "bg-violet-100/60",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-400",
    accent: "#A78BFA",
  },
  Evidence: {
    color: "#60A5FA",
    tint: "bg-sky-50",
    bg: "bg-sky-50",
    header: "bg-sky-100/60",
    border: "border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-400",
    accent: "#60A5FA",
  },
  Assumption: {
    color: "#C4B5FD",
    tint: "bg-purple-50",
    bg: "bg-purple-50",
    header: "bg-purple-100/60",
    border: "border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-400",
    accent: "#C4B5FD",
  },
  Constraint: {
    color: "#CBD5E1",
    tint: "bg-slate-50",
    bg: "bg-slate-50",
    header: "bg-slate-100/60",
    border: "border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
    accent: "#CBD5E1",
  },
  Idea: {
    color: "#6EE7B7",
    tint: "bg-emerald-50",
    bg: "bg-emerald-50",
    header: "bg-emerald-100/60",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
    accent: "#6EE7B7",
  },
  Option: {
    color: "#67E8F9",
    tint: "bg-cyan-50",
    bg: "bg-cyan-50",
    header: "bg-cyan-100/60",
    border: "border-cyan-200",
    text: "text-cyan-700",
    dot: "bg-cyan-400",
    accent: "#67E8F9",
  },
  Risk: {
    color: "#FB7185",
    tint: "bg-pink-50",
    bg: "bg-pink-50",
    header: "bg-pink-100/60",
    border: "border-pink-200",
    text: "text-pink-700",
    dot: "bg-pink-400",
    accent: "#FB7185",
  },
  Conflict: {
    color: "#F87171",
    tint: "bg-red-50",
    bg: "bg-red-50",
    header: "bg-red-100/60",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-400",
    accent: "#F87171",
  },
  Decision: {
    color: "#34D399",
    tint: "bg-teal-50",
    bg: "bg-teal-50",
    header: "bg-teal-100/60",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-400",
    accent: "#34D399",
  },
  OpenQuestion: {
    color: "#93C5FD",
    tint: "bg-blue-50",
    bg: "bg-blue-50",
    header: "bg-blue-100/60",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-400",
    accent: "#93C5FD",
  },
};

export const VISIBILITY_META = {
  private: { label: "Private", className: "bg-slate-100 text-slate-600" },
  candidate: { label: "Candidate", className: "bg-amber-100 text-amber-700" },
  shared: { label: "Shared", className: "bg-sky-100 text-sky-700" },
  reviewed: { label: "Reviewed", className: "bg-violet-100 text-violet-700" },
  agreed: { label: "Agreed", className: "bg-emerald-100 text-emerald-700" },
};

export const VISIBILITY_CARD_META = {
  private: {
    borderColor: "rgba(148, 163, 184, 0.42)",
    boxShadow: "0 10px 24px -18px rgba(15, 23, 42, 0.18), 0 1px 0 rgba(255,255,255,0.72) inset",
    background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)",
  },
  candidate: {
    borderColor: "rgba(245, 158, 11, 0.34)",
    boxShadow: "0 10px 24px -18px rgba(245, 158, 11, 0.22), 0 1px 0 rgba(255,255,255,0.78) inset",
    background: "linear-gradient(180deg, rgba(255,251,235,0.96) 0%, rgba(255,255,255,0.93) 100%)",
  },
  shared: {
    borderColor: "rgba(56, 189, 248, 0.34)",
    boxShadow: "0 10px 24px -18px rgba(56, 189, 248, 0.18), 0 1px 0 rgba(255,255,255,0.78) inset",
    background: "linear-gradient(180deg, rgba(240,249,255,0.96) 0%, rgba(255,255,255,0.93) 100%)",
  },
  reviewed: {
    borderColor: "rgba(167, 139, 250, 0.34)",
    boxShadow: "0 10px 24px -18px rgba(167, 139, 250, 0.18), 0 1px 0 rgba(255,255,255,0.78) inset",
    background: "linear-gradient(180deg, rgba(245,243,255,0.96) 0%, rgba(255,255,255,0.93) 100%)",
  },
  agreed: {
    borderColor: "rgba(52, 211, 153, 0.36)",
    boxShadow: "0 10px 24px -18px rgba(52, 211, 153, 0.2), 0 1px 0 rgba(255,255,255,0.8) inset",
    background: "linear-gradient(180deg, rgba(236,253,245,0.97) 0%, rgba(255,255,255,0.93) 100%)",
  },
};

export const CONFIDENCE_META = {
  low: { label: "Low confidence", className: "bg-rose-100 text-rose-700" },
  medium: { label: "Medium confidence", className: "bg-amber-100 text-amber-700" },
  high: { label: "High confidence", className: "bg-emerald-100 text-emerald-700" },
};

export const ACTION_STATE_META = {
  needs_definition: {
    state: "needs_definition",
    label: "Needs Definition",
    className: "bg-[#FCE7F3] text-[#9F1239]",
  },
  needs_evidence: {
    state: "needs_evidence",
    label: "Needs Evidence",
    className: "bg-[#FCE7F3] text-[#9F1239]",
  },
  needs_validation: {
    state: "needs_validation",
    label: "Needs Validation",
    className: "bg-[#FCE7F3] text-[#9F1239]",
  },
  ready_to_share: {
    state: "ready_to_share",
    label: "Ready to Share",
    className: "bg-slate-100 text-slate-500",
  },
};

const DEFINITION_SUPPORT_CATEGORIES = new Set(["Problem", "Insight", "Evidence", "Constraint", "Goal", "Decision"]);
const EVIDENCE_SUPPORT_CATEGORIES = new Set(["Evidence"]);
const VALIDATION_SUPPORT_CATEGORIES = new Set(["Evidence", "Risk", "Constraint", "Decision"]);

export const CONFLICT_STATE_META = {
  none: {
    label: "No conflict",
    className: "bg-slate-100 text-slate-500",
    accentClassName: "text-slate-400",
  },
  tension: {
    label: "Tension",
    className: "bg-amber-100 text-amber-700",
    accentClassName: "text-amber-500",
  },
  contradictory: {
    label: "Contradictory",
    className: "bg-rose-100 text-rose-700",
    accentClassName: "text-rose-500",
  },
};

export const SOURCE_TYPE_META = {
  user: { label: "User", className: "bg-[#426099] text-white" },
  agent: { label: "Agent", className: "bg-indigo-100 text-indigo-700" },
  mixed: { label: "Mixed", className: "bg-fuchsia-100 text-fuchsia-700" },
};

export const ROLE_META = {
  owner: { label: "Owner", className: "bg-slate-900 text-white" },
  editor: { label: "Editor", className: "bg-sky-100 text-sky-700" },
  viewer: { label: "Viewer", className: "bg-slate-100 text-slate-600" },
};

export const SUGGESTION_TAG_META = {
  reasoning: {
    Insight: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Problem: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Constraint: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Decision: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Idea: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Action: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Risk: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
    Reference: { className: "bg-[#CEFBB4] text-[#4F4F4F]" },
  },
  lens: {
    User: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Team: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    AI: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Brand: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Market: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Product: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Space: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
    Operation: { className: "bg-[#B9CDFA] text-[#4F4F4F]" },
  },
  question: {
    Why: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
    What: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
    How: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
    When: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
    Where: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
    Who: { className: "bg-[#9FE8F4] text-[#4F4F4F]" },
  },
};

export const REASONING_MODE_PROFILES = {
  "research-diverge": {
    focus: "research",
    breadth: "diverge",
    label: "Research + Diverge",
    nodeBias: ["Evidence", "OpenQuestion", "Assumption", "Conflict"],
    composerPlaceholder: "Open up the problem space with evidence gaps, unresolved questions, or structural tensions.",
    composerHint:
      "Conversation drives the structure here. Surface weak evidence, assumptions, and open questions before narrowing.",
    candidateHint: "Capture tentative evidence, assumptions, and tensions before deciding what belongs on the shared graph.",
    selectedNodePrompt: "Stress-test this node with evidence, assumptions, counter-signals, or unresolved questions.",
    selectedNodeActions: ["Evidence", "OpenQuestion", "Assumption", "Conflict"],
  },
  "research-converge": {
    focus: "research",
    breadth: "converge",
    label: "Research + Converge",
    nodeBias: ["Problem", "Insight", "Evidence", "Constraint"],
    composerPlaceholder: "Clarify the core issue, summarize the strongest insight, and reduce noise.",
    composerHint:
      "Use the conversation to tighten the problem frame, summarize insights, and keep only the evidence that matters.",
    candidateHint: "Promote the nodes that sharpen the problem definition, strongest evidence, and key constraints.",
    selectedNodePrompt: "Sharpen the key takeaway around this node and reduce what does not matter.",
    selectedNodeActions: ["Problem", "Insight", "Evidence", "Constraint"],
  },
  "design-diverge": {
    focus: "design",
    breadth: "diverge",
    label: "Design + Diverge",
    nodeBias: ["Idea", "Option", "OpenQuestion", "Risk"],
    composerPlaceholder: "Generate credible directions, alternatives, and design moves worth exploring.",
    composerHint:
      "Expand the space. Create alternatives, risks, and new directions before trying to choose one.",
    candidateHint: "Keep experimental ideas and branching options as candidates before you commit them to the team layer.",
    selectedNodePrompt: "Branch from this node with options, design moves, risks, or unresolved questions.",
    selectedNodeActions: ["Idea", "Option", "OpenQuestion", "Risk"],
  },
  "design-converge": {
    focus: "design",
    breadth: "converge",
    label: "Design + Converge",
    nodeBias: ["Decision", "Risk", "Constraint", "Option", "Goal"],
    composerPlaceholder: "Compare the strongest options, expose trade-offs, and move toward a decision.",
    composerHint:
      "Reduce the space. Compare options, expose tradeoffs, and turn promising directions into decisions.",
    candidateHint: "Promote the option, goal, and risk nodes that justify an actual decision.",
    selectedNodePrompt: "Use this node to compare paths, expose blockers, and move toward commitment.",
    selectedNodeActions: ["Decision", "Risk", "Constraint", "Option", "Goal"],
  },
};

export function normalizeNodeCategory(value) {
  if (typeof value !== "string" || !value.trim()) return "Idea";
  const trimmed = value.trim();
  const direct = REASONING_NODE_TYPES.find((item) => item === trimmed);
  if (direct) return direct;
  const legacy = LEGACY_CATEGORY_MAP[trimmed];
  if (legacy) return legacy;
  const lowered = trimmed.toLowerCase();
  const found = REASONING_NODE_TYPES.find((item) => item.toLowerCase() === lowered);
  return found || "Idea";
}

export function normalizeReasoningStage(value) {
  if (typeof value !== "string") return "research-diverge";
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "ideation-diverge") return "design-diverge";
  if (trimmed === "ideation-converge") return "design-converge";
  return REASONING_STAGE_VALUES.find((item) => item === trimmed) || "research-diverge";
}

export function parseReasoningStage(value) {
  const stage = normalizeReasoningStage(value);
  const [focus, breadth] = stage.split("-");
  return { stage, focus, breadth };
}

export function getReasoningModeProfile(value) {
  const stage = normalizeReasoningStage(value);
  return REASONING_MODE_PROFILES[stage] || REASONING_MODE_PROFILES["research-diverge"];
}

export function inferPhaseFromCategory(category) {
  const normalized = normalizeNodeCategory(category);
  if (["Goal", "Idea", "Option", "Decision"].includes(normalized)) {
    return "Solution";
  }
  return "Problem";
}

export function normalizeNodePhase(value, category) {
  if (typeof value === "string") {
    const direct = NODE_PHASES.find((item) => item.toLowerCase() === value.trim().toLowerCase());
    if (direct) return direct;
  }
  return inferPhaseFromCategory(category);
}

export function normalizeSourceType(value) {
  if (typeof value !== "string") return "mixed";
  return NODE_SOURCE_TYPES.find((item) => item === value.trim().toLowerCase()) || "mixed";
}

export function normalizeVisibility(value) {
  if (typeof value !== "string") return "shared";
  return NODE_VISIBILITY_STATES.find((item) => item === value.trim().toLowerCase()) || "shared";
}

export function inferLayerOriginFromVisibility(value) {
  const normalizedVisibility = normalizeVisibility(value);
  return ["shared", "reviewed", "agreed"].includes(normalizedVisibility) ? "team" : "personal";
}

export function normalizeLayerOrigin(value, fallbackVisibility = "private") {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    const found = NODE_LAYER_ORIGINS.find((item) => item === normalized);
    if (found) return found;
  }
  return inferLayerOriginFromVisibility(fallbackVisibility);
}

export function getVisibilityIndex(value) {
  return NODE_VISIBILITY_FLOW.indexOf(normalizeVisibility(value));
}

export function getNextVisibility(value) {
  const index = getVisibilityIndex(value);
  return NODE_VISIBILITY_FLOW[Math.min(index + 1, NODE_VISIBILITY_FLOW.length - 1)];
}

export function getPreviousVisibility(value) {
  const index = getVisibilityIndex(value);
  return NODE_VISIBILITY_FLOW[Math.max(index - 1, 0)];
}

export function normalizeConfidence(value) {
  if (typeof value !== "string") return "medium";
  return NODE_CONFIDENCE_LEVELS.find((item) => item === value.trim().toLowerCase()) || "medium";
}

export function normalizeConflictState(value) {
  if (typeof value !== "string") return "none";
  const normalized = value.trim().toLowerCase();
  return NODE_CONFLICT_STATES.find((item) => item === normalized) || "none";
}

export function normalizeRelationLabel(value) {
  if (typeof value !== "string" || !value.trim()) return "refines";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return RELATION_LABELS.find((item) => item === normalized) || "refines";
}

export function normalizeRole(value) {
  if (typeof value !== "string") return "owner";
  return COLLABORATION_ROLES.find((item) => item === value.trim().toLowerCase()) || "owner";
}

export function normalizeOwnerId(value) {
  if (typeof value !== "string" || !value.trim()) return "mock-user-1";
  return value.trim();
}

export function normalizeEditedBy(value) {
  if (typeof value !== "string" || !value.trim()) return "You";
  return value.trim();
}

function normalizeSuggestionEnum(value, allowed, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  const direct = allowed.find((item) => item === trimmed);
  if (direct) return direct;
  const lowered = trimmed.toLowerCase();
  const found = allowed.find((item) => item.toLowerCase() === lowered);
  return found || fallback;
}

function inferSuggestionReasoning(category) {
  const normalized = normalizeNodeCategory(category);
  if (normalized === "Evidence") return "Reference";
  if (normalized === "Option" || normalized === "Goal") return "Action";
  if (normalized === "Conflict") return "Risk";
  if (normalized === "Assumption" || normalized === "OpenQuestion") return "Insight";
  if (SUGGESTION_REASONING_TAGS.includes(normalized)) return normalized;
  return "Idea";
}

function inferSuggestionLens({ sourceType, title, content } = {}) {
  const text = `${title || ""} ${content || ""}`.toLowerCase();
  if (/\b(ai|agent|model|automation|automated|llm)\b/.test(text)) return "AI";
  if (/\b(team|internal|stakeholder|collaboration|collaborative)\b/.test(text)) return "Team";
  if (/\b(brand|identity|tone|campaign|message)\b/.test(text)) return "Brand";
  if (/\b(market|competitor|industry|segment|trend|demand)\b/.test(text)) return "Market";
  if (/\b(product|feature|service|platform|app|experience|ux|ui)\b/.test(text)) return "Product";
  if (/\b(space|store|place|environment|layout|plaza|location)\b/.test(text)) return "Space";
  if (/\b(operation|operations|process|workflow|staff|logistics|execution)\b/.test(text)) return "Operation";
  if (normalizeSourceType(sourceType) === "user") return "User";
  if (normalizeSourceType(sourceType) === "agent") return "AI";
  return "Team";
}

function inferSuggestionQuestion({ category, title, content, phase } = {}) {
  const text = `${title || ""} ${content || ""}`.toLowerCase();
  if (/\bwhen|timeline|deadline|schedule|sequence|launch\b/.test(text)) return "When";
  if (/\bwhere|location|space|place|environment|store\b/.test(text)) return "Where";
  if (/\bwho|user|customer|audience|stakeholder|team\b/.test(text)) return "Who";
  if (/\bhow|approach|process|flow|execute|implementation|deliver\b/.test(text)) return "How";
  if (/\bwhy|reason|because|motivation|pain|problem|need\b/.test(text)) return "Why";
  const normalizedCategory = normalizeNodeCategory(category);
  if (normalizedCategory === "Problem" || normalizedCategory === "Insight" || normalizedCategory === "Assumption") return "Why";
  if (normalizedCategory === "Constraint" || normalizedCategory === "Risk" || normalizedCategory === "Evidence") return "What";
  if (normalizedCategory === "Idea" || normalizedCategory === "Option" || normalizedCategory === "Decision" || normalizeNodePhase(phase, normalizedCategory) === "Solution") {
    return "How";
  }
  return "What";
}

export function normalizeSuggestionTags(tags = {}, fallback = {}) {
  return {
    reasoning: normalizeSuggestionEnum(
      tags?.reasoning || tags?.category || tags?.type,
      SUGGESTION_REASONING_TAGS,
      inferSuggestionReasoning(fallback?.category || tags?.reasoning)
    ),
    lens: normalizeSuggestionEnum(
      tags?.lens || tags?.perspective || tags?.actor,
      SUGGESTION_LENS_TAGS,
      inferSuggestionLens(fallback)
    ),
    question: normalizeSuggestionEnum(
      tags?.question || tags?.prompt || tags?.dimension,
      SUGGESTION_QUESTION_TAGS,
      inferSuggestionQuestion(fallback)
    ),
  };
}

export function getSuggestionTagMeta(axis, value) {
  const fallbackValue = axis === "reasoning" ? "Idea" : axis === "lens" ? "Team" : "What";
  const normalized = normalizeSuggestionEnum(
    value,
    axis === "reasoning" ? SUGGESTION_REASONING_TAGS : axis === "lens" ? SUGGESTION_LENS_TAGS : SUGGESTION_QUESTION_TAGS,
    fallbackValue
  );
  return SUGGESTION_TAG_META?.[axis]?.[normalized] || { className: "bg-slate-100 text-slate-700" };
}

export function getTypeMeta(category) {
  const normalized = normalizeNodeCategory(category);
  return REASONING_TYPE_META[normalized] || REASONING_TYPE_META.Idea;
}

export function getVisibilityMeta(value) {
  return VISIBILITY_META[normalizeVisibility(value)];
}

export function getVisibilityCardMeta(value) {
  return VISIBILITY_CARD_META[normalizeVisibility(value)];
}

export function getConfidenceMeta(value) {
  return CONFIDENCE_META[normalizeConfidence(value)];
}

export function getQuestionFocusLabel(data = {}) {
  const legacy = data.legacyCategory;
  if (typeof legacy === "string" && SUGGESTION_QUESTION_TAGS.includes(legacy)) return legacy;
  return inferSuggestionQuestion(data);
}

export function getActionStateMeta(data = {}) {
  const normalized = normalizeNodeData(data);
  const category = normalized.category;
  const visibility = normalized.visibility;
  const linkedCategories = new Set(
    (Array.isArray(data.linkedNodeCategories) ? data.linkedNodeCategories : [])
      .map((item) => normalizeNodeCategory(item))
      .filter(Boolean)
  );
  const hasLinkedSupport = (supportCategories) =>
    Array.from(linkedCategories).some((linkedCategory) => supportCategories.has(linkedCategory));

  if (["shared", "reviewed", "agreed"].includes(visibility) || category === "Evidence") {
    return ACTION_STATE_META.ready_to_share;
  }
  if (category === "Problem" || category === "OpenQuestion" || category === "Assumption" || category === "Conflict") {
    if (hasLinkedSupport(DEFINITION_SUPPORT_CATEGORIES)) return ACTION_STATE_META.ready_to_share;
    return ACTION_STATE_META.needs_definition;
  }
  if (category === "Insight" || category === "Risk" || category === "Constraint" || category === "Goal") {
    if (hasLinkedSupport(EVIDENCE_SUPPORT_CATEGORIES)) return ACTION_STATE_META.ready_to_share;
    return ACTION_STATE_META.needs_evidence;
  }
  if (normalized.phase === "Solution" || category === "Idea" || category === "Option" || category === "Decision") {
    if (hasLinkedSupport(VALIDATION_SUPPORT_CATEGORIES)) return ACTION_STATE_META.ready_to_share;
    return ACTION_STATE_META.needs_validation;
  }
  return ACTION_STATE_META.needs_definition;
}

export function getConflictStateMeta(value) {
  return CONFLICT_STATE_META[normalizeConflictState(value)];
}

export function getSourceTypeMeta(value) {
  return SOURCE_TYPE_META[normalizeSourceType(value)];
}

export function getRoleMeta(value) {
  return ROLE_META[normalizeRole(value)];
}

export function normalizeNodeData(data = {}) {
  const category = normalizeNodeCategory(data.category);
  const visibility = normalizeVisibility(data.visibility);
  return {
    ...data,
    category,
    phase: normalizeNodePhase(data.phase, category),
    sourceType: normalizeSourceType(data.sourceType),
    visibility,
    confidence: normalizeConfidence(data.confidence),
    ownerId: normalizeOwnerId(data.ownerId),
    editedBy: normalizeEditedBy(data.editedBy),
    layerOrigin: normalizeLayerOrigin(data.layerOrigin, visibility),
    promotedFromVisibility:
      typeof data.promotedFromVisibility === "string" && data.promotedFromVisibility.trim()
        ? normalizeVisibility(data.promotedFromVisibility)
        : "",
    promotedAt: typeof data.promotedAt === "string" ? data.promotedAt : "",
    promotedBy: typeof data.promotedBy === "string" ? data.promotedBy.trim() : "",
    conflictState: normalizeConflictState(data.conflictState),
    conflictSummary: typeof data.conflictSummary === "string" ? data.conflictSummary.trim() : "",
    conflictLinkedNodeIds: Array.isArray(data.conflictLinkedNodeIds)
      ? data.conflictLinkedNodeIds.filter((value) => typeof value === "string" && value.trim())
      : [],
    conflictUpdatedAt: typeof data.conflictUpdatedAt === "string" ? data.conflictUpdatedAt : "",
  };
}
