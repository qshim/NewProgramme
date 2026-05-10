"use client";

import {
  getActionStateMeta,
  getPreviousVisibility,
  getQuestionFocusLabel,
  getVisibilityMeta,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";

function CompactPill({ children, className = "bg-slate-100 text-slate-600" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>
      {children}
    </span>
  );
}

export default function NodeDetailCard({
  selectedNode,
  linkedNodes,
  currentUserRole,
  onPromote,
  onDemote,
  onShare,
  quickActions = [],
  onClearSelection,
}) {
  if (!selectedNode) return null;

  const data = normalizeNodeData(selectedNode.data || {});
  const linked = Array.isArray(linkedNodes) ? linkedNodes : [];
  const canEdit = currentUserRole === "owner" || currentUserRole === "editor";
  const actionStateMeta = getActionStateMeta({
    ...data,
    linkedNodeCategories: linked.map((item) => item.category),
  });
  const visibilityMeta = getVisibilityMeta(data.visibility);
  const questionFocusLabel = getQuestionFocusLabel(data);
  const canDemote = canEdit && getPreviousVisibility(data.visibility) !== data.visibility;
  const canShare = canEdit && !["shared", "reviewed", "agreed"].includes(data.visibility);
  const primaryActionLabel = canShare ? "Share" : canDemote ? "Demote" : "Shared";
  const primaryActionHandler = canShare ? onShare : onDemote;
  const topQuickActions = quickActions.slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/72 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{data.category}</div>
          <h2 className="mt-1 line-clamp-2 font-heading text-[15px] font-semibold leading-tight text-slate-800">
            {selectedNode.data?.title || "Untitled node"}
          </h2>
        </div>
        {onClearSelection ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/82 text-[12px] font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="Clear selected node"
          >
            x
          </button>
        ) : null}
      </div>

      <p className="mt-2 rounded-xl bg-slate-50/80 px-2.5 py-2 text-[12px] font-semibold leading-relaxed text-slate-700">
        {selectedNode.data?.content && selectedNode.data.content.trim().length > 0
          ? selectedNode.data.content
          : "Add one clear sentence that captures what this node is about."}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <CompactPill className={actionStateMeta.className}>{actionStateMeta.label}</CompactPill>
        <CompactPill>{visibilityMeta.label}</CompactPill>
        <span className="text-[11px] font-semibold text-slate-400">Focus: {questionFocusLabel}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={primaryActionHandler}
          disabled={!canShare && !canDemote}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-xl bg-[#A8F2D0] px-3 text-xs font-semibold text-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryActionLabel}
        </button>
        <button
          type="button"
          onClick={onPromote}
          disabled={!canEdit}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Promote
        </button>
      </div>

      {topQuickActions.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Add:</span>
          {topQuickActions.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-teal-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600"
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-slate-200/70 pt-2 text-[11px] font-semibold text-slate-400">
        {linked.length ? `${linked.length} linked node${linked.length === 1 ? "" : "s"}` : "No linked nodes yet"}
        {linked[0]?.title ? <span className="text-slate-500"> · {linked[0].title}</span> : null}
      </div>
    </div>
  );
}
