"use client";

import { Check } from "lucide-react";
import { getConfidenceMeta, getTypeMeta, normalizeNodeData } from "@/lib/thinkingMachine/nodeMeta";
import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

export default function CandidateGraphCard({ candidateGraph, onCommit, onCommitAsPrivate, onDiscard, candidateHint, uiLanguage = "en" }) {
  const copy = getWorkspaceCopy(uiLanguage).candidate;
  const candidateNodes = Array.isArray(candidateGraph?.nodes) ? candidateGraph.nodes : [];
  const candidateEdges = Array.isArray(candidateGraph?.edges) ? candidateGraph.edges : [];
  const isConceptCandidate = candidateGraph?.kind === "concept";
  if (!candidateNodes.length) return null;

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${isConceptCandidate ? "border-[#C9DCCF] bg-[#EFF7F2]/95" : "border-amber-200 bg-amber-50/90"}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${isConceptCandidate ? "text-[#53715F]" : "text-amber-700"}`}>
            {isConceptCandidate ? "CANVAS DRAFT" : copy.title}
          </div>
          <div className={`mt-1 text-[11px] ${isConceptCandidate ? "text-[#687A6F]" : "text-amber-800/80"}`}>
            {isConceptCandidate
              ? uiLanguage === "ko" ? "대화 결과를 저장하기 전에 캔버스에서 구조를 확인하세요." : uiLanguage === "ja" ? "対話結果を保存する前に、キャンバスで構造を確認してください。" : "Review the branch structure on canvas before saving it."
              : candidateHint || copy.defaultHint}
          </div>
        </div>
        <MetaPill className={isConceptCandidate ? "bg-white text-[#53715F]" : "bg-white text-amber-700"}>{candidateNodes.length} {copy.nodes}</MetaPill>
      </div>

      {!isConceptCandidate ? <div className="mt-3 flex flex-col gap-2">
        {candidateNodes.map((node) => {
          const data = normalizeNodeData(node.data || {});
          const typeMeta = getTypeMeta(data.category);
          const confidenceMeta = getConfidenceMeta(data.confidence);
          return (
            <div key={node.id} className="rounded-xl border border-amber-200/80 bg-white/85 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <MetaPill className={`${typeMeta.tint} ${typeMeta.text}`}>{data.category}</MetaPill>
                <MetaPill className="bg-amber-100 text-amber-700">{copy.candidate}</MetaPill>
                <MetaPill className={confidenceMeta.className}>{confidenceMeta.label}</MetaPill>
              </div>
              <div className="mt-1 text-[12px] font-semibold text-slate-800">
                {node.data?.localizedTitle || node.data?.title || copy.untitled}
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {node.data?.localizedContent || node.data?.content || copy.noContent}
              </div>
            </div>
          );
        })}
      </div> : null}

      {candidateEdges.length && !isConceptCandidate ? (
        <div className="mt-3 rounded-xl border border-white/70 bg-white/70 px-2.5 py-2 text-[11px] text-slate-600">
          {copy.relations}: {candidateEdges.map((edge) => String(edge.label).replace(/_/g, " ")).join(", ")}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCommitAsPrivate}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
        >
          {copy.keepPrivate}
        </button>
        <button
          type="button"
          onClick={onCommit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-600"
        >
          <Check className="h-3.5 w-3.5" />
          {copy.add}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center justify-center rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
        >
          {copy.discard}
        </button>
      </div>
    </div>
  );
}
