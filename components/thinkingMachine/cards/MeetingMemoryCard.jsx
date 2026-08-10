"use client";

import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

function StatPill({ label, value, className = "bg-slate-100 text-slate-600" }) {
  return (
    <div className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${className}`}>
      {label} {value}
    </div>
  );
}

function ItemList({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{title}</div>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.id || item} className="rounded-xl border border-slate-200/80 bg-white/88 px-3 py-2">
            {typeof item === "string" ? (
              <div className="text-[11px] text-slate-700">{item}</div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="line-clamp-1 text-[11px] font-semibold text-slate-700">{item.title}</div>
                </div>
                <MetaPill className="bg-slate-100 text-slate-600">{item.category}</MetaPill>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MeetingMemoryCard({
  readout,
  isLoading = false,
  uiLanguage = "en",
}) {
  const copy = getWorkspaceCopy(uiLanguage).teamContext;
  const rawChunkCount = readout?.rawChunkCount || 0;
  const latestChunk = readout?.latestChunk || null;
  const activeIssues = readout?.activeIssues || [];
  const unresolvedQuestions = readout?.unresolvedQuestions || [];
  const unresolvedAreas = readout?.unresolvedAreas || [];
  const decisionCandidates = readout?.decisionCandidates || [];
  const repeatedIssues = readout?.repeatedIssues || [];
  const nextStepImplications = readout?.nextStepImplications || [];
  const hasAnyMemory =
    rawChunkCount > 0 ||
    activeIssues.length > 0 ||
    unresolvedQuestions.length > 0 ||
    unresolvedAreas.length > 0 ||
    decisionCandidates.length > 0 ||
    repeatedIssues.length > 0 ||
    nextStepImplications.length > 0 ||
    Boolean(readout?.currentDirection);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/82 p-3.5 shadow-[0_16px_28px_rgba(15,23,42,0.10)] backdrop-blur-[14px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{copy.decisionMemory}</div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {copy.memoryDescription}
          </div>
        </div>
        <MetaPill className="bg-slate-100 text-slate-600">
          {isLoading ? copy.updating : `${rawChunkCount} ${copy.chunks}`}
        </MetaPill>
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <StatPill label={copy.active} value={activeIssues.length} />
          <StatPill label={copy.questions} value={unresolvedQuestions.length || unresolvedAreas.length} />
          <StatPill label={copy.decisions} value={decisionCandidates.length} />
          <StatPill label={copy.repeats} value={repeatedIssues.length} />
        </div>

        <div className="rounded-xl bg-slate-50/90 px-3 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{copy.currentDirection}</div>
          <div className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-800">
            {readout?.currentDirection || copy.noStableDirection}
          </div>
        </div>

        {!hasAnyMemory ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white/88 px-3 py-3 text-[11px] leading-relaxed text-slate-500">
            {copy.memoryEmpty}
          </div>
        ) : null}

        {latestChunk ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{copy.latestChunk}</div>
              <div className="text-[10px] text-slate-400">{latestChunk.chunkType || "speaker_turn"}</div>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-700">
              {latestChunk.summary || latestChunk.text}
            </div>
          </div>
        ) : null}

        <ItemList
          title={copy.activeIssues}
          items={activeIssues}
        />
        <ItemList
          title={copy.unresolvedQuestions}
          items={unresolvedQuestions.length ? unresolvedQuestions : unresolvedAreas}
        />
        <ItemList
          title={copy.decisionCandidates}
          items={decisionCandidates}
        />
        <ItemList
          title={copy.repeatedIssues}
          items={repeatedIssues}
        />
        <ItemList
          title={copy.nextImplications}
          items={nextStepImplications}
        />
      </div>
    </div>
  );
}
