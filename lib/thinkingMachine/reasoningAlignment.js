import {
  normalizeNodeCategory,
  normalizeOwnerId,
  normalizeRelationLabel,
} from "@/lib/thinkingMachine/nodeMeta";

export const ALIGNMENT_STATE_META = {
  aligned: {
    label: "Aligned",
    chipClassName: "bg-yellow-100 text-yellow-700",
    cardClassName: "border-yellow-100/80 bg-yellow-50/80",
    labelText: "#A16207",
    labelBorder: "rgba(250, 204, 21, 0.44)",
    stroke: "rgba(234, 179, 8, 0.88)",
    labelBackground: "rgba(254, 249, 195, 0.94)",
    lineDash: undefined,
  },
  partially_aligned: {
    label: "Partially aligned",
    chipClassName: "bg-emerald-100 text-emerald-700",
    cardClassName: "border-emerald-100/80 bg-emerald-50/80",
    labelText: "#047857",
    labelBorder: "rgba(52, 211, 153, 0.42)",
    stroke: "rgba(52, 211, 153, 0.9)",
    labelBackground: "rgba(236, 253, 245, 0.94)",
    lineDash: undefined,
  },
  unresolved: {
    label: "Unresolved difference",
    chipClassName: "bg-pink-100 text-[#9F1239]",
    cardClassName: "border-pink-100/80 bg-[#FCE7F3]/70",
    labelText: "#9F1239",
    labelBorder: "rgba(244, 114, 182, 0.42)",
    stroke: "rgba(244, 114, 182, 0.82)",
    labelBackground: "rgba(252, 231, 243, 0.96)",
    lineDash: undefined,
  },
  in_tension: {
    label: "Tension",
    chipClassName: "bg-amber-100 text-amber-700",
    cardClassName: "border-amber-100/80 bg-amber-50/80",
    labelText: "#B45309",
    labelBorder: "rgba(245, 158, 11, 0.4)",
    stroke: "rgba(245, 158, 11, 0.9)",
    labelBackground: "rgba(255, 251, 235, 0.94)",
    lineDash: undefined,
  },
  contradictory: {
    label: "Contradictory",
    chipClassName: "bg-rose-100 text-rose-700",
    cardClassName: "border-rose-100/80 bg-rose-50/80",
    labelText: "#BE123C",
    labelBorder: "rgba(244, 63, 94, 0.4)",
    stroke: "rgba(244, 114, 182, 0.9)",
    labelBackground: "rgba(255, 241, 242, 0.94)",
    lineDash: undefined,
  },
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "over",
  "under",
  "around",
  "about",
  "still",
  "very",
  "more",
  "less",
  "than",
  "then",
  "team",
  "need",
  "needs",
  "idea",
  "option",
  "goal",
  "problem",
]);

const POSITIVE_RELATIONS = new Set(["supports", "refines", "depends_on", "proposes"]);
const NEGATIVE_RELATIONS = new Set(["blocks", "contradicts"]);
const DECISION_SUPPORT_CATEGORIES = new Set(["Goal", "Insight", "Evidence", "Constraint", "Risk", "Option"]);
const PRIORITY_TERMS = {
  speed: ["speed", "fast", "faster", "quick", "launch", "deadline", "timeline"],
  quality: ["quality", "polish", "reliability", "stable", "stability", "craft"],
  risk: ["risk", "safe", "safety", "compliance", "governance", "guardrail"],
  cost: ["cost", "budget", "cheap", "efficiency", "efficient", "resourcing"],
  growth: ["growth", "scale", "reach", "adoption", "market"],
  brand: ["brand", "tone", "identity", "consistency"],
  user: ["user", "customer", "experience", "usability"],
};
const NEGATION_TERMS = ["no", "not", "never", "without", "avoid", "against", "instead"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getNodeText(node) {
  return `${node?.data?.title || ""} ${node?.data?.content || ""}`.trim();
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function toTokenSet(text) {
  return new Set(tokenize(text));
}

function jaccardSimilarity(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
}

function hasNegation(text) {
  const normalized = ` ${String(text || "").toLowerCase()} `;
  return NEGATION_TERMS.some((term) => normalized.includes(` ${term} `));
}

function extractPrioritySignals(text) {
  const normalized = String(text || "").toLowerCase();
  return Object.entries(PRIORITY_TERMS)
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([key]) => key);
}

function getNodeCategory(node) {
  return normalizeNodeCategory(node?.data?.category);
}

function isThinkingNode(node) {
  return node?.type === "thinkingNode";
}

function getRelationLabel(edge) {
  return normalizeRelationLabel(edge?.data?.label || edge?.label);
}

function getNodeIdsFromRelationship(relationship) {
  return [relationship.sourceId, relationship.targetId].filter(Boolean);
}

function getRelationshipState(score) {
  if (score <= -0.75) return "contradictory";
  if (score <= -0.25) return "in_tension";
  if (score < 0.2) return "unresolved";
  if (score < 0.58) return "partially_aligned";
  return "aligned";
}

function getFallbackStateFromLabel(label) {
  if (label === "contradicts") return "contradictory";
  if (label === "blocks") return "in_tension";
  if (POSITIVE_RELATIONS.has(label)) return label === "supports" ? "aligned" : "partially_aligned";
  return "unresolved";
}

function getFallbackScoreFromLabel(label) {
  switch (label) {
    case "supports":
      return 0.74;
    case "refines":
      return 0.46;
    case "depends_on":
      return 0.28;
    case "proposes":
      return 0.24;
    case "blocks":
      return -0.52;
    case "contradicts":
      return -0.92;
    default:
      return 0;
  }
}

function getDistinctContributorCount(nodes = []) {
  return new Set(nodes.map((node) => normalizeOwnerId(node?.data?.ownerId)).filter(Boolean)).size;
}

function pickRelationshipLabel({ state, relationLabel, sourceNode, targetNode, sharedPriorities }) {
  if (state === "aligned") return "Aligned";
  if (state === "partially_aligned") return "Partial alignment";
  if (state === "contradictory") return "Contradictory";
  if (state === "in_tension") {
    if (sharedPriorities.length >= 2) return "Diverging priorities";
    if (getNodeCategory(sourceNode) === "Constraint" || getNodeCategory(targetNode) === "Constraint") {
      return "Misalignment";
    }
    return "Tension";
  }
  return "Unresolved difference";
}

function buildRelationshipSummary({
  state,
  sourceNode,
  targetNode,
  sharedPriorities,
  relationLabel,
  reasons,
}) {
  const sourceTitle = sourceNode?.data?.title || "This node";
  const targetTitle = targetNode?.data?.title || "connected node";
  if (state === "aligned") {
    if (sharedPriorities.length) {
      return `${sourceTitle} and ${targetTitle} are reinforcing the same direction around ${sharedPriorities.join(", ")}.`;
    }
    return `${sourceTitle} is reinforcing ${targetTitle}.`;
  }
  if (state === "partially_aligned") {
    return `${sourceTitle} and ${targetTitle} are moving in a similar direction, but the reasoning frame is not fully merged yet.`;
  }
  if (state === "contradictory") {
    return `${sourceTitle} is directly challenging ${targetTitle}.`;
  }
  if (state === "in_tension") {
    if (sharedPriorities.length) {
      return `${sourceTitle} and ${targetTitle} are pulling in different directions around ${sharedPriorities.join(", ")}.`;
    }
    if (relationLabel === "blocks") {
      return `${sourceTitle} is creating a blocker for ${targetTitle}.`;
    }
    return `${sourceTitle} and ${targetTitle} are not currently aligned.`;
  }
  if (reasons.some((reason) => reason.type === "open_question")) {
    return `${sourceTitle} still leaves an open question for ${targetTitle}.`;
  }
  return `${sourceTitle} and ${targetTitle} still need clarification.`;
}

function scoreRelationship(edge, sourceNode, targetNode) {
  const relationLabel = getRelationLabel(edge);
  const reasons = [];
  let score = getFallbackScoreFromLabel(relationLabel);

  if (relationLabel === "supports") reasons.push({ type: "edge_label", value: "support", weight: 0.74 });
  if (relationLabel === "refines") reasons.push({ type: "edge_label", value: "refine", weight: 0.46 });
  if (relationLabel === "depends_on") reasons.push({ type: "edge_label", value: "dependency", weight: 0.28 });
  if (relationLabel === "proposes") reasons.push({ type: "edge_label", value: "proposal", weight: 0.24 });
  if (relationLabel === "blocks") reasons.push({ type: "edge_label", value: "block", weight: -0.52 });
  if (relationLabel === "contradicts") reasons.push({ type: "edge_label", value: "contradiction", weight: -0.92 });

  const sourceText = getNodeText(sourceNode);
  const targetText = getNodeText(targetNode);
  const sourceTokens = toTokenSet(sourceText);
  const targetTokens = toTokenSet(targetText);
  const similarity = jaccardSimilarity(sourceTokens, targetTokens);
  const sharedPriorities = extractPrioritySignals(sourceText).filter((signal) =>
    extractPrioritySignals(targetText).includes(signal)
  );
  const sourceCategory = getNodeCategory(sourceNode);
  const targetCategory = getNodeCategory(targetNode);

  if (similarity >= 0.45 && sourceCategory === targetCategory && !NEGATIVE_RELATIONS.has(relationLabel)) {
    score += 0.18;
    reasons.push({ type: "similar_framing", value: "same_category_similarity", weight: 0.18 });
  }

  if (hasNegation(sourceText) !== hasNegation(targetText) && similarity >= 0.18) {
    score -= 0.36;
    reasons.push({ type: "opposition", value: "negation_mismatch", weight: -0.36 });
  }

  if (
    targetCategory === "Decision" &&
    DECISION_SUPPORT_CATEGORIES.has(sourceCategory) &&
    POSITIVE_RELATIONS.has(relationLabel)
  ) {
    score += 0.16;
    reasons.push({ type: "decision_support", value: sourceCategory, weight: 0.16 });
  }

  if (
    ((sourceCategory === "Assumption" && targetCategory === "Evidence") ||
      (sourceCategory === "Evidence" && targetCategory === "Assumption")) &&
    NEGATIVE_RELATIONS.has(relationLabel)
  ) {
    score -= 0.18;
    reasons.push({ type: "challenged_assumption", value: "evidence_challenge", weight: -0.18 });
  }

  if (sourceCategory === "OpenQuestion" || targetCategory === "OpenQuestion") {
    score = Math.min(score, 0.12);
    reasons.push({ type: "open_question", value: "pending_clarification", weight: 0.12 });
  }

  const state = getRelationshipState(clamp(score, -1, 1));
  return {
    score: clamp(score, -1, 1),
    state,
    reasons,
    sharedPriorities,
    relationLabel,
  };
}

function buildRelationship(edge, sourceNode, targetNode) {
  const { score, state, reasons, sharedPriorities, relationLabel } = scoreRelationship(edge, sourceNode, targetNode);
  const contributorCount = getDistinctContributorCount([sourceNode, targetNode]);
  return {
    id: edge?.id || `${edge?.source}-${edge?.target}`,
    edgeId: edge?.id || `${edge?.source}-${edge?.target}`,
    sourceId: sourceNode.id,
    targetId: targetNode.id,
    state,
    score,
    confidence: clamp(0.48 + Math.abs(score) * 0.4 + Math.min(reasons.length, 3) * 0.05, 0.35, 0.96),
    displayLabel: pickRelationshipLabel({ state, relationLabel, sourceNode, targetNode, sharedPriorities }),
    summary: buildRelationshipSummary({ state, sourceNode, targetNode, sharedPriorities, relationLabel, reasons }),
    relationLabel,
    contributorCount,
    nodeIds: [sourceNode.id, targetNode.id],
    reasons,
  };
}

function createZone({
  id,
  state,
  label,
  summary,
  nodeIds,
  contributorCount,
}) {
  return {
    id,
    state,
    label,
    summary,
    nodeIds: Array.from(new Set(nodeIds.filter(Boolean))),
    contributorCount,
  };
}

function buildAnchorZones(thinkingNodes, relationships) {
  const zones = [];
  const nodeMap = new Map(thinkingNodes.map((node) => [node.id, node]));
  const relationshipByNode = new Map();
  relationships.forEach((relationship) => {
    getNodeIdsFromRelationship(relationship).forEach((nodeId) => {
      const list = relationshipByNode.get(nodeId) || [];
      list.push(relationship);
      relationshipByNode.set(nodeId, list);
    });
  });

  thinkingNodes.forEach((node) => {
    const category = getNodeCategory(node);
    const related = relationshipByNode.get(node.id) || [];
    if (!related.length) {
      if (category === "Decision") {
        zones.push(
          createZone({
            id: `zone-decision-gap-${node.id}`,
            state: "unresolved",
            label: "Unresolved decision zone",
            summary: `${node.data?.title || "This decision"} does not yet have visible supporting reasoning.`,
            nodeIds: [node.id],
            contributorCount: getDistinctContributorCount([node]),
          })
        );
      }
      return;
    }

    const positive = related.filter((relationship) =>
      ["aligned", "partially_aligned"].includes(relationship.state)
    );
    const negative = related.filter((relationship) =>
      ["in_tension", "contradictory"].includes(relationship.state)
    );
    const unresolved = related.filter((relationship) => relationship.state === "unresolved");
    const relatedNodeIds = Array.from(new Set(related.flatMap((relationship) => relationship.nodeIds)));
    const contributorCount = getDistinctContributorCount(
      relatedNodeIds.map((nodeId) => nodeMap.get(nodeId)).filter(Boolean)
    );

    if (category === "Decision" && positive.length === 0) {
      zones.push(
        createZone({
          id: `zone-decision-support-${node.id}`,
          state: "unresolved",
          label: "Support gap",
          summary: `${node.data?.title || "This decision"} is visible, but the supporting evidence or goals are still thin.`,
          nodeIds: [node.id, ...relatedNodeIds],
          contributorCount,
        })
      );
      return;
    }

    if (negative.length > 0) {
      zones.push(
        createZone({
          id: `zone-diverging-${node.id}`,
          state: negative.some((item) => item.state === "contradictory") ? "contradictory" : "in_tension",
          label: negative.length > 1 ? "Diverging priorities" : "Misalignment",
          summary: `${node.data?.title || "This area"} still contains reasoning that is pulling in different directions.`,
          nodeIds: [node.id, ...relatedNodeIds],
          contributorCount,
        })
      );
      return;
    }

    if (unresolved.length > 0) {
      zones.push(
        createZone({
          id: `zone-unresolved-${node.id}`,
          state: "unresolved",
          label: "Unresolved difference",
          summary: `${node.data?.title || "This area"} still needs clarification before it fully converges.`,
          nodeIds: [node.id, ...relatedNodeIds],
          contributorCount,
        })
      );
      return;
    }

    if (positive.length >= 2 && (category === "Goal" || category === "Decision" || category === "Problem")) {
      zones.push(
        createZone({
          id: `zone-shared-${node.id}`,
          state: "aligned",
          label: "Shared direction",
          summary: `${node.data?.title || "This area"} is being reinforced by multiple connected nodes.`,
          nodeIds: [node.id, ...relatedNodeIds],
          contributorCount,
        })
      );
    }
  });

  return zones;
}

function buildSummaryItems(relationships, zones) {
  const items = [
    ...relationships.map((relationship) => ({
      id: relationship.id,
      state: relationship.state,
      label: relationship.displayLabel,
      summary: relationship.summary,
      nodeIds: relationship.nodeIds,
      contributorCount: relationship.contributorCount,
      score: Math.abs(relationship.score),
      source: "relationship",
    })),
    ...zones.map((zone) => ({
      id: zone.id,
      state: zone.state,
      label: zone.label,
      summary: zone.summary,
      nodeIds: zone.nodeIds,
      contributorCount: zone.contributorCount,
      score: 0.92,
      source: "zone",
    })),
  ];

  const takeTop = (allowedStates) =>
    items
      .filter((item) => allowedStates.includes(item.state))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

  return {
    aligned: takeTop(["aligned", "partially_aligned"]),
    unresolved: takeTop(["unresolved"]),
    diverging: takeTop(["in_tension", "contradictory"]),
  };
}

function buildCounts(relationships, zones) {
  const counts = {
    aligned: 0,
    partially_aligned: 0,
    unresolved: 0,
    in_tension: 0,
    contradictory: 0,
  };
  [...relationships, ...zones].forEach((item) => {
    if (counts[item.state] === undefined) return;
    counts[item.state] += 1;
  });
  return counts;
}

function sliceAnalysisByNodeId(baseAnalysis, selectedNodeId) {
  if (!selectedNodeId) return null;
  const relationships = baseAnalysis.relationships.filter((relationship) =>
    relationship.nodeIds.includes(selectedNodeId)
  );
  const zones = baseAnalysis.zones.filter((zone) => zone.nodeIds.includes(selectedNodeId));
  return {
    relationships,
    zones,
    counts: buildCounts(relationships, zones),
    sections: buildSummaryItems(relationships, zones),
  };
}

export function getAlignmentVisualMeta(state) {
  return ALIGNMENT_STATE_META[state] || ALIGNMENT_STATE_META.unresolved;
}

export function inferFallbackEdgeAlignment(edge) {
  const relationLabel = getRelationLabel(edge);
  const state = getFallbackStateFromLabel(relationLabel);
  return {
    edgeId: edge?.id || "",
    state,
    score: getFallbackScoreFromLabel(relationLabel),
    displayLabel: getAlignmentVisualMeta(state).label,
    summary: "",
  };
}

export function buildReasoningAlignmentAnalysis({
  nodes = [],
  edges = [],
  selectedNodeId = null,
} = {}) {
  const thinkingNodes = toArray(nodes).filter(isThinkingNode);
  const nodeMap = new Map(thinkingNodes.map((node) => [node.id, node]));
  const relationships = toArray(edges)
    .map((edge) => {
      const sourceNode = nodeMap.get(edge?.source);
      const targetNode = nodeMap.get(edge?.target);
      if (!sourceNode || !targetNode) return null;
      return buildRelationship(edge, sourceNode, targetNode);
    })
    .filter(Boolean);

  const zones = buildAnchorZones(thinkingNodes, relationships);
  const edgeStatesById = Object.fromEntries(
    relationships.map((relationship) => [
      relationship.edgeId,
      {
        state: relationship.state,
        score: relationship.score,
        displayLabel: relationship.displayLabel,
        summary: relationship.summary,
      },
    ])
  );

  return {
    relationships,
    zones,
    counts: buildCounts(relationships, zones),
    sections: buildSummaryItems(relationships, zones),
    edgeStatesById,
    selectedSummary: sliceAnalysisByNodeId({ relationships, zones }, selectedNodeId),
  };
}
