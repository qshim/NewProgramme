"use client";

import { Loader2 } from "lucide-react";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

function splitActionPrompt(content = "") {
  const text = String(content || "").trim();
  const match = text.match(/\b(To move forward[\s\S]*)$/i);
  if (!match?.index) return null;

  const context = text.slice(0, match.index).trim();
  const action = match[1].trim();
  if (!context || !action) return null;

  return { action, context };
}

function AssistantMessageContent({ content, shouldSplit = false }) {
  const split = shouldSplit ? splitActionPrompt(content) : null;
  if (!split) return content;
  const questionMatch = split.action.match(/(what specific[\s\S]*\?)$/i);
  const actionPrefix = questionMatch?.index > 0 ? split.action.slice(0, questionMatch.index) : "";
  const actionQuestion = questionMatch ? questionMatch[1] : "";

  return (
    <div className="space-y-3">
      <div className="text-[12px] font-medium leading-[1.55] text-slate-700">
        {questionMatch ? (
          <>
            {actionPrefix}
            <em className="font-medium text-slate-700">{actionQuestion}</em>
          </>
        ) : (
          split.action
        )}
      </div>
      <div className="border-t border-slate-200/60 pt-3 text-[12px] font-normal leading-[1.55] text-slate-400">
        {split.context}
      </div>
    </div>
  );
}

function getConvergenceLabel(level, uiLanguage) {
  const labels = {
    synthesize: {
      ko: "수렴 시작 · 핵심 정리",
      ja: "収束開始・要点整理",
      en: "Converging · Synthesis",
    },
    prioritize: {
      ko: "수렴 중 · 우선순위",
      ja: "収束中・優先順位",
      en: "Converging · Priorities",
    },
    conclude: {
      ko: "결론 제안",
      ja: "結論の提案",
      en: "Proposed conclusion",
    },
  };
  return labels[level]?.[uiLanguage] || labels[level]?.en || "";
}

export default function DrawerChatTranscript({
  chatMessages = [],
  isChatLoading = false,
  isChatConverting = false,
  conversionError = "",
  activeSuggestion,
  chatBottomRef,
  uiLanguage = "en",
}) {
  const workspaceCopy = getWorkspaceCopy(uiLanguage);
  const copy = workspaceCopy.chat;
  const sourceLabel = uiLanguage === "ko" ? "실시간 웹 출처" : uiLanguage === "ja" ? "ライブWebソース" : "Live web sources";
  const searchFallbackLabel = uiLanguage === "ko"
    ? "웹검색을 사용할 수 없어 기존 지식으로 답변했습니다."
    : uiLanguage === "ja"
      ? "Web検索を利用できなかったため、既存の知識で回答しました。"
      : "Web search was unavailable, so this reply used existing model knowledge.";
  return (
    <div className="flex flex-col gap-2">
      {chatMessages.length === 0 && !isChatLoading && activeSuggestion && (
        <div className="text-center text-xs text-slate-500">{copy.preparing}</div>
      )}
      {chatMessages.map((msg, index) => (
        <div
          key={`${msg.role}-${index}`}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-xs leading-relaxed shadow-[0_6px_14px_rgba(0,0,0,0.04)] ${
              msg.role === "user"
                ? "rounded-br-[8px] bg-[#7BA592] text-white"
                : "rounded-bl-[8px] border border-white/80 bg-white/78 text-slate-700"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="space-y-2.5">
                {msg.convergence?.active ? (
                  <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-2 py-1 text-[9px] font-bold tracking-[0.04em] text-teal-700">
                    {getConvergenceLabel(msg.convergence.level, uiLanguage)}
                  </div>
                ) : null}
                <AssistantMessageContent content={msg.localizedContent || msg.content} shouldSplit={index === 0} />
                {Array.isArray(msg.sources) && msg.sources.length ? (
                  <div className="border-t border-slate-200/70 pt-2">
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#678071]">{sourceLabel}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {msg.sources.slice(0, 6).map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-full truncate rounded-full border border-[#CFDDD4] bg-[#F4F8F5] px-2 py-1 text-[9px] font-medium text-[#577064] hover:bg-white"
                        >
                          {source.title || source.url}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                {msg.webSearchError ? (
                  <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-[9.5px] leading-relaxed text-amber-700">
                    {searchFallbackLabel}
                  </div>
                ) : null}
              </div>
            ) : (
              msg.localizedContent || msg.content
            )}
          </div>
        </div>
      ))}
      {isChatLoading && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-1.5 rounded-[14px] rounded-bl-[8px] border border-white/80 bg-white/78 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            <span className="text-xs text-slate-500">
              {isChatConverting ? workspaceCopy.drawer.creatingNodes : copy.thinking}
            </span>
          </div>
        </div>
      )}
      {conversionError ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-700">
          {conversionError}
        </div>
      ) : null}
      <div ref={chatBottomRef} />
    </div>
  );
}
