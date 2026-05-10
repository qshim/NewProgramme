"use client";

import { RefreshCcw } from "lucide-react";

const VISIBLE_ACTIVITY_TYPES = new Set([
  "node_shared",
  "node_promoted_to_team",
  "conflict_created",
  "node_conflict_detected",
  "node_reviewed",
  "node_agreed",
  "decision_created",
]);

function shouldDisplayActivityItem(item) {
  if (!item || typeof item !== "object") return false;
  return VISIBLE_ACTIVITY_TYPES.has(String(item.type || "").toLowerCase());
}

function formatActivityTypeLabel(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "node_shared") return "Shared";
  if (normalized === "node_promoted_to_team") return "To team";
  if (normalized === "conflict_created") return "Conflict raised";
  if (normalized === "node_conflict_detected") return "Conflict signal";
  if (normalized === "node_reviewed") return "Reviewed";
  if (normalized === "node_agreed") return "Agreed";
  if (normalized === "decision_created") return "Decision added";
  return String(type || "").replace(/_/g, " ");
}

function formatTimestamp(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ActivityLogCard({ projectLastUpdated, lastRefreshedAt, activityLog, onRefresh }) {
  const items = (Array.isArray(activityLog) ? activityLog : []).filter(shouldDisplayActivityItem);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Activity</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Updated {formatTimestamp(projectLastUpdated)} · Refreshed {formatTimestamp(lastRefreshedAt)}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {items.length ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white/68">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`px-3 py-2.5 ${index !== items.length - 1 ? "border-b border-slate-200/75" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {formatActivityTypeLabel(item.type)}
                  </div>
                  <div className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-700">
                    {item.nodeTitle || "Untitled node"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {item.nodeType ? `${item.nodeType} · ` : ""}
                    {item.userRole || "owner"} · {item.userId || "mock-user-1"}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5 text-[10px] text-slate-400">{formatTimestamp(item.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-slate-400">No team-relevant activity yet in this project.</div>
      )}
    </div>
  );
}

