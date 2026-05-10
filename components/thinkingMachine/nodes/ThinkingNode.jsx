"use client";

import { useEffect, useState } from "react";
import { Handle, Position } from "reactflow";
import { getActionStateMeta } from "@/lib/thinkingMachine/nodeMeta";
import ConflictPopover from "@/components/thinkingMachine/conflicts/ConflictPopover";

const HANDLE_STYLE = {
  top: 38,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

function MetaChip({ label, iconSrc, iconSize = 10, className, style }) {
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold leading-none tracking-[-0.01em] ${className}`}
      style={style}
    >
      {iconSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          style={{ width: iconSize, height: iconSize, objectFit: "contain", marginRight: 3 }}
        />
      ) : null}
      {label}
    </span>
  );
}

function AnchorPort({ side }) {
  const sideClass = side === "left" ? "left-[-5px]" : "right-[-5px]";

  return (
    <span
      className={`pointer-events-none absolute ${sideClass} top-[31px] z-[40] flex h-[14px] w-[14px] items-center justify-center rounded-full border border-white/55 bg-white/82 shadow-[0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm`}
      aria-hidden
    >
      <span
        className="absolute h-[8px] w-[8px] rounded-full bg-slate-200/70"
      />
      <span
        className="relative h-[3px] w-[3px] rounded-full bg-slate-400/70 shadow-[0_0_0_1px_rgba(148,163,184,0.18)]"
      />
    </span>
  );
}

export default function ThinkingNode({ data = {} }) {
  const hasLeftPort = Boolean(data.hasLeftPort);
  const hasRightPort = Boolean(data.hasRightPort);

  const actionStateMeta = getActionStateMeta(data);
  const isReadyToShare = actionStateMeta.state === "ready_to_share";
  const actionStateKey = [
    actionStateMeta.state,
    data.visibility,
    Array.isArray(data.linkedNodeCategories) ? data.linkedNodeCategories.join("|") : "",
  ].join(":");
  const [dismissedReadyStateKey, setDismissedReadyStateKey] = useState("");
  const isActionStateVisible = !isReadyToShare || dismissedReadyStateKey !== actionStateKey;

  useEffect(() => {
    if (!isReadyToShare) return undefined;

    const timeout = window.setTimeout(() => {
      setDismissedReadyStateKey(actionStateKey);
    }, 2400);

    return () => window.clearTimeout(timeout);
  }, [actionStateKey, isReadyToShare]);

  return (
    <div className="relative h-full w-full cursor-grab active:cursor-grabbing">
      <ConflictPopover
        nodeId={data.nodeId}
        state={data.conflictState}
        summary={data.conflictSummary}
        linkedNodeTitles={data.conflictLinkedNodeTitles}
        explanation={data.conflictExplanation}
        isOpen={Boolean(data.isConflictPopoverOpen)}
        isLoading={Boolean(data.isConflictExplainLoading)}
        onToggle={data.onToggleConflictPopover}
        onExplain={data.onExplainConflict}
      />
      <div className="flex h-full w-full flex-col">
        <div className="relative w-full rounded-[18px] border border-white/60 bg-white/30 px-3 pt-4 pb-4 shadow-[0_14px_32px_rgba(15,23,42,0.14)] backdrop-blur-[18px]">
          <div className="mb-3 text-center text-[11px] font-semibold" style={{ color: "#194312" }}>
            {data.category}
          </div>
          <div className="rounded-[16px] bg-white/96 px-3 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
            <div
              className="font-heading line-clamp-2 font-semibold tracking-[-0.02em]"
              style={{ color: "#759270", fontSize: 12, lineHeight: 1.2 }}
            >
              {data.title || "Untitled node"}
            </div>
            <div
              className="mt-1 font-node-body line-clamp-3 text-[#667085]"
              style={{ fontSize: 11, lineHeight: 1.34 }}
            >
              {data.content}
            </div>
            {isActionStateVisible ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <MetaChip label={actionStateMeta.label} className={actionStateMeta.className} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hasLeftPort ? <AnchorPort side="left" /> : null}
      {hasRightPort ? <AnchorPort side="right" /> : null}
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
    </div>
  );
}
