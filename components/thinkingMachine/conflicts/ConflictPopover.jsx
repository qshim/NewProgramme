"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import { getConflictStateMeta, normalizeConflictState } from "@/lib/thinkingMachine/nodeMeta";

export default function ConflictPopover({
  nodeId,
  state = "none",
  summary = "",
  linkedNodeTitles = [],
  explanation = null,
  isOpen = false,
  isLoading = false,
  onToggle,
  onExplain,
}) {
  const normalizedState = normalizeConflictState(state);
  const meta = getConflictStateMeta(normalizedState);
  const containerRef = useRef(null);
  const relatedTitles = Array.isArray(linkedNodeTitles) ? linkedNodeTitles.slice(0, 2) : [];

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      onToggle?.(nodeId, false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, nodeId, onToggle]);

  if (normalizedState === "none") return null;

  return (
    <div ref={containerRef} className="absolute right-[8px] top-[8px] z-[90]">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggle?.(nodeId, !isOpen);
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-[0_8px_18px_rgba(15,23,42,0.12)] transition hover:bg-white"
        aria-label={meta.label}
        title={meta.label}
      >
        <AlertTriangle className={`h-3.5 w-3.5 ${meta.accentClassName}`} />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-8 w-[238px] rounded-2xl border border-white/80 bg-white/98 p-3 text-left shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-[18px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] font-semibold text-slate-700">Conflict signal</div>
            <MetaPill className={meta.className}>{meta.label}</MetaPill>
          </div>

          <div className="mt-2 text-[11px] leading-relaxed text-slate-600">
            {summary || "This node is pulling against another team-visible idea."}
          </div>

          {relatedTitles.length ? (
            <div className="mt-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Related</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {relatedTitles.map((title) => (
                  <span
                    key={title}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {explanation ? (
            <div className="mt-3 space-y-2">
              <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-700">
                {explanation.summary}
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600">{explanation.whyDifferent}</div>
              <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 text-[10px] text-slate-500">
                {explanation.suggestedNextStep}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onExplain?.(nodeId)}
            disabled={isLoading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#7BA592] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#6b907f] disabled:opacity-55"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? "Reading..." : explanation ? "Refresh AI view" : "AI로 자세히 보기"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
