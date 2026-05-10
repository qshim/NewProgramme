import {
  normalizeConfidence,
  normalizeNodeCategory,
  normalizeNodePhase,
  normalizeOwnerId,
  normalizeReasoningStage,
  normalizeRelationLabel,
  normalizeSourceType,
  normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";

export function normalizeCategory(raw) {
  return normalizeNodeCategory(raw, "Idea");
}

export function normalizePhase(raw, category) {
  return normalizeNodePhase(raw, category);
}

export function normalizeStage(stage) {
  const stageId = normalizeReasoningStage(stage);
  const [mode = "research", flow = "diverge"] = String(stageId).split("-");
  return { stage: stageId, mode, flow };
}

export function normalizeChatMessages(messages = []) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: typeof message?.content === "string" ? message.content.trim() : "",
    }))
    .filter((message) => message.content);
}

export function normalizeUserNodes(rawNodes = [], defaultVisibility = "private") {
  if (!Array.isArray(rawNodes)) return [];
  return rawNodes
    .map((node) => ({
      label: typeof node?.label === "string" ? node.label.trim() : "",
      content: typeof node?.content === "string" ? node.content.trim() : "",
      category: normalizeCategory(node?.category),
      phase: normalizePhase(node?.phase, node?.category),
      ownerId: normalizeOwnerId(node?.ownerId),
      sourceType: normalizeSourceType(node?.sourceType),
      visibility: normalizeVisibility(node?.visibility || defaultVisibility),
      confidence: normalizeConfidence(node?.confidence),
    }))
    .filter((node) => node.label && node.content);
}

export function normalizeCrossConnections(connections = []) {
  if (!Array.isArray(connections)) return [];
  return connections
    .map((connection) => ({
      existing_node_id: typeof connection?.existing_node_id === "string" ? connection.existing_node_id : "",
      new_node_index: Number.isFinite(connection?.new_node_index) ? Math.max(0, Math.floor(connection.new_node_index)) : 0,
      connection_label: normalizeRelationLabel(connection?.connection_label),
    }))
    .filter((connection) => connection.existing_node_id);
}

export function normalizeTeamContextSummary(raw = {}) {
  return {
    summary: typeof raw?.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : "Recent team changes shift the project context, but the overall intent is still ambiguous.",
    likelyIntent: typeof raw?.likelyIntent === "string" && raw.likelyIntent.trim()
      ? raw.likelyIntent.trim()
      : "Clarify what changed and why it matters now.",
    keyNodeIds: Array.isArray(raw?.keyNodeIds)
      ? raw.keyNodeIds.filter((value) => typeof value === "string" && value.trim()).slice(0, 6)
      : [],
    openQuestions: Array.isArray(raw?.openQuestions)
      ? raw.openQuestions.filter((value) => typeof value === "string" && value.trim()).slice(0, 4)
      : [],
    suggestedFocus: typeof raw?.suggestedFocus === "string" && raw.suggestedFocus.trim()
      ? raw.suggestedFocus.trim()
      : "Review the latest changes and reconcile them with the active reasoning path.",
  };
}

export function normalizeConflictExplainSummary(raw = {}) {
  return {
    summary: typeof raw?.summary === "string" && raw.summary.trim()
      ? raw.summary.trim()
      : "These ideas are creating tension in the team layer, but the exact reason is still ambiguous.",
    whyDifferent: typeof raw?.whyDifferent === "string" && raw.whyDifferent.trim()
      ? raw.whyDifferent.trim()
      : "The nodes appear to optimize for different goals or constraints.",
    assumptionGap: typeof raw?.assumptionGap === "string" && raw.assumptionGap.trim()
      ? raw.assumptionGap.trim()
      : "The underlying assumptions behind the two ideas are not fully aligned yet.",
    riskIfIgnored: typeof raw?.riskIfIgnored === "string" && raw.riskIfIgnored.trim()
      ? raw.riskIfIgnored.trim()
      : "If the difference is ignored, the team may continue building in two directions without noticing.",
    suggestedNextStep: typeof raw?.suggestedNextStep === "string" && raw.suggestedNextStep.trim()
      ? raw.suggestedNextStep.trim()
      : "Review the competing assumptions and decide whether to merge, separate, or explicitly compare the ideas.",
  };
}

export function normalizeMeetingOperation(rawValue) {
  const candidate = typeof rawValue === "string" ? rawValue.trim().toLowerCase() : "";
  return ["create", "strengthen", "contradict", "reopen", "link"].includes(candidate) ? candidate : "create";
}

export function inferMeetingVisibility(category, operation) {
  if (normalizeMeetingOperation(operation) === "strengthen") return "shared";
  if (normalizeCategory(category) === "Decision") return "reviewed";
  return "candidate";
}

export function inferMeetingConfidence(category, operation) {
  const normalizedOperation = normalizeMeetingOperation(operation);
  const normalizedCategory = normalizeCategory(category);
  if (normalizedOperation === "strengthen") return "high";
  if (normalizedCategory === "Evidence" || normalizedCategory === "Decision") return "high";
  if (normalizedOperation === "contradict" || normalizedCategory === "Conflict") return "medium";
  return "medium";
}

export function toRepeatedIssueKey(value, fallbackLabel) {
  const raw = typeof value === "string" && value.trim() ? value.trim() : fallbackLabel;
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
