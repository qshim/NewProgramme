import {
  normalizeNodeCategory,
  normalizeNodePhase,
  normalizeRelationLabel,
} from "@/lib/thinkingMachine/nodeMeta";
import {
  getAlignmentVisualMeta,
  inferFallbackEdgeAlignment,
} from "@/lib/thinkingMachine/reasoningAlignment";

const SOURCE_HANDLE_ID = "right-source";
const TARGET_HANDLE_ID = "left-target";

const FANOUT_STEP = 26;
const FANOUT_MAX = 104;

const EDGE_CLEARANCE_X = 20;
const EDGE_LINE_WIDTH = 1.65;
const EDGE_LINE_COLOR = "rgba(255, 255, 255, 0.68)";
const EDGE_LANE_GAP = 80;
const EDGE_CURVE_TENSION = 0.42;

function countExistingBySide(currentEdges) {
  const sourceCounts = new Map();
  const targetCounts = new Map();
  currentEdges.forEach((edge) => {
    sourceCounts.set(edge.source, (sourceCounts.get(edge.source) || 0) + 1);
    targetCounts.set(edge.target, (targetCounts.get(edge.target) || 0) + 1);
  });
  return { sourceCounts, targetCounts };
}

function getNodeY(node) {
  const y = node?.position?.y;
  return Number.isFinite(y) ? Number(y) : 0;
}

function computeFanoutOffset(slot, total) {
  if (!Number.isFinite(slot) || !Number.isFinite(total) || total <= 1) return 0;
  const center = (total - 1) / 2;
  const raw = (slot - center) * FANOUT_STEP;
  return Math.max(-FANOUT_MAX, Math.min(FANOUT_MAX, raw));
}

function assignSideMeta(normalizedEdges, nodeMap, currentEdges) {
  const { sourceCounts, targetCounts } = countExistingBySide(currentEdges);
  const sourceMeta = new Map();
  const targetMeta = new Map();

  const sourceGroups = new Map();
  const targetGroups = new Map();

  normalizedEdges.forEach((edge) => {
    const s = sourceGroups.get(edge.source) || [];
    s.push(edge);
    sourceGroups.set(edge.source, s);

    const t = targetGroups.get(edge.target) || [];
    t.push(edge);
    targetGroups.set(edge.target, t);
  });

  sourceGroups.forEach((list, nodeId) => {
    const base = sourceCounts.get(nodeId) || 0;
    const sorted = [...list].sort((a, b) => {
      const ay = getNodeY(nodeMap.get(a.target));
      const by = getNodeY(nodeMap.get(b.target));
      if (ay === by) return String(a.id).localeCompare(String(b.id));
      return ay - by;
    });
    const total = base + sorted.length;
    sorted.forEach((edge, idx) => {
      sourceMeta.set(edge.id, { slot: base + idx, total });
    });
  });

  targetGroups.forEach((list, nodeId) => {
    const base = targetCounts.get(nodeId) || 0;
    const sorted = [...list].sort((a, b) => {
      const ay = getNodeY(nodeMap.get(a.source));
      const by = getNodeY(nodeMap.get(b.source));
      if (ay === by) return String(a.id).localeCompare(String(b.id));
      return ay - by;
    });
    const total = base + sorted.length;
    sorted.forEach((edge, idx) => {
      targetMeta.set(edge.id, { slot: base + idx, total });
    });
  });

  return { sourceMeta, targetMeta };
}

function buildNodeCategoryMap(nodeList) {
  const map = new Map();
  nodeList.forEach((node) => {
    if (!node?.id) return;
    const category = node?.data?.category;
    if (typeof category === "string" && category) {
      map.set(node.id, normalizeNodeCategory(category));
    }
  });
  return map;
}

function buildNodeMap(nodeList) {
  const map = new Map();
  nodeList.forEach((node) => {
    if (node?.id) map.set(node.id, node);
  });
  return map;
}

function getNodeX(node) {
  const x = node?.position?.x;
  const base = Number.isFinite(x) ? Number(x) : 0;
  const w = node?.style?.width;
  return Number.isFinite(w) ? base + Number(w) / 2 : base;
}

function normalizeEdgeDirection(edge, nodeMap) {
  const sourceNode = nodeMap.get(edge.source);
  const targetNode = nodeMap.get(edge.target);
  if (!sourceNode || !targetNode) return edge;

  const sourcePhase = normalizeNodePhase(sourceNode?.data?.phase, sourceNode?.data?.category);
  const targetPhase = normalizeNodePhase(targetNode?.data?.phase, targetNode?.data?.category);
  const sourceX = getNodeX(sourceNode);
  const targetX = getNodeX(targetNode);

  let shouldSwap = false;

  // Problem -> Solution 흐름을 우선 적용
  if (sourcePhase === "Solution" && targetPhase === "Problem") {
    shouldSwap = true;
  } else if (sourceX > targetX) {
    // 좌->우 시각 흐름 유지 (동일 phase 포함)
    shouldSwap = true;
  }

  if (!shouldSwap) return edge;
  return {
    ...edge,
    source: edge.target,
    target: edge.source,
  };
}

export function toConnectorEdges(rawEdges, nodeList, currentEdges = []) {
  const categoryMap = buildNodeCategoryMap(nodeList);
  const nodeMap = buildNodeMap(nodeList);
  const normalizedEdges = rawEdges.map((edge) => normalizeEdgeDirection(edge, nodeMap));
  const { sourceMeta, targetMeta } = assignSideMeta(normalizedEdges, nodeMap, currentEdges);

  return normalizedEdges.map((normalizedEdge) => {
    const sourceHandle = SOURCE_HANDLE_ID;
    const targetHandle = TARGET_HANDLE_ID;
    const source = sourceMeta.get(normalizedEdge.id) || { slot: 0, total: 1 };
    const target = targetMeta.get(normalizedEdge.id) || { slot: 0, total: 1 };

    return {
      id: normalizedEdge.id,
      source: normalizedEdge.source,
      target: normalizedEdge.target,
      label: normalizeRelationLabel(normalizedEdge.label),
      type: "connectorEdge",
      animated: false,
      sourceHandle,
      targetHandle,
      data: {
        label: normalizeRelationLabel(normalizedEdge.label),
        sourceCategory: categoryMap.get(normalizedEdge.source) || "Idea",
        targetCategory: categoryMap.get(normalizedEdge.target) || "Idea",
        sourceOffsetY: computeFanoutOffset(source.slot, source.total),
        targetOffsetY: computeFanoutOffset(target.slot, target.total),
        clearanceX: EDGE_CLEARANCE_X,
        lineWidth: EDGE_LINE_WIDTH,
        lineColor: EDGE_LINE_COLOR,
        laneGap: EDGE_LANE_GAP,
        curveTension: EDGE_CURVE_TENSION,
      },
    };
  });
}

export function decorateConnectorEdges(edges = [], alignmentAnalysis = null) {
  return (Array.isArray(edges) ? edges : []).map((edge) => {
    const alignment =
      alignmentAnalysis?.edgeStatesById?.[edge?.id] ||
      inferFallbackEdgeAlignment(edge);
    const visualMeta = getAlignmentVisualMeta(alignment?.state);

    return {
      ...edge,
      data: {
        ...(edge?.data || {}),
        alignmentState: alignment?.state || "unresolved",
        alignmentScore: alignment?.score ?? 0,
        alignmentLabel: alignment?.displayLabel || visualMeta.label,
        alignmentReason: alignment?.summary || "",
        alignmentStroke: visualMeta.stroke,
        alignmentLabelBackground: visualMeta.labelBackground,
        alignmentLineDash: visualMeta.lineDash,
      },
    };
  });
}
