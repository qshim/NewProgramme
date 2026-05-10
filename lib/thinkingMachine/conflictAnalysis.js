import { buildReasoningAlignmentAnalysis } from "@/lib/thinkingMachine/reasoningAlignment";
import { normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";

const TEAM_VISIBILITY = new Set(["shared", "reviewed", "agreed"]);
const CONFLICT_STATES = new Set(["in_tension", "contradictory"]);

function getPriorityScore(item) {
  if (item?.state === "contradictory") return 100;
  if (item?.state === "in_tension") return 60;
  return 0;
}

function isTeamThinkingNode(node) {
  return node?.type === "thinkingNode" && TEAM_VISIBILITY.has(normalizeVisibility(node?.data?.visibility));
}

function ensureConflictEntry(map, nodeId) {
  if (!map.has(nodeId)) {
    map.set(nodeId, {
      nodeId,
      state: "none",
      summary: "",
      linkedNodeIds: [],
      items: [],
    });
  }
  return map.get(nodeId);
}

export function buildTeamConflictAnalysis({ nodes = [], edges = [] } = {}) {
  const teamNodes = (Array.isArray(nodes) ? nodes : []).filter(isTeamThinkingNode);
  const nodeMap = new Map(teamNodes.map((node) => [node.id, node]));
  const teamNodeIds = new Set(nodeMap.keys());
  const teamEdges = (Array.isArray(edges) ? edges : []).filter(
    (edge) => teamNodeIds.has(edge?.source) && teamNodeIds.has(edge?.target)
  );
  const alignment = buildReasoningAlignmentAnalysis({
    nodes: teamNodes,
    edges: teamEdges,
  });
  const conflictItemsByNodeId = new Map();

  alignment.relationships
    .filter((relationship) => CONFLICT_STATES.has(relationship.state))
    .forEach((relationship) => {
      relationship.nodeIds.forEach((nodeId) => {
        const entry = ensureConflictEntry(conflictItemsByNodeId, nodeId);
        entry.items.push({
          id: relationship.id,
          source: "relationship",
          state: relationship.state,
          summary: relationship.summary,
          label: relationship.displayLabel,
          nodeIds: relationship.nodeIds,
          score: Math.abs(relationship.score || 0),
          reasons: relationship.reasons || [],
        });
      });
    });

  alignment.zones
    .filter((zone) => CONFLICT_STATES.has(zone.state))
    .forEach((zone) => {
      zone.nodeIds.forEach((nodeId) => {
        const entry = ensureConflictEntry(conflictItemsByNodeId, nodeId);
        entry.items.push({
          id: zone.id,
          source: "zone",
          state: zone.state,
          summary: zone.summary,
          label: zone.label,
          nodeIds: zone.nodeIds,
          score: 0.92,
          reasons: [],
        });
      });
    });

  const conflictByNodeId = Object.fromEntries(
    [...conflictItemsByNodeId.entries()].map(([nodeId, entry]) => {
      const sortedItems = [...entry.items].sort((a, b) => {
        const priorityDelta = getPriorityScore(b) - getPriorityScore(a);
        if (priorityDelta !== 0) return priorityDelta;
        return (b.score || 0) - (a.score || 0);
      });
      const primaryItem = sortedItems[0] || null;
      const state = sortedItems.some((item) => item.state === "contradictory")
        ? "contradictory"
        : sortedItems.some((item) => item.state === "in_tension")
          ? "tension"
          : "none";
      const linkedNodeIds = Array.from(
        new Set(
          sortedItems
            .flatMap((item) => item.nodeIds || [])
            .filter((candidateId) => candidateId && candidateId !== nodeId)
        )
      );
      const linkedNodeTitles = linkedNodeIds
        .map((candidateId) => nodeMap.get(candidateId)?.data?.title || "")
        .filter(Boolean);

      return [
        nodeId,
        {
          nodeId,
          state,
          summary: primaryItem?.summary || "",
          label: primaryItem?.label || "",
          linkedNodeIds,
          linkedNodeTitles,
          items: sortedItems,
        },
      ];
    })
  );

  return {
    alignment,
    teamNodes,
    teamEdges,
    conflictByNodeId,
  };
}
