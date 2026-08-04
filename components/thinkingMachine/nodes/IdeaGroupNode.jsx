"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Handle, Position } from "reactflow";

const HANDLE_STYLE = {
  top: 46,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

export default function IdeaGroupNode({ id, data, selected }) {
  const mode = data?.mode === "raw" ? "raw" : "nodes";
  const title = typeof data?.title === "string" && data.title.trim() ? data.title : "Idea bundle";
  const onToggle = data?.onToggle;

  const isRaw = mode === "raw";

  return (
    <div
      className={`relative h-full w-full rounded-[24px] border ${
        selected ? "border-teal-300/70 ring-2 ring-teal-200/50" : "border-white/45"
      } bg-white/12 shadow-[0_6px_14px_rgba(0,0,0,0.025)]`}
    >
      <div className="absolute left-3 top-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onToggle?.(id)}
          className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/55 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-sm transition hover:bg-white/70 active:scale-[0.99]"
          aria-label="Toggle raw ideas view"
          title="Toggle raw ideas"
        >
          {isRaw ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {isRaw ? "Raw ideas" : "Nodes"}
        </button>
        <span className="text-[10px] font-semibold tracking-[-0.01em] text-slate-700/80">{title}</span>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[24px] ring-0 ring-teal-300/20 transition" />
      <span className="pointer-events-none absolute left-[-4px] top-[39px] z-[30] h-[10px] w-[10px] rounded-full border border-white/45 bg-white/70 shadow-[0_3px_8px_rgba(15,23,42,0.03)]" />
      <span className="pointer-events-none absolute right-[-4px] top-[39px] z-[30] h-[10px] w-[10px] rounded-full border border-white/45 bg-white/70 shadow-[0_3px_8px_rgba(15,23,42,0.03)]" />

      {/* Invisible handles so connector edges can anchor to groups */}
      <Handle id="right-source" type="source" position={Position.Right} style={{ ...HANDLE_STYLE }} isConnectable={false} />
      <Handle id="left-target" type="target" position={Position.Left} style={{ ...HANDLE_STYLE }} isConnectable={false} />
    </div>
  );
}
