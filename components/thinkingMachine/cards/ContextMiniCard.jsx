"use client";

import { getSuggestionTagMeta, getTypeMeta, normalizeNodeData, normalizeSuggestionTags } from "@/lib/thinkingMachine/nodeMeta";

export default function ContextMiniCard({ item, isActive, onSelect }) {
  const normalized = normalizeNodeData(item);
  const colors = getTypeMeta(normalized.category);
  const suggestionTags = normalizeSuggestionTags(item?.suggestionTags || item?.tags, normalized);

  return (
    <button
      type="button"
      className={`relative flex h-[112px] w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border p-2.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.08)] backdrop-blur-[10px] transition ${
        isActive
          ? "border-teal-300 bg-white/72 ring-2 ring-teal-200"
          : "border-white/70 bg-white/50 hover:bg-white/60"
      }`}
      onClick={() => onSelect?.(item)}
      aria-label={`Select context card ${item?.title ?? ""}`}
    >
      <div className={`line-clamp-2 text-[11px] font-semibold leading-tight ${isActive ? colors.text : "text-slate-700"}`}>
        {item.title}
      </div>
      <div className="mt-1 line-clamp-3 flex-1 text-[10px] leading-tight text-slate-500">{item.content}</div>
      <div className="mt-2 flex min-h-[19px] flex-wrap items-end gap-1.5 pr-2">
        {[
          ["reasoning", suggestionTags.reasoning],
          ["lens", suggestionTags.lens],
          ["question", suggestionTags.question],
        ].filter(([axis, value]) => !(axis === "lens" && value === "User")).map(([axis, value]) => {
          const meta = getSuggestionTagMeta(axis, value);
          return (
            <span key={`${axis}-${value}`} className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${meta.className}`}>
              {value}
            </span>
          );
        })}
      </div>
    </button>
  );
}
