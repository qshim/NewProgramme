import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";

function sanitizeJsonValue(value) {
  if (value === null) return null;
  if (Array.isArray(value)) return value.map(sanitizeJsonValue);
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "undefined") return undefined;
  if (typeof value !== "object") return value;
  const entries = Object.entries(value).flatMap(([key, entryValue]) => {
    const sanitized = sanitizeJsonValue(entryValue);
    return typeof sanitized === "undefined" ? [] : [[key, sanitized]];
  });
  return Object.fromEntries(entries);
}

function serializeThinkingNode(node) {
  return {
    id: node.id,
    type: "thinkingNode",
    position: node.position,
    parentNode: node.parentNode,
    extent: node.extent,
    hidden: Boolean(node.hidden),
    data: sanitizeJsonValue({
      title: node?.data?.title || "",
      content: node?.data?.content || "",
      category: node?.data?.category,
      phase: node?.data?.phase,
      ownerId: node?.data?.ownerId,
      editedBy: node?.data?.editedBy,
      sourceType: node?.data?.sourceType,
      visibility: node?.data?.visibility,
      confidence: node?.data?.confidence,
      imageUrl: node?.data?.imageUrl || node?.data?.image_url || "",
      legacyCategory: node?.data?.legacyCategory || null,
      layerOrigin: node?.data?.layerOrigin,
      promotedFromVisibility: node?.data?.promotedFromVisibility || "",
      promotedAt: node?.data?.promotedAt || "",
      promotedBy: node?.data?.promotedBy || "",
      conflictState: node?.data?.conflictState || "none",
      conflictSummary: node?.data?.conflictSummary || "",
      conflictLinkedNodeIds: Array.isArray(node?.data?.conflictLinkedNodeIds)
        ? node.data.conflictLinkedNodeIds
        : [],
      conflictUpdatedAt: node?.data?.conflictUpdatedAt || "",
    }),
  };
}

export function serializeProjectGraph(nodes = [], edges = [], stage = "research-diverge") {
  return {
    nodes: (Array.isArray(nodes) ? nodes : []).map((node) => {
      if (node?.type === "thinkingNode") return serializeThinkingNode(node);
      const {
        selected,
        dragging,
        positionAbsolute,
        measured,
        ...safeNode
      } = node || {};
      void selected;
      void dragging;
      void positionAbsolute;
      void measured;
      return sanitizeJsonValue({
        ...safeNode,
        data: sanitizeJsonValue(safeNode?.data || {}),
      });
    }),
    edges: (Array.isArray(edges) ? edges : []).map((edge) => sanitizeJsonValue(edge)),
    stage,
  };
}

function hydrateThinkingNode(node) {
  const hydrated = toReactFlowNode(
    {
      id: node.id,
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node?.data?.title || "",
        content: node?.data?.content || "",
        category: node?.data?.category,
        phase: node?.data?.phase,
        ownerId: node?.data?.ownerId,
        editedBy: node?.data?.editedBy,
        sourceType: node?.data?.sourceType,
        visibility: node?.data?.visibility,
        confidence: node?.data?.confidence,
        imageUrl: node?.data?.imageUrl || "",
        legacyCategory: node?.data?.legacyCategory || null,
        layerOrigin: node?.data?.layerOrigin,
        promotedFromVisibility: node?.data?.promotedFromVisibility || "",
        promotedAt: node?.data?.promotedAt || "",
        promotedBy: node?.data?.promotedBy || "",
        conflictState: node?.data?.conflictState || "none",
        conflictSummary: node?.data?.conflictSummary || "",
        conflictLinkedNodeIds: Array.isArray(node?.data?.conflictLinkedNodeIds)
          ? node.data.conflictLinkedNodeIds
          : [],
        conflictUpdatedAt: node?.data?.conflictUpdatedAt || "",
      },
    },
    null
  );
  return {
    ...hydrated,
    parentNode: node.parentNode,
    extent: node.extent,
    hidden: Boolean(node.hidden),
  };
}

export function hydrateProjectNodes(nodes = []) {
  return (Array.isArray(nodes) ? nodes : []).map((node) => {
    if (node?.type === "thinkingNode") return hydrateThinkingNode(node);
    return sanitizeJsonValue(node);
  });
}

export function hydrateProjectEdges(edges = []) {
  return (Array.isArray(edges) ? edges : []).map((edge) => sanitizeJsonValue(edge));
}
