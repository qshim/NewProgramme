"use client";

import { Check, MessageCircle, X } from "lucide-react";

export default function AlignmentStrategyCard({
  strategy,
  onApply,
  onRefine,
  onDismiss,
}) {
  if (!strategy) return null;

  const isApplied = strategy.status === "applied";
  const sourceTitle = strategy.sourceNode?.title || "Source node";
  const targetTitle = strategy.targetNode?.title || "Target node";

  return (
    <div className="rounded-2xl border border-pink-100/80 bg-[#FCE7F3]/55 p-3 shadow-[0_6px_16px_rgba(159,18,57,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9F1239]/70">
            Alignment strategy
          </div>
          <h2 className="mt-1 text-[14px] font-semibold leading-tight text-slate-800">
            Resolve unresolved difference
          </h2>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-pink-100 bg-white/70 text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label="Dismiss alignment strategy"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl bg-white/66 px-3 py-2.5">
        <div className="text-[11px] font-semibold text-slate-400">Relationship</div>
        <p className="mt-1 text-[12px] font-medium leading-snug text-slate-700">
          {sourceTitle} <span className="text-slate-400">-&gt;</span> {targetTitle}
        </p>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="text-[11px] font-semibold text-[#9F1239]/70">Why it is unresolved</div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
            {strategy.diagnosis}
          </p>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-[#9F1239]/70">Recommended strategy</div>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-700">
            {strategy.strategy}
          </p>
        </div>

        <div className="rounded-xl border border-white/70 bg-white/50 px-3 py-2">
          <div className="text-[11px] font-semibold text-slate-500">Next move</div>
          <ul className="mt-1 space-y-1 text-[12px] leading-relaxed text-slate-600">
            {strategy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      {isApplied ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700">
          Applied as Partial alignment. You can keep refining this relationship through the agent.
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F9A8D4] px-3 text-[11px] font-semibold text-[#831843] transition hover:bg-[#F472B6]"
          >
            <Check className="h-3.5 w-3.5" />
            Apply strategy
          </button>
          <button
            type="button"
            onClick={onRefine}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-white/72 px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-white"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Refine with agent
          </button>
        </div>
      )}
    </div>
  );
}
