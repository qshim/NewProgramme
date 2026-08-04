import { normalizeNodeCategory } from "@/lib/thinkingMachine/nodeMeta";

const CLUSTER_GAP_X = 220;
const LAYOUT_COLUMN_GAP = 332;
const LAYOUT_ROW_GAP = 234;

const REASONING_ORDER = {
  Problem: 10,
  Goal: 20,
  Constraint: 30,
  Assumption: 35,
  Evidence: 40,
  OpenQuestion: 45,
  Insight: 50,
  Idea: 60,
  Option: 70,
  Risk: 80,
  Conflict: 85,
  Decision: 90,
};

export function computeNodeBounds(nodeList) {
  const list = Array.isArray(nodeList) ? nodeList : [];
  if (list.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  list.forEach((n) => {
    const x = n?.position?.x ?? 0;
    const y = n?.position?.y ?? 0;
    const w = n?.style?.width ?? 240;
    const h = n?.style?.height ?? 180;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });
  return { minX, minY, maxX, maxY };
}

export function shiftClusterRightOfExisting(existingNodes, incomingNodes) {
  const existingBounds = computeNodeBounds(existingNodes);
  const incomingBounds = computeNodeBounds(incomingNodes);
  if (!incomingBounds) return incomingNodes;
  if (!existingBounds) return incomingNodes;

  const desiredMinX = existingBounds.maxX + 320;
  const deltaX = desiredMinX - incomingBounds.minX;
  if (!Number.isFinite(deltaX) || deltaX <= 0) return incomingNodes;

  return incomingNodes.map((n) => ({
    ...n,
    position: { x: (n.position?.x ?? 0) + deltaX, y: n.position?.y ?? 0 },
  }));
}

function getNodeOrderScore(node) {
  const rawCategory = node?.data?.category;
  const category = normalizeNodeCategory(typeof rawCategory === "string" ? rawCategory : "");
  return REASONING_ORDER[category] ?? REASONING_ORDER.Idea;
}

function getClusterAverageOrder(nodeList) {
  const list = Array.isArray(nodeList) ? nodeList : [];
  if (!list.length) return REASONING_ORDER.Idea;
  const total = list.reduce((sum, node) => sum + getNodeOrderScore(node), 0);
  return total / list.length;
}

function getPhaseWeight(node) {
  return node?.data?.phase === "Solution" ? 4 : 0;
}

function getBaseLayoutRank(node) {
  const order = getNodeOrderScore(node);
  const phase = getPhaseWeight(node);
  return phase + Math.round(order / 15);
}

export function relayoutTopLevelThinkingNodes(nodeList, edgeList = []) {
  const nodes = Array.isArray(nodeList) ? nodeList : [];
  const edges = Array.isArray(edgeList) ? edgeList : [];
  const topLevelThinkingNodes = nodes.filter((node) => node?.type === "thinkingNode" && !node?.parentNode);
  if (topLevelThinkingNodes.length <= 1) return nodes;

  const nodeMap = new Map(topLevelThinkingNodes.map((node) => [node.id, node]));
  const outgoing = new Map();
  const indegree = new Map();
  const incoming = new Map();

  topLevelThinkingNodes.forEach((node) => {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
    indegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    if (!nodeMap.has(edge?.source) || !nodeMap.has(edge?.target)) return;
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const baseRank = new Map(topLevelThinkingNodes.map((node) => [node.id, getBaseLayoutRank(node)]));
  const rank = new Map(baseRank);
  const queue = topLevelThinkingNodes
    .filter((node) => (indegree.get(node.id) || 0) === 0)
    .sort((a, b) => (baseRank.get(a.id) || 0) - (baseRank.get(b.id) || 0));

  const visited = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (!current || visited.has(current.id)) continue;
    visited.add(current.id);
    const currentRank = rank.get(current.id) || 0;
    (outgoing.get(current.id) || []).forEach((targetId) => {
      rank.set(targetId, Math.max(rank.get(targetId) || 0, currentRank + 1, baseRank.get(targetId) || 0));
      indegree.set(targetId, Math.max(0, (indegree.get(targetId) || 0) - 1));
      if ((indegree.get(targetId) || 0) === 0) {
        queue.push(nodeMap.get(targetId));
        queue.sort((a, b) => (rank.get(a.id) || 0) - (rank.get(b.id) || 0));
      }
    });
  }

  topLevelThinkingNodes.forEach((node) => {
    if (!visited.has(node.id)) {
      rank.set(node.id, Math.max(rank.get(node.id) || 0, baseRank.get(node.id) || 0));
    }
  });

  const bounds = computeNodeBounds(topLevelThinkingNodes);
  if (!bounds) return nodes;
  const originX = bounds.minX;
  const originY = bounds.minY;

  const columns = new Map();
  topLevelThinkingNodes.forEach((node) => {
    const column = rank.get(node.id) || 0;
    const list = columns.get(column) || [];
    list.push(node);
    columns.set(column, list);
  });

  const nextPositions = new Map();
  [...columns.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([column, list]) => {
      const sorted = [...list].sort((a, b) => {
        const aNeighbors = incoming.get(a.id) || [];
        const bNeighbors = incoming.get(b.id) || [];
        const aHint =
          aNeighbors.reduce((sum, id) => sum + (nodeMap.get(id)?.position?.y ?? a.position?.y ?? 0), 0) /
            (aNeighbors.length || 1) || 0;
        const bHint =
          bNeighbors.reduce((sum, id) => sum + (nodeMap.get(id)?.position?.y ?? b.position?.y ?? 0), 0) /
            (bNeighbors.length || 1) || 0;
        if (aHint !== bHint) return aHint - bHint;
        return (a.position?.y ?? 0) - (b.position?.y ?? 0);
      });

      sorted.forEach((node, index) => {
        nextPositions.set(node.id, {
          x: originX + column * LAYOUT_COLUMN_GAP,
          y: originY + index * LAYOUT_ROW_GAP,
        });
      });
    });

  return nodes.map((node) => {
    if (!nextPositions.has(node.id)) return node;
    return {
      ...node,
      position: nextPositions.get(node.id),
    };
  });
}

export function shiftClusterRelativeToAnchor(anchorNode, incomingNodes, preferredSide) {
  const incomingBounds = computeNodeBounds(incomingNodes);
  const anchorBounds = computeNodeBounds(anchorNode ? [anchorNode] : []);
  if (!incomingBounds || !anchorBounds || !anchorNode) return incomingNodes;

  const clusterOrder = getClusterAverageOrder(incomingNodes);
  const anchorOrder = getNodeOrderScore(anchorNode);
  const resolvedSide =
    preferredSide || (clusterOrder < anchorOrder ? "left" : "right");

  const incomingCenterY = (incomingBounds.minY + incomingBounds.maxY) / 2;
  const anchorCenterY = (anchorBounds.minY + anchorBounds.maxY) / 2;
  const deltaY = anchorCenterY - incomingCenterY;

  let deltaX = 0;
  if (resolvedSide === "left") {
    const desiredMaxX = anchorBounds.minX - CLUSTER_GAP_X;
    deltaX = desiredMaxX - incomingBounds.maxX;
  } else {
    const desiredMinX = anchorBounds.maxX + CLUSTER_GAP_X;
    deltaX = desiredMinX - incomingBounds.minX;
  }

  return incomingNodes.map((node) => ({
    ...node,
    position: {
      x: (node.position?.x ?? 0) + deltaX,
      y: (node.position?.y ?? 0) + deltaY,
    },
  }));
}

function getNodeRect(node, padding = 0) {
  const x = node?.position?.x ?? 0;
  const y = node?.position?.y ?? 0;
  const width = node?.measured?.width ?? node?.style?.width ?? 240;
  const height = node?.measured?.height ?? node?.style?.height ?? node?.style?.minHeight ?? 180;
  return {
    minX: x - padding,
    minY: y - padding,
    maxX: x + width + padding,
    maxY: y + height + padding,
  };
}

function rectsOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function shiftNodesVertically(nodeList, deltaY) {
  if (!deltaY) return nodeList;
  return nodeList.map((node) => ({
    ...node,
    position: {
      x: node?.position?.x ?? 0,
      y: (node?.position?.y ?? 0) + deltaY,
    },
  }));
}

function avoidExistingNodeCollisions(existingNodes, incomingNodes) {
  const occupiedRects = (Array.isArray(existingNodes) ? existingNodes : [])
    .filter((node) => !node?.parentNode)
    .map((node) => getNodeRect(node, 36));
  if (!occupiedRects.length) return incomingNodes;

  const hasCollision = (candidateNodes) =>
    candidateNodes.some((node) => {
      const candidateRect = getNodeRect(node, 20);
      return occupiedRects.some((occupiedRect) => rectsOverlap(candidateRect, occupiedRect));
    });

  if (!hasCollision(incomingNodes)) return incomingNodes;

  for (let step = 1; step <= 8; step += 1) {
    for (const direction of [1, -1]) {
      const candidateNodes = shiftNodesVertically(incomingNodes, direction * step * LAYOUT_ROW_GAP);
      if (!hasCollision(candidateNodes)) return candidateNodes;
    }
  }

  return incomingNodes;
}

/**
 * Lays out only the incoming cluster. Existing node coordinates are treated as
 * user-owned canvas state and are never recalculated.
 */
export function placeIncomingNodesPreservingLayout(
  existingNodes,
  incomingNodes,
  edgeList = [],
  { anchorNode = null, preferredSide = null } = {}
) {
  const existing = Array.isArray(existingNodes) ? existingNodes : [];
  const incoming = Array.isArray(incomingNodes) ? incomingNodes : [];
  if (!incoming.length) return incoming;

  const compactIncoming = relayoutTopLevelThinkingNodes(incoming, edgeList);
  if (!existing.length) return compactIncoming;

  const existingById = new Map(existing.map((node) => [node?.id, node]).filter(([id]) => Boolean(id)));
  const incomingIds = new Set(compactIncoming.map((node) => node?.id).filter(Boolean));
  let resolvedAnchor = anchorNode;
  let resolvedSide = preferredSide;

  if (!resolvedAnchor) {
    for (const edge of Array.isArray(edgeList) ? edgeList : []) {
      if (existingById.has(edge?.source) && incomingIds.has(edge?.target)) {
        resolvedAnchor = existingById.get(edge.source);
        resolvedSide = "right";
        break;
      }
      if (incomingIds.has(edge?.source) && existingById.has(edge?.target)) {
        resolvedAnchor = existingById.get(edge.target);
        resolvedSide = "left";
        break;
      }
    }
  }

  const placedIncoming = resolvedAnchor
    ? shiftClusterRelativeToAnchor(resolvedAnchor, compactIncoming, resolvedSide)
    : shiftClusterRightOfExisting(existing, compactIncoming);

  return avoidExistingNodeCollisions(existing, placedIncoming);
}
