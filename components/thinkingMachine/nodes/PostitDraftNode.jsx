"use client";

import { Loader2, Send } from "lucide-react";

export default function PostitDraftNode({ id, data, selected }) {
  const text = typeof data?.text === "string" ? data.text : "";
  const onChangeText = data?.onChangeText;
  const onSubmit = data?.onSubmit;
  const isSubmitting = Boolean(data?.isSubmitting);

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[22px] border ${
        selected ? "border-teal-300 ring-2 ring-teal-200/70" : "border-white/70"
      } bg-white/80 shadow-[0_5px_12px_rgba(0,0,0,0.03)] backdrop-blur-[10px]`}
    >
      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-r from-amber-100/70 to-lime-100/50" />
      <div className="relative flex h-full w-full flex-col gap-1.5 px-3 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold tracking-[0.02em] text-slate-600">Post-it</div>
          <button
            type="button"
            onClick={() => onSubmit?.(id)}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-teal-500 text-white shadow-sm transition hover:bg-teal-600 active:scale-[0.98] disabled:opacity-40"
            disabled={!text.trim() || isSubmitting}
            aria-label="Send post-it for analysis"
            title="Analyze"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => onChangeText?.(id, e.target.value)}
          placeholder="Write your idea freely..."
          disabled={isSubmitting}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="nodrag nopan min-h-0 flex-1 resize-none rounded-[16px] border border-white/60 bg-white/50 px-2.5 py-2 text-[11px] leading-[1.4] text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-300 disabled:opacity-70"
        />
      </div>
    </div>
  );
}
