"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { listAiModelProfiles, normalizeAiModelProfile } from "@/lib/ai/modelRegistry";

const COPY = {
  en: {
    label: "Reasoning model",
    auto: "Routes each task to the appropriate model.",
    deep: "Prioritizes depth for synthesis and alignment.",
    fast: "Prioritizes speed for early drafts and exploration.",
  },
  ko: {
    label: "Reasoning 모델",
    auto: "작업에 맞는 모델을 자동으로 선택합니다.",
    deep: "종합과 정렬 작업에서 사고 깊이를 우선합니다.",
    fast: "초기 초안과 탐색 작업에서 속도를 우선합니다.",
  },
  ja: {
    label: "Reasoningモデル",
    auto: "タスクに適したモデルを自動で選択します。",
    deep: "統合と整合の作業で思考の深さを優先します。",
    fast: "初期ドラフトと探索で速度を優先します。",
  },
};

export default function ModelProfileControl({
  value = "auto",
  onChange,
  uiLanguage = "en",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const profiles = listAiModelProfiles();
  const normalizedValue = normalizeAiModelProfile(value);
  const activeProfile = profiles.find((profile) => profile.id === normalizedValue) || profiles[0];
  const copy = COPY[uiLanguage] || COPY.en;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={disabled}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/80 bg-white/68 px-2.5 text-[10px] font-semibold text-[#607169] shadow-[0_5px_12px_rgba(41,57,48,0.05)] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-45"
        aria-expanded={isOpen}
        aria-label={copy.label}
      >
        <Sparkles className="h-3.5 w-3.5 text-[#7BA592]" strokeWidth={1.8} />
        {activeProfile.label}
        <ChevronDown className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen ? (
        <div className="absolute bottom-10 right-0 z-[100] w-[258px] rounded-[18px] border border-[#DDE5E0] bg-white/96 p-2 shadow-[0_18px_48px_rgba(36,52,43,0.13)] backdrop-blur-xl">
          <div className="px-2 pb-2 pt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#929E97]">
            {copy.label}
          </div>
          {profiles.map((profile) => {
            const isActive = profile.id === normalizedValue;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  onChange?.(profile.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-start gap-2 rounded-[13px] px-2.5 py-2.5 text-left transition ${
                  isActive ? "bg-[#EEF4F0]" : "hover:bg-[#F6F8F7]"
                }`}
              >
                <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#C9D6CE] bg-white">
                  {isActive ? <Check className="h-2.5 w-2.5 text-[#567665]" strokeWidth={2.4} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-[#334139]">{profile.label}</span>
                    <span className="text-[9px] font-medium text-[#98A29D]">{profile.modelLabel}</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-[1.4] text-[#78847D]">
                    {copy[profile.id]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
