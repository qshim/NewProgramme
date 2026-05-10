"use client";

export default function DrawerMeetingCaptureSection({ meetingCaptureSummary }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Meeting capture</div>
      <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
        Ingest each speaker turn or note block as a new reasoning chunk. The graph and decision memory update immediately.
      </div>
      <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Latest update</div>
        <div className="mt-1 text-[12px] text-slate-700">
          {meetingCaptureSummary?.chunkSummary || "No meeting chunk has been captured yet."}
        </div>
        {meetingCaptureSummary ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Created {meetingCaptureSummary.createdNodeIds?.length || 0}
            </span>
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
              Linked {meetingCaptureSummary.linkedNodeIds?.length || 0}
            </span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Strengthened {meetingCaptureSummary.strengthenedNodeIds?.length || 0}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
