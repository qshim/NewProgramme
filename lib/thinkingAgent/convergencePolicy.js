const CONVERGENCE_LEVELS = Object.freeze({
  EXPLORE: "explore",
  SYNTHESIZE: "synthesize",
  PRIORITIZE: "prioritize",
  CONCLUDE: "conclude",
});

function getNodeCategory(node) {
  return String(node?.data?.category || node?.category || "").trim();
}

function collectUniqueNodes(...groups) {
  const uniqueNodes = new Map();
  let anonymousIndex = 0;

  groups.flatMap((group) => (Array.isArray(group) ? group : [])).forEach((node) => {
    if (!node || typeof node !== "object") return;
    const key = node.id ? `id:${node.id}` : `anonymous:${anonymousIndex++}`;
    uniqueNodes.set(key, node);
  });

  return Array.from(uniqueNodes.values());
}

function collectUniqueEdges(...groups) {
  const uniqueEdges = new Set();

  groups.flatMap((group) => (Array.isArray(group) ? group : [])).forEach((edge, index) => {
    if (!edge || typeof edge !== "object") return;
    const key = edge.id || `${edge.source || "unknown"}:${edge.target || "unknown"}:${edge.label || index}`;
    uniqueEdges.add(key);
  });

  return uniqueEdges;
}

export function assessConversationConvergence({
  messages = [],
  existingNodes = [],
  attachedNodes = [],
  candidateNodes = [],
  existingEdges = [],
  candidateEdges = [],
} = {}) {
  const userTurnCount = (Array.isArray(messages) ? messages : []).filter(
    (message) => message?.role === "user" && String(message?.content || "").trim()
  ).length;
  const nodes = collectUniqueNodes(existingNodes, attachedNodes, candidateNodes);
  const categories = new Set(nodes.map(getNodeCategory).filter(Boolean));
  const relationCount = collectUniqueEdges(existingEdges, candidateEdges).size;
  const nodeCount = nodes.length;
  const categoryCount = categories.size;
  const hasStructuredGraph =
    (nodeCount >= 4 && categoryCount >= 3) ||
    (nodeCount >= 3 && categoryCount >= 2 && relationCount >= 2);
  const active = userTurnCount >= 5 && hasStructuredGraph;

  let level = CONVERGENCE_LEVELS.EXPLORE;
  if (active && userTurnCount >= 8) level = CONVERGENCE_LEVELS.CONCLUDE;
  else if (active && userTurnCount >= 6) level = CONVERGENCE_LEVELS.PRIORITIZE;
  else if (active) level = CONVERGENCE_LEVELS.SYNTHESIZE;

  return {
    active,
    level,
    userTurnCount,
    structure: {
      nodeCount,
      categoryCount,
      relationCount,
      structured: hasStructuredGraph,
    },
  };
}

export function buildConvergenceInstruction(convergence) {
  if (!convergence?.active) return "";

  const shared = `Adaptive convergence is active because the conversation has ${convergence.userTurnCount} user turns and the graph is sufficiently structured. This instruction overrides Diverge flow behavior for this response.`;
  if (convergence.level === CONVERGENCE_LEVELS.CONCLUDE) {
    return `${shared}\n- State the recommended conclusion in the first sentence.\n- Give the 2–3 strongest reasons, the accepted trade-off, and one concrete next action.\n- Do not reopen broad exploration. If evidence is incomplete, make a conditional conclusion and name only the single validation that could change it.`;
  }
  if (convergence.level === CONVERGENCE_LEVELS.PRIORITIZE) {
    return `${shared}\n- Compare the remaining viable directions against explicit criteria.\n- Rank them and recommend one provisional direction with its main trade-off.\n- Ask at most one question, only if it blocks commitment.`;
  }
  return `${shared}\n- Consolidate repetition and reduce the discussion to 2–3 viable directions.\n- Name the decision criteria and the single most important unresolved point.\n- Avoid opening new branches unless they reveal a critical risk.`;
}

export { CONVERGENCE_LEVELS };
