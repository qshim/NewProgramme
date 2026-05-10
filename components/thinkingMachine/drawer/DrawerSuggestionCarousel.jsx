"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import ContextMiniCard from "@/components/thinkingMachine/cards/ContextMiniCard";

export default function DrawerSuggestionCarousel({
  suggestionItems = [],
  activeSuggestion,
  contextScrollRef,
  canScrollSuggestionsLeft,
  canScrollSuggestionsRight,
  onSuggestionScroll,
  onChatContextSelect,
}) {
  if (!suggestionItems.length) return null;

  return (
    <div className="relative shrink-0 pb-3" style={{ paddingTop: 4 }}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10"
        style={{
          background:
            "linear-gradient(90deg, rgba(235, 247, 241, 0.92) 0%, rgba(228, 245, 238, 0.62) 52%, rgba(228, 245, 238, 0) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10"
        style={{
          background:
            "linear-gradient(270deg, rgba(235, 247, 241, 0.92) 0%, rgba(228, 245, 238, 0.62) 52%, rgba(228, 245, 238, 0) 100%)",
        }}
      />

      <button
        type="button"
        onClick={() => onSuggestionScroll?.("left")}
        disabled={!canScrollSuggestionsLeft}
        className="pointer-events-auto absolute left-0 top-1/2 z-[3] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/82 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.08)] transition disabled:cursor-default disabled:opacity-35"
        aria-label="Scroll suggestions left"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onSuggestionScroll?.("right")}
        disabled={!canScrollSuggestionsRight}
        className="pointer-events-auto absolute right-0 top-1/2 z-[3] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/82 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.08)] transition disabled:cursor-default disabled:opacity-35"
        aria-label="Scroll suggestions right"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      <div
        ref={contextScrollRef}
        className="overflow-x-auto overflow-y-hidden px-8"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex min-w-max gap-3 pr-2">
          {suggestionItems.map((item) => (
            <div key={item.id} className="w-[168px] shrink-0">
              <ContextMiniCard
                item={item}
                isActive={activeSuggestion?.id === item.id}
                onSelect={onChatContextSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
