"use client";

import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import { getAlignmentVisualMeta } from "@/lib/thinkingMachine/reasoningAlignment";

function EmphasizedSummary({ summary = "" }) {
  const text = String(summary || "");
  const clarificationIndex = text.toLowerCase().indexOf("clarification");
  const needsIndex = text.indexOf(" still needs ");

  if (needsIndex === -1) {
    return <>{text}</>;
  }

  const nodeTitle = text.slice(0, needsIndex);
  const beforeClarification = clarificationIndex > -1 ? text.slice(needsIndex, clarificationIndex) : text.slice(needsIndex);
  const afterClarification = clarificationIndex > -1 ? text.slice(clarificationIndex + "clarification".length) : "";

  return (
    <>
      <strong className="font-medium text-slate-800">{nodeTitle}</strong>
      {beforeClarification}
      {clarificationIndex > -1 ? (
        <strong className="font-medium text-[#9F1239]">clarification</strong>
      ) : null}
      {afterClarification}
    </>
  );
}

function Section({ items = [], onSelectSignal }) {
  if (!items.length) return null;

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => {
          const meta = getAlignmentVisualMeta(item.state);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSignal?.(item)}
              className={`group w-full cursor-pointer rounded-xl border px-3 py-2 text-left transition hover:-translate-y-[1px] hover:shadow-[0_14px_34px_rgba(15,23,42,0.035)] ${meta.cardClassName}`}
            >
              <div className="text-[12px] leading-relaxed text-slate-600">
                <EmphasizedSummary summary={item.summary} />
              </div>
              {item.state === "unresolved" ? (
                <div className="mt-1.5 text-right text-[10px] font-medium text-[#9F1239]/45 transition group-hover:text-[#9F1239]/80">
                  Resolve
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AlignmentSummaryCard({
  selectedNode,
  summary,
  onSelectSignal,
}) {
  const counts = summary?.counts || {};
  const sections = summary?.sections || {};
  const totalSignals =
    (counts.aligned || 0) +
    (counts.partially_aligned || 0) +
    (counts.unresolved || 0) +
    (counts.in_tension || 0) +
    (counts.contradictory || 0);
  const divergingCount = (counts.in_tension || 0) + (counts.contradictory || 0);
  const alignedCount = counts.aligned || 0;
  const partialAlignmentCount = counts.partially_aligned || 0;

  return (
    <div className="px-0.5 py-1">
      <div className="flex items-start justify-between gap-2">
        <div style={{ position: "relative", left: 3 }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Reasoning alignment</div>
        </div>
        <MetaPill className="bg-slate-100 text-slate-600 whitespace-nowrap shrink-0">
          {totalSignals} signals
        </MetaPill>
      </div>

      {totalSignals > 0 ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {alignedCount > 0 ? (
              <MetaPill className="bg-yellow-100 text-yellow-700">
                Aligned {alignedCount}
              </MetaPill>
            ) : null}
            {partialAlignmentCount > 0 ? (
              <MetaPill className="bg-emerald-100 text-emerald-700">
                Partial alignment {partialAlignmentCount}
              </MetaPill>
            ) : null}
            {(counts.unresolved || 0) > 0 ? (
              <MetaPill className="bg-pink-100 text-[#9F1239]">
                Unresolved {(counts.unresolved || 0)}
              </MetaPill>
            ) : null}
            {divergingCount > 0 ? (
              <MetaPill className="bg-amber-100 text-amber-700">
                Diverging {divergingCount}
              </MetaPill>
            ) : null}
          </div>

          <Section items={sections.unresolved} onSelectSignal={onSelectSignal} />
          <Section items={sections.aligned} onSelectSignal={onSelectSignal} />
          <Section items={sections.diverging} onSelectSignal={onSelectSignal} />
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2 text-[11px] text-slate-500">
          Not enough reasoning signals yet. As the graph gains more links, this card will summarize shared direction, unresolved differences, and tension.
        </div>
      )}
    </div>
  );
}
