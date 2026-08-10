"use client";

import { ArrowRight, CircleHelp, X } from "lucide-react";

const COPY = {
  en: {
    eyebrow: "Input guidance",
    expected: "What to provide",
    tryOne: "Try one of these",
    usePrompt: "Use prompt",
    dismiss: "Dismiss input guidance",
  },
  ko: {
    eyebrow: "입력 안내",
    expected: "필요한 입력",
    tryOne: "이렇게 다시 입력해 보세요",
    usePrompt: "사용하기",
    dismiss: "입력 안내 닫기",
  },
  ja: {
    eyebrow: "入力ガイド",
    expected: "必要な入力",
    tryOne: "次のように入力してみてください",
    usePrompt: "使用する",
    dismiss: "入力ガイドを閉じる",
  },
};

export default function InputGuidanceCard({ guidance, uiLanguage = "en", onUsePrompt, onDismiss }) {
  if (!guidance) return null;
  const copy = COPY[uiLanguage] || COPY.en;
  const suggestedPrompts = Array.isArray(guidance.suggestedPrompts) ? guidance.suggestedPrompts : [];

  return (
    <div className="rounded-2xl border border-amber-200/75 bg-amber-50/75 p-3 shadow-[0_8px_20px_rgba(120,86,28,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700/75">
            <CircleHelp className="h-3.5 w-3.5" />
            {copy.eyebrow}
          </div>
          <h2 className="mt-1.5 text-[14px] font-semibold leading-tight text-slate-800">{guidance.title}</h2>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200/80 bg-white/70 text-slate-400 transition hover:bg-white hover:text-slate-600"
            aria-label={copy.dismiss}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{guidance.message}</p>

      {guidance.expectedInput ? (
        <div className="mt-3 rounded-xl border border-white/80 bg-white/68 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{copy.expected}</div>
          <div className="mt-1 text-[12px] leading-relaxed text-slate-700">{guidance.expectedInput}</div>
        </div>
      ) : null}

      {suggestedPrompts.length ? (
        <div className="mt-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{copy.tryOne}</div>
          <div className="mt-2 flex flex-col gap-1.5">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onUsePrompt?.(prompt)}
                className="group flex items-center justify-between gap-3 rounded-xl border border-amber-200/70 bg-white/78 px-3 py-2 text-left text-[11px] leading-relaxed text-slate-600 transition hover:border-amber-300 hover:bg-white"
              >
                <span>{prompt}</span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-amber-700/70 group-hover:text-amber-800">
                  {copy.usePrompt}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
