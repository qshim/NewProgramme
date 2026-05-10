export default function AgentContextSummaryCard({
  summary,
  isLoading,
  error,
  onExplain,
  onFocusNode,
}) {
  const keyNodeIds = Array.isArray(summary?.keyNodeIds) ? summary.keyNodeIds : [];
  const openQuestions = Array.isArray(summary?.openQuestions) ? summary.openQuestions : [];

  return (
    <div className="rounded-2xl border border-white/70 bg-white/82 p-3.5 shadow-[0_16px_28px_rgba(15,23,42,0.10)] backdrop-blur-[14px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Agent readout</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-500">Likely intent and key nodes from recent team changes.</div>
        </div>
        <button
          type="button"
          onClick={onExplain}
          disabled={isLoading}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#7BA592] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#6b907f] disabled:opacity-55"
        >
          {isLoading ? "Reading..." : "Explain"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-slate-50/90 px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Likely intent</div>
            <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-800">{summary.likelyIntent}</div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/88 px-3 py-3 text-[12px] leading-relaxed text-slate-700">
            {summary.summary}
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Suggested focus</div>
            <div className="mt-1 text-[12px] text-slate-700">{summary.suggestedFocus}</div>
          </div>
          {keyNodeIds.length ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Key nodes</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {keyNodeIds.map((nodeId) => (
                  <button
                    key={nodeId}
                    type="button"
                    onClick={() => onFocusNode?.(nodeId)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {nodeId}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {openQuestions.length ? (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Open questions</div>
              <div className="mt-2 flex flex-col gap-1.5">
                {openQuestions.map((question) => (
                  <div key={question} className="rounded-xl bg-white/90 px-3 py-2 text-[11px] text-slate-600">
                    {question}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
          Select a teammate or a recent event, then ask the agent to explain the context.
        </div>
      )}
    </div>
  );
}
