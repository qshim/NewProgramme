"use client";

import { ArrowRight, CheckCircle2, Compass, GitCompareArrows, RotateCcw, Sparkles } from "lucide-react";

const COPY = {
  en: {
    eyebrow: "DESIGN DIALOGUE",
    title: "Concept Studio",
    description: "Develop distinct directions through dialogue, then add the strongest reasoning branches to the canvas.",
    starterTitle: "What direction are you trying to sharpen?",
    starters: [
      "Frame three distinct concept directions from the current canvas.",
      "Challenge the strongest direction and expose its trade-offs.",
      "Turn the selected node into a clearer design territory.",
    ],
    recommended: "Recommended",
    principles: "Principles",
    cues: "Experience cues",
    tradeoff: "Trade-off",
    evidence: "Evidence needed",
    question: "Best next question",
    preview: "Draft branches are previewing on the canvas. Apply only when the structure is useful.",
    reset: "New dialogue",
    thinking: "Developing distinct territories...",
    sources: "Live web sources",
    searchFallback: "Live web research was unavailable for this turn.",
  },
  ko: {
    eyebrow: "DESIGN DIALOGUE",
    title: "Concept Studio",
    description: "대화로 서로 다른 방향을 고도화한 뒤, 유효한 reasoning branch만 캔버스에 추가합니다.",
    starterTitle: "어떤 방향을 더 선명하게 만들고 있나요?",
    starters: [
      "현재 캔버스를 바탕으로 서로 다른 컨셉 방향 3개를 제안해 주세요.",
      "가장 강한 방향을 비판적으로 검토하고 트레이드오프를 보여주세요.",
      "선택한 노드를 더 명확한 디자인 방향으로 발전시켜 주세요.",
    ],
    recommended: "Recommended",
    principles: "Principles",
    cues: "Experience cues",
    tradeoff: "Trade-off",
    evidence: "Evidence needed",
    question: "Best next question",
    preview: "후보 브랜치가 캔버스에 미리 보입니다. 구조가 유효할 때만 적용하세요.",
    reset: "New dialogue",
    thinking: "서로 다른 방향을 구성하고 있습니다...",
    sources: "실시간 웹 출처",
    searchFallback: "이번 응답에서는 실시간 웹검색을 사용할 수 없었습니다.",
  },
  ja: {
    eyebrow: "DESIGN DIALOGUE",
    title: "Concept Studio",
    description: "対話で異なる方向性を磨き、有効なreasoning branchだけをキャンバスに追加します。",
    starterTitle: "どの方向性をより明確にしたいですか？",
    starters: [
      "現在のキャンバスから異なるコンセプト方向を3つ提案してください。",
      "最も強い方向性を批判的に検討し、トレードオフを示してください。",
      "選択したノードをより明確なデザイン方向へ発展させてください。",
    ],
    recommended: "Recommended",
    principles: "Principles",
    cues: "Experience cues",
    tradeoff: "Trade-off",
    evidence: "Evidence needed",
    question: "Best next question",
    preview: "候補ブランチをキャンバスにプレビューしています。構造が有効な場合のみ適用してください。",
    reset: "New dialogue",
    thinking: "異なる方向性を構成しています...",
    sources: "ライブWebソース",
    searchFallback: "この回答ではライブWeb検索を利用できませんでした。",
  },
};

function DirectionCard({ direction, recommended, copy, index }) {
  return (
    <details
      className="group rounded-[16px] border border-[#DCE7DF] bg-white/88 shadow-[0_8px_22px_rgba(60,86,70,0.045)]"
    >
      <summary className="cursor-pointer list-none px-3 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E7F1EA] text-[10px] font-bold text-[#557461]">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-heading text-[13px] font-semibold leading-[1.2] text-[#1C2B24]">{direction.name}</h4>
              {recommended ? (
                <span className="rounded-full bg-[#DDF2E6] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#49725D]">
                  {copy.recommended}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] leading-[1.45] text-[#637267]">{direction.promise}</p>
          </div>
          <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#8A998F] transition group-open:rotate-90" />
        </div>
      </summary>
      <div className="border-t border-[#E8EFEA] px-3 pb-3 pt-2.5 text-[10.5px] leading-[1.5] text-[#647168]">
        <p>{direction.rationale}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#F5F8F5] p-2">
            <div className="font-semibold text-[#405448]">{copy.principles}</div>
            <ul className="mt-1 space-y-0.5">
              {direction.principles.map((item) => <li key={item}>· {item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl bg-[#F5F8F5] p-2">
            <div className="font-semibold text-[#405448]">{copy.cues}</div>
            <ul className="mt-1 space-y-0.5">
              {direction.experienceCues.map((item) => <li key={item}>· {item}</li>)}
            </ul>
          </div>
        </div>
        <div className="mt-2 rounded-xl bg-[#FFF6F2] p-2 text-[#785C52]"><strong>{copy.tradeoff}:</strong> {direction.tradeoff}</div>
        <div className="mt-1.5 rounded-xl bg-[#F7F1F5] p-2 text-[#725B69]"><strong>{copy.evidence}:</strong> {direction.evidenceNeeded}</div>
      </div>
    </details>
  );
}

export default function ConceptStudioPanel({ messages, isLoading, error, onSubmit, onReset, uiLanguage = "en" }) {
  const copy = COPY[uiLanguage] || COPY.en;
  const assistantMessages = messages.filter((message) => message.role === "assistant" && message.conceptResult);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="mb-3 flex items-start justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.17em] text-[#6A8274]">
            <Compass className="h-3.5 w-3.5" /> {copy.eyebrow}
          </div>
          <h2 className="mt-1 font-heading text-[18px] font-semibold tracking-[-0.02em] text-[#1E2B24]">{copy.title}</h2>
          <p className="mt-1 max-w-[295px] text-[10.5px] leading-[1.45] text-[#718077]">{copy.description}</p>
        </div>
        {messages.length ? (
          <button type="button" onClick={onReset} className="inline-flex h-7 items-center gap-1 rounded-full border border-[#DAE4DD] bg-white/75 px-2 text-[9px] font-semibold text-[#66776D] hover:bg-white">
            <RotateCcw className="h-3 w-3" /> {copy.reset}
          </button>
        ) : null}
      </header>

      {!messages.length ? (
        <div className="rounded-[18px] border border-[#DCE8E0] bg-white/72 p-3">
          <h3 className="text-[12px] font-semibold text-[#26372E]">{copy.starterTitle}</h3>
          <div className="mt-2 space-y-1.5">
            {copy.starters.map((starter, index) => (
              <button key={starter} type="button" onClick={() => onSubmit?.(starter)} className="group flex w-full items-center gap-2 rounded-xl border border-transparent bg-[#F4F8F5] px-2.5 py-2 text-left text-[10.5px] leading-[1.35] text-[#59695F] transition hover:border-[#C9DDD0] hover:bg-white">
                {index === 0 ? <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#6C927D]" /> : <GitCompareArrows className="h-3.5 w-3.5 shrink-0 text-[#7D8E84]" />}
                <span className="flex-1">{starter}</span>
                <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {messages.map((message, messageIndex) => {
          if (message.role === "user") {
            return <div key={`${message.role}-${messageIndex}`} className="ml-8 rounded-[15px] bg-[#EAF2ED] px-3 py-2.5 text-[11px] leading-[1.45] text-[#405148]">{message.content}</div>;
          }
          const result = message.conceptResult;
          if (!result) return null;
          const recommendedIds = new Set(result.recommendedDirectionIds || []);
          return (
            <article key={`${message.role}-${messageIndex}`} className="space-y-2.5">
              <p className="px-1 text-[11px] leading-[1.5] text-[#58685E]">{message.content}</p>
              {Array.isArray(result.webResearch?.sources) && result.webResearch.sources.length ? (
                <div className="rounded-[14px] border border-[#D8E5DC] bg-white/72 px-3 py-2.5">
                  <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#688071]">{copy.sources}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {result.webResearch.sources.slice(0, 6).map((source) => (
                      <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-full border border-[#CFDDD4] bg-[#F4F8F5] px-2 py-1 text-[9px] font-medium text-[#557064] hover:bg-white">
                        {source.title || source.url}
                      </a>
                    ))}
                  </div>
                </div>
              ) : result.webResearch?.error ? (
                <div className="rounded-[12px] bg-amber-50 px-2.5 py-2 text-[9.5px] leading-relaxed text-amber-700">{copy.searchFallback}</div>
              ) : null}
              <div className="space-y-2">
                {result.directions.map((direction, index) => (
                  <DirectionCard key={direction.id} direction={direction} recommended={recommendedIds.has(direction.id)} copy={copy} index={index} />
                ))}
              </div>
              <div className="rounded-[15px] border border-[#D7E6DC] bg-[#F5FAF6] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#688071]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {copy.question}
                </div>
                <p className="mt-1.5 text-[11px] font-medium leading-[1.45] text-[#33443A]">{result.question}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.quickActions.map((action) => (
                  <button key={action.id} type="button" onClick={() => onSubmit?.(action.prompt)} disabled={isLoading} className="rounded-full border border-[#CADBD0] bg-white/80 px-2.5 py-1.5 text-[9.5px] font-semibold text-[#557064] transition hover:bg-[#EDF6F0] disabled:opacity-50">
                    {action.label}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {isLoading ? <div className="mt-3 rounded-[14px] bg-white/65 px-3 py-2.5 text-[10.5px] text-[#6C7E73]">{copy.thinking}</div> : null}
      {error ? <div className="mt-3 rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10.5px] leading-[1.45] text-rose-700">{error}</div> : null}
      {assistantMessages.length ? <div className="mt-3 rounded-[14px] border border-dashed border-[#BFD5C7] bg-[#EFF7F2]/80 px-3 py-2 text-[9.5px] leading-[1.4] text-[#65786C]">{copy.preview}</div> : null}
    </section>
  );
}
