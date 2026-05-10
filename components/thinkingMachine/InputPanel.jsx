"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownRight, Lightbulb, Send, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { getTypeMeta } from "@/lib/thinkingMachine/nodeMeta";

const TYPE_PROMPT_COPY = {
  Evidence: "What signal, interview quote, observed behavior, or data point would make this credible?",
  OpenQuestion: "What critical question is still unresolved, and why does it matter now?",
  Assumption: "What are we taking for granted that still needs validation before we proceed?",
  Conflict: "Where is the tension, trade-off, or contradiction that could break alignment?",
  Insight: "What pattern, implication, or takeaway should we make explicit here?",
  Problem: "What is the underlying issue, not just the surface symptom?",
  Idea: "What new direction is worth testing before we narrow too early?",
  Option: "What are the real alternatives available from this point?",
  Risk: "What could fail, stall, or create unintended consequences?",
  Decision: "What choice are we actually prepared to make, and on what basis?",
  Constraint: "What boundary or dependency will shape the next move?",
  Goal: "What outcome should this thread ultimately optimize for?",
};

const TYPE_PLACEHOLDER_COPY = {
  Evidence: "Add evidence...",
  OpenQuestion: "Add a question...",
  Assumption: "Add an assumption...",
  Conflict: "Add a tension or conflict...",
  Insight: "Add an insight...",
  Problem: "Add a problem statement...",
  Idea: "Add an idea...",
  Option: "Add an option...",
  Risk: "Add a risk...",
  Decision: "Add a decision...",
  Constraint: "Add a constraint...",
  Goal: "Add a goal...",
};

function TypeChip({ label, isActive, onClick }) {
  const meta = getTypeMeta(label);
  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
        isActive ? `${meta.tint} ${meta.text} ring-1 ring-black/5` : "bg-white/75 text-slate-500 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function InputPanel({
  onSubmit,
  isAnalyzing,
  selectedNode,
  hasThinkingGraph = false,
  suggestedTypes = [],
  stage,
  placeholderText,
  selectedNodePromptText,
}) {
  const [text, setText] = useState("");
  const [preferredType, setPreferredType] = useState(
    Array.isArray(suggestedTypes) && suggestedTypes[0] ? suggestedTypes[0] : ""
  );
  const [onboardingExpired, setOnboardingExpired] = useState(false);
  const onboardingDismissedRef = useRef(false);
  const shouldClearAfterAnalyzeRef = useRef(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isOverlayExiting, setIsOverlayExiting] = useState(false);

  useEffect(() => {
    if (selectedNode || hasThinkingGraph || onboardingDismissedRef.current) {
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      onboardingDismissedRef.current = true;
      setOnboardingExpired(true);
    }, 6500);

    return () => window.clearTimeout(fadeTimer);
  }, [hasThinkingGraph, selectedNode]);

  useEffect(() => {
    if (isAnalyzing) {
      setShowLoadingOverlay(true);
      setIsOverlayExiting(false);
      return;
    }

    if (!isAnalyzing && shouldClearAfterAnalyzeRef.current) {
      setIsOverlayExiting(true);
      const clearTimer = window.setTimeout(() => {
        shouldClearAfterAnalyzeRef.current = false;
        setShowLoadingOverlay(false);
        setIsOverlayExiting(false);
        setText("");
      }, 220);

      return () => window.clearTimeout(clearTimer);
    }
  }, [isAnalyzing]);

  const showOnboardingHint = !selectedNode && !hasThinkingGraph && !onboardingExpired;
  const activeTypePrompt = TYPE_PROMPT_COPY[preferredType] || placeholderText || "";
  const visibleSuggestedTypes = (Array.isArray(suggestedTypes) ? suggestedTypes : []).slice(0, 3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isAnalyzing) return;
    shouldClearAfterAnalyzeRef.current = true;
    onSubmit?.({
      text,
      preferredType,
      selectedNode,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[85] flex justify-center px-4 pb-5"
    >
      <div className="pointer-events-auto w-full max-w-[37rem]">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
          {!selectedNode ? (
            showOnboardingHint ? (
              <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/76 px-3 py-1.5 text-[12px] text-slate-600 shadow-lg backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Start with a thought, or select a node to extend it.
              </div>
            ) : null
          ) : null}
        </div>

        <div className="rounded-[20px] border border-white/70 bg-white/84 px-3 py-2.5 shadow-[0_18px_42px_rgba(0,0,0,0.14)] backdrop-blur-[18px]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {String(stage || "research-diverge").replace("-", " / ")}
            </div>
            {visibleSuggestedTypes.map((type) => (
              <TypeChip
                key={type}
                label={type}
                isActive={preferredType === type}
                onClick={setPreferredType}
              />
            ))}
          </div>

          {activeTypePrompt ? (
            <div className="mb-2 flex items-start gap-1.5 px-1 text-[11px] leading-[1.4] text-slate-500">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/90" />
              <span>{activeTypePrompt}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex">
            <div className="min-w-0 flex flex-1 items-end gap-2 rounded-[15px] border border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-sm">
              <div className="min-w-0 flex-1">
                {selectedNode ? (
                  <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    {selectedNodePromptText || "Add a related thought to this node"}
                  </div>
                ) : null}
                <div className="relative">
                  {showLoadingOverlay && text ? (
                    <div
                      className={`pointer-events-none absolute inset-0 whitespace-pre-wrap break-words pr-1 text-[15px] font-bold leading-[1.5] composer-loading-gradient-text transition-opacity duration-200 ${
                        isOverlayExiting ? "opacity-0" : "opacity-100"
                      }`}
                      aria-hidden="true"
                    >
                      {text}
                    </div>
                  ) : null}
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder={
                      selectedNode
                        ? TYPE_PLACEHOLDER_COPY[preferredType] || `Add a related ${preferredType ? preferredType.toLowerCase() : "thought"}...`
                        : TYPE_PLACEHOLDER_COPY[preferredType] || placeholderText || "Add a thought..."
                    }
                    className={`w-full resize-none border-none bg-transparent text-[15px] outline-none min-h-[48px] max-h-[180px] ${
                      showLoadingOverlay && text
                        ? "text-transparent caret-transparent placeholder:text-transparent"
                        : "text-slate-700 placeholder:text-slate-400"
                    }`}
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!text.trim() || isAnalyzing}
                className="translate-x-[4.5px] inline-flex h-[31.06px] w-[30.49px] shrink-0 items-center justify-center rounded-[8.08px] bg-[linear-gradient(142.46deg,_#7FD1DB_13.82%,_#788DBC_66.77%,_#586789_119.72%)] text-white shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send thought"
              >
                {isAnalyzing ? (
                  <Sparkles className="h-[16.94px] w-[16.38px] animate-spin" strokeWidth={0.830635} />
                ) : (
                  <Send className="h-[16.94px] w-[16.38px]" strokeWidth={0.830635} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
