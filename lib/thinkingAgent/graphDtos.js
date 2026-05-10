import {
  normalizeConfidence,
  normalizeNodeCategory,
  normalizeNodePhase,
  normalizeOwnerId,
  normalizeRelationLabel,
  normalizeSourceType,
  normalizeSuggestionTags,
  normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";

const PROBLEM_X_RANGE = [0, 400];
const SOLUTION_X_RANGE = [600, 1000];

const CATEGORY_Y_MAP = {
  Problem: 0,
  Goal: 160,
  Insight: 320,
  Evidence: 480,
  Assumption: 640,
  Constraint: 800,
  Idea: 960,
  Option: 1120,
  Risk: 1280,
  Conflict: 1440,
  Decision: 1600,
  OpenQuestion: 1760,
};

export function calculatePosition(phase, category, slotIndex = 0) {
  const xRange = phase === "Problem" ? PROBLEM_X_RANGE : SOLUTION_X_RANGE;
  const baseX = (xRange[0] + xRange[1]) / 2;
  const baseY = CATEGORY_Y_MAP[category] ?? 300;
  const NODE_STRIDE_X = 300;
  const NODE_STRIDE_Y = 260;

  let colOffset = 0;
  if (slotIndex === 0) colOffset = 0;
  else if (slotIndex % 2 === 1) colOffset = (slotIndex + 1) / 2;
  else colOffset = -(slotIndex / 2);

  const row = Math.floor(slotIndex / 4);

  return {
    x: baseX + colOffset * NODE_STRIDE_X,
    y: baseY + row * NODE_STRIDE_Y,
  };
}

export function toNode({
  id,
  label,
  content,
  category,
  phase,
  ownerId,
  sourceType,
  visibility,
  confidence,
  suggestionTags,
  is_ai_generated,
  position,
}) {
  const normalizedCategory = normalizeNodeCategory(category);
  const normalizedPhase = normalizeNodePhase(phase, normalizedCategory);
  return {
    id,
    type: "default",
    data: {
      label,
      content,
      category: normalizedCategory,
      phase: normalizedPhase,
      ownerId: normalizeOwnerId(ownerId),
      sourceType: normalizeSourceType(sourceType ?? (is_ai_generated ? "agent" : "user")),
      visibility: normalizeVisibility(visibility ?? (is_ai_generated ? "candidate" : "shared")),
      confidence: normalizeConfidence(confidence ?? (is_ai_generated ? "medium" : "high")),
      ...(suggestionTags || is_ai_generated
        ? {
            suggestionTags: normalizeSuggestionTags(suggestionTags, {
              category: normalizedCategory,
              sourceType,
              phase: normalizedPhase,
              title: label,
              content,
            }),
          }
        : {}),
      is_ai_generated: Boolean(is_ai_generated),
    },
    position,
  };
}

export function toEdge({ id, source, target, label = "refines" }) {
  return { id, source, target, label: normalizeRelationLabel(label) };
}
