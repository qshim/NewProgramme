export function makeAttachedContextId(ids) {
  const base = Array.isArray(ids) ? ids.join(",") : "";
  return `attached-${Date.now()}-${base.length}-${Math.random().toString(16).slice(2, 6)}`;
}

export function buildAttachedNodesContext(selected) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const items = safeSelected
    .map((node) => ({
      id: node?.id,
      title: node?.data?.title,
      content: node?.data?.content,
      category: node?.data?.category,
      phase: node?.data?.phase,
      sourceType: node?.data?.sourceType,
      visibility: node?.data?.visibility,
      confidence: node?.data?.confidence,
    }))
    .filter((node) => typeof node.id === "string" && node.id && typeof node.title === "string" && node.title.trim().length > 0);

  return {
    id: makeAttachedContextId(items.map((item) => item.id)),
    type: "attachedNodes",
    title: items.length === 1 ? "Attached node" : `Attached nodes (${items.length})`,
    content: "Use these nodes as the primary context for this chat.",
    category: "Insight",
    phase: "Problem",
    sourceType: "mixed",
    visibility: "shared",
    confidence: "medium",
    attached_nodes: items,
  };
}

export function getPointerClientPoint(event) {
  const nativeEvent = event?.nativeEvent ?? event;
  const touch = nativeEvent?.touches?.[0] || nativeEvent?.changedTouches?.[0];
  if (touch) return { x: touch.clientX, y: touch.clientY };
  if (typeof nativeEvent?.clientX === "number" && typeof nativeEvent?.clientY === "number") {
    return { x: nativeEvent.clientX, y: nativeEvent.clientY };
  }
  return null;
}

export function isPointInRect(point, rect, pad = 0) {
  if (!point || !rect) return false;
  return (
    point.x >= rect.left - pad &&
    point.x <= rect.right + pad &&
    point.y >= rect.top - pad &&
    point.y <= rect.bottom + pad
  );
}

export function isPointInRightRegion(point, width, gutter = 240) {
  if (!point || !width) return false;
  return point.x >= width - gutter;
}

export function isPointNearRect(point, rect, pad = 28) {
  return isPointInRect(point, rect, pad);
}
