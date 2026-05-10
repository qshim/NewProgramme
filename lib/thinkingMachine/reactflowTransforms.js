import {
  getActionStateMeta,
  getTypeMeta,
  getVisibilityCardMeta,
  getVisibilityMeta,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";

export const NODE_CARD_TOKENS = {
  width: 288,
  minHeight: 140,
  radius: "22px",
  imageRadius: "16px",
  borderWidth: "1px",
  paddingX: "12px",
  paddingTop: "12px",
  paddingBottom: "11px",
  contentGap: "8px",
  chipFontSize: "10px",
  chipPaddingX: "8px",
  chipPaddingY: "5px",
  metaFontSize: "9px",
  metaPaddingX: "7px",
  metaPaddingY: "4px",
  titleFontSize: "13px",
  bodyFontSize: "11px",
};

export function extractNodeImageUrl(rawData) {
  const candidates = [
    rawData?.image_url,
    rawData?.imageUrl,
    rawData?.image,
    rawData?.image_src,
    rawData?.imageSrc,
  ];
  return candidates.find((v) => typeof v === "string" && v.trim().length > 0) || null;
}

function Chip({ label }) {
  const backgroundColor = "#FFFFFF";
  return (
    <span
      className="inline-flex items-center justify-center gap-1 rounded-full font-semibold leading-none tracking-[-0.01em] text-[#111111]"
      style={{
        backgroundColor,
        fontSize: NODE_CARD_TOKENS.chipFontSize,
        paddingInline: NODE_CARD_TOKENS.chipPaddingX,
        paddingBlock: NODE_CARD_TOKENS.chipPaddingY,
      }}
    >
      {label}
    </span>
  );
}

function MetaChip({ label, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold leading-none tracking-[-0.01em] ${className}`}
      style={{
        fontSize: NODE_CARD_TOKENS.metaFontSize,
        paddingInline: NODE_CARD_TOKENS.metaPaddingX,
        paddingBlock: NODE_CARD_TOKENS.metaPaddingY,
      }}
    >
      {label}
    </span>
  );
}

// 노드 데이터에서 JSX label 빌드 (재사용)
export function buildNodeLabel(nodeData) {
  const actionStateMeta = getActionStateMeta(nodeData);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="relative w-full rounded-[18px] bg-gradient-to-b from-emerald-50/90 to-emerald-50/40 px-4 pt-4 pb-4">
        <div className="mb-3 text-center text-[11px] font-semibold text-emerald-800">
          {nodeData.category}
        </div>
        <div className="rounded-[16px] bg-white px-4 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
          <div
            className="font-heading line-clamp-2 font-semibold tracking-[-0.02em]"
            style={{ color: "#1B2739", fontSize: NODE_CARD_TOKENS.titleFontSize, lineHeight: 1.18 }}
          >
            {nodeData.title || "Untitled node"}
          </div>
          <div
            className="mt-1 font-node-body line-clamp-3 text-[#667085]"
            style={{ fontSize: NODE_CARD_TOKENS.bodyFontSize, lineHeight: 1.34 }}
          >
            {nodeData.content}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MetaChip label={actionStateMeta.label} className={actionStateMeta.className} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function buildNodeStyle(nodeData) {
  const visibilityCardMeta = getVisibilityCardMeta(nodeData.visibility);
  return {
    background: "rgba(198, 236, 179, 0.12)",
    border: "none",
    borderRadius: "16px",
    padding: "0",
    width: NODE_CARD_TOKENS.width,
    minHeight: NODE_CARD_TOKENS.minHeight,
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    boxShadow: visibilityCardMeta.boxShadow,
    zIndex: 20,
  };
}

export function toReactFlowNode(n, highlightedId) {
  const normalizedData = normalizeNodeData(n.data);
  const nodeData = {
    title: n.data.label,
    content: n.data.content,
    phase: normalizedData.phase,
    category: normalizedData.category,
    ownerId: normalizedData.ownerId,
    editedBy: normalizedData.editedBy,
    sourceType: normalizedData.sourceType,
    visibility: normalizedData.visibility,
    confidence: normalizedData.confidence,
    legacyCategory:
      typeof n.data?.category === "string" && n.data.category !== normalizedData.category
        ? n.data.category
        : null,
    imageUrl: extractNodeImageUrl(n.data),
    layerOrigin: normalizedData.layerOrigin,
    promotedFromVisibility: normalizedData.promotedFromVisibility,
    promotedAt: normalizedData.promotedAt,
    promotedBy: normalizedData.promotedBy,
    conflictState: normalizedData.conflictState,
    conflictSummary: normalizedData.conflictSummary,
    conflictLinkedNodeIds: normalizedData.conflictLinkedNodeIds,
    conflictUpdatedAt: normalizedData.conflictUpdatedAt,
    is_ai_suggestion: false,
  };
  const rfNode = {
    id: n.id,
    type: "thinkingNode",
    position: n.position,
    className: `tm-node-shell ${n.id === highlightedId ? "node-highlighted" : ""}`.trim(),
    data: { ...nodeData },
    style: buildNodeStyle(nodeData),
  };
  // ReactFlow node renderer expects `data.label` to be renderable content (JSX).
  // Keep the raw text in `data.content` for AI + exports.
  rfNode.data.label = buildNodeLabel(nodeData);
  return rfNode;
}
