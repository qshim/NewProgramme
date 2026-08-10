"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CircleAlert,
  Eye,
  Network,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import ActorGlyph from "@/components/thinkingMachine/teamContext/ActorGlyph";
import { normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";

const COPY = {
  en: {
    eyebrow: "ADMIN VIEW",
    title: "Project overview",
    description: "Monitor participation, reasoning progress, and decision risk across the project.",
    close: "Close admin view",
    members: "Members",
    nodes: "Reasoning nodes",
    teamVisible: "Team-visible",
    unresolved: "Unresolved",
    contributors: "Contributors",
    contributorDescription: "Private work is aggregated as counts. Raw content is not exposed here.",
    noContributors: "No contributor data yet.",
    recentActivity: "Recent activity",
    noActivity: "No recorded project activity yet.",
    aiBriefing: "AI briefing",
    briefingDescription: "Summarize the saved reasoning trail, risks, and best next management move.",
    generate: "Generate brief",
    refresh: "Refresh brief",
    reading: "Reading project",
    emptyBrief: "Generate a project-level briefing from the current nodes and activity.",
    direction: "Current direction",
    nextMove: "Best next move",
    openQuestions: "Open questions",
    privacyTitle: "Conversation visibility",
    privacyBody: "Raw AI chat transcripts are not stored as admin-readable records yet. This view summarizes saved node and activity events only.",
    private: "private",
    shared: "team",
    actions: "actions",
    you: "You",
  },
  ko: {
    eyebrow: "ADMIN VIEW",
    title: "프로젝트 전체 보기",
    description: "프로젝트 전반의 참여, 사고 진행 상태와 의사결정 위험을 확인합니다.",
    close: "Admin view 닫기",
    members: "참여자",
    nodes: "Reasoning 노드",
    teamVisible: "팀 공개",
    unresolved: "미해결",
    contributors: "사용자별 기여",
    contributorDescription: "개인 작업은 개수로만 집계하며 원문은 이 화면에 노출하지 않습니다.",
    noContributors: "아직 참여 데이터가 없습니다.",
    recentActivity: "최근 활동",
    noActivity: "아직 기록된 프로젝트 활동이 없습니다.",
    aiBriefing: "AI 브리핑",
    briefingDescription: "저장된 reasoning 흐름, 위험과 다음 관리 액션을 요약합니다.",
    generate: "브리핑 생성",
    refresh: "브리핑 갱신",
    reading: "프로젝트 분석 중",
    emptyBrief: "현재 노드와 활동을 바탕으로 프로젝트 전체 브리핑을 생성합니다.",
    direction: "현재 방향",
    nextMove: "추천 다음 액션",
    openQuestions: "열린 질문",
    privacyTitle: "대화 공개 범위",
    privacyBody: "AI 대화 원문은 아직 관리자 열람 기록으로 저장하지 않습니다. 현재 화면은 저장된 노드와 활동 이벤트만 요약합니다.",
    private: "개인",
    shared: "팀",
    actions: "활동",
    you: "나",
  },
  ja: {
    eyebrow: "ADMIN VIEW",
    title: "プロジェクト全体ビュー",
    description: "プロジェクト全体の参加状況、思考の進捗、意思決定リスクを確認します。",
    close: "Admin viewを閉じる",
    members: "メンバー",
    nodes: "Reasoningノード",
    teamVisible: "チーム公開",
    unresolved: "未解決",
    contributors: "メンバー別の貢献",
    contributorDescription: "個人作業は件数のみ集計し、原文は表示しません。",
    noContributors: "貢献データはまだありません。",
    recentActivity: "最近のアクティビティ",
    noActivity: "記録されたプロジェクト活動はまだありません。",
    aiBriefing: "AIブリーフィング",
    briefingDescription: "保存された思考の流れ、リスク、次の管理アクションを要約します。",
    generate: "ブリーフを生成",
    refresh: "ブリーフを更新",
    reading: "プロジェクトを分析中",
    emptyBrief: "現在のノードと活動からプロジェクト全体のブリーフを生成します。",
    direction: "現在の方向",
    nextMove: "推奨する次の一手",
    openQuestions: "未解決の質問",
    privacyTitle: "会話の公開範囲",
    privacyBody: "AIチャットの原文は管理者向け記録としてまだ保存していません。この画面では保存済みのノードと活動イベントのみを要約します。",
    private: "個人",
    shared: "チーム",
    actions: "活動",
    you: "自分",
  },
};

const TEAM_VISIBILITY = new Set(["shared", "reviewed", "agreed"]);

function formatActivityType(value) {
  return String(value || "activity").replace(/^node_/, "").replace(/_/g, " ");
}

function formatTimestamp(value, uiLanguage) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "";
  const locale = uiLanguage === "ko" ? "ko-KR" : uiLanguage === "ja" ? "ja-JP" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildContributorMetrics(nodes, activityLog, teamMembers) {
  const metrics = new Map();
  const ensure = (id, fallback = {}) => {
    const safeId = String(id || "unknown-user");
    if (!metrics.has(safeId)) {
      metrics.set(safeId, {
        id: safeId,
        name: fallback.name || fallback.userName || safeId,
        role: fallback.role || fallback.userRole || "contributor",
        nodeCount: 0,
        privateCount: 0,
        teamCount: 0,
        activityCount: 0,
        lastActivityAt: fallback.lastSeenAt || "",
      });
    }
    return metrics.get(safeId);
  };

  (Array.isArray(teamMembers) ? teamMembers : []).forEach((member) => ensure(member?.id, member));
  (Array.isArray(nodes) ? nodes : []).forEach((node) => {
    if (node?.type !== "thinkingNode") return;
    const metric = ensure(node?.data?.ownerId, { name: node?.data?.editedBy || "Unknown teammate" });
    const visibility = normalizeVisibility(node?.data?.visibility);
    metric.nodeCount += 1;
    if (TEAM_VISIBILITY.has(visibility)) metric.teamCount += 1;
    else metric.privateCount += 1;
  });
  (Array.isArray(activityLog) ? activityLog : []).forEach((item) => {
    const metric = ensure(item?.userId, item);
    metric.activityCount += 1;
    if (!metric.lastActivityAt || new Date(item?.timestamp || 0) > new Date(metric.lastActivityAt || 0)) {
      metric.lastActivityAt = item?.timestamp || metric.lastActivityAt;
    }
  });

  return Array.from(metrics.values()).sort((a, b) => {
    const contributionDelta = b.nodeCount + b.activityCount - (a.nodeCount + a.activityCount);
    return contributionDelta || a.name.localeCompare(b.name);
  });
}

function MetricCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-[20px] border border-[#E3E8E3] bg-white/86 px-4 py-3.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#778079]">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-[24px] font-semibold tracking-[-0.04em] text-[#26332C]">{value}</div>
    </div>
  );
}

export default function AdminOverviewPanel({
  projectTitle,
  nodes,
  activityLog,
  teamMembers,
  alignmentCounts,
  currentUserId,
  summary,
  isSummaryLoading,
  summaryError,
  onGenerateSummary,
  onClose,
  uiLanguage = "en",
}) {
  const copy = COPY[uiLanguage] || COPY.en;
  const thinkingNodes = useMemo(
    () => (Array.isArray(nodes) ? nodes : []).filter((node) => node?.type === "thinkingNode"),
    [nodes]
  );
  const contributors = useMemo(
    () => buildContributorMetrics(thinkingNodes, activityLog, teamMembers),
    [activityLog, teamMembers, thinkingNodes]
  );
  const recentActivity = (Array.isArray(activityLog) ? activityLog : []).slice(0, 8);
  const teamVisibleCount = thinkingNodes.filter((node) => TEAM_VISIBILITY.has(normalizeVisibility(node?.data?.visibility))).length;
  const unresolvedCount = Number(alignmentCounts?.unresolved || 0);
  const openQuestions = Array.isArray(summary?.openQuestions) ? summary.openQuestions : [];

  return (
    <motion.section
      className="absolute bottom-5 left-5 right-5 top-[66px] z-[46] overflow-hidden rounded-[30px] border border-[#DDE5DF] bg-[#F7F8F5]/96 shadow-[0_20px_70px_rgba(49,66,57,0.12)] backdrop-blur-[20px]"
      initial={{ opacity: 0, y: 12, scale: 0.992 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.994 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      aria-label={copy.title}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-start justify-between gap-6 border-b border-[#E1E7E2] px-7 py-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-[#718078]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </div>
            <h2 className="mt-1.5 text-[24px] font-semibold tracking-[-0.035em] text-[#233129]">{copy.title}</h2>
            <p className="mt-1 text-[12px] text-[#748078]">{copy.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="max-w-[320px] truncate rounded-full border border-[#E1E6E1] bg-white/80 px-3 py-1.5 text-[10px] font-semibold text-[#66736B]">
              {projectTitle}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E0E5E0] bg-white text-[#647168] transition hover:bg-[#F0F3F0]"
              aria-label={copy.close}
              title={copy.close}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5" style={{ scrollbarWidth: "thin" }}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MetricCard icon={Users} label={copy.members} value={contributors.length} tone="bg-[#ECF3EE] text-[#587264]" />
            <MetricCard icon={Network} label={copy.nodes} value={thinkingNodes.length} tone="bg-[#EEF2F7] text-[#5F6F83]" />
            <MetricCard icon={Eye} label={copy.teamVisible} value={teamVisibleCount} tone="bg-[#E8F6EF] text-[#47745E]" />
            <MetricCard icon={CircleAlert} label={copy.unresolved} value={unresolvedCount} tone="bg-[#FBEAF2] text-[#A33D68]" />
          </div>

          <div className="mt-4 grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
            <div className="space-y-4">
              <section className="rounded-[24px] border border-[#E1E7E2] bg-white/78 p-[18px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[13px] font-semibold text-[#2D3A32]">{copy.contributors}</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#7B857F]">{copy.contributorDescription}</p>
                  </div>
                  <Users className="h-4 w-4 text-[#8A958E]" aria-hidden="true" />
                </div>
                {contributors.length ? (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                    {contributors.map((member) => (
                      <div key={member.id} className="rounded-[18px] border border-[#E5E9E5] bg-[#FAFBF9] px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ActorGlyph actor={member} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-[#344239]">
                              {member.name}{member.id === currentUserId ? ` · ${copy.you}` : ""}
                            </div>
                            <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-[#929A94]">{member.role}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-semibold text-[#69756D]">
                          <span className="rounded-full bg-[#F0F2F0] px-2 py-1">{member.privateCount} {copy.private}</span>
                          <span className="rounded-full bg-[#E7F4EC] px-2 py-1 text-[#557765]">{member.teamCount} {copy.shared}</span>
                          <span className="rounded-full bg-[#EEF1F5] px-2 py-1">{member.activityCount} {copy.actions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[16px] bg-[#F5F7F5] px-3 py-3 text-[11px] text-[#8A938D]">{copy.noContributors}</div>
                )}
              </section>

              <section className="rounded-[24px] border border-[#E1E7E2] bg-white/78 p-[18px]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[13px] font-semibold text-[#2D3A32]">{copy.recentActivity}</h3>
                  <Activity className="h-4 w-4 text-[#8A958E]" aria-hidden="true" />
                </div>
                {recentActivity.length ? (
                  <div className="mt-3 divide-y divide-[#E8ECE8]">
                    {recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                        <ActorGlyph actor={item} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-[11px] font-semibold text-[#46534B]">
                              {item.userName || item.userId || "Unknown teammate"}
                            </span>
                            <span className="shrink-0 text-[9px] text-[#9AA19C]">{formatTimestamp(item.timestamp, uiLanguage)}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#778179]">
                            <span className="capitalize">{formatActivityType(item.type)}</span>
                            {item.nodeTitle ? ` · ${item.nodeTitle}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[16px] bg-[#F5F7F5] px-3 py-3 text-[11px] text-[#8A938D]">{copy.noActivity}</div>
                )}
              </section>
            </div>

            <div className="space-y-4">
              <section className="rounded-[24px] border border-[#DCE7DF] bg-[linear-gradient(155deg,rgba(240,248,242,0.98),rgba(255,255,255,0.92))] p-[18px]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#314238]">
                      <Sparkles className="h-4 w-4 text-[#6E8E7A]" aria-hidden="true" />
                      {copy.aiBriefing}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[#77847B]">{copy.briefingDescription}</p>
                  </div>
                  <button
                    type="button"
                    onClick={onGenerateSummary}
                    disabled={isSummaryLoading}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#718F7D] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#617F6D] disabled:opacity-55"
                  >
                    <RefreshCcw className={`h-3 w-3 ${isSummaryLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                    {isSummaryLoading ? copy.reading : summary ? copy.refresh : copy.generate}
                  </button>
                </div>

                {summary ? (
                  <div className="mt-4 space-y-2.5">
                    <div className="rounded-[17px] bg-white/82 px-3.5 py-3">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#909A93]">{copy.direction}</div>
                      <div className="mt-1 text-[11px] font-semibold leading-relaxed text-[#344239]">{summary.likelyIntent}</div>
                    </div>
                    <div className="rounded-[17px] border border-white/90 bg-white/68 px-3.5 py-3 text-[11px] leading-relaxed text-[#5E6C63]">
                      {summary.summary}
                    </div>
                    <div className="rounded-[17px] bg-[#E9F2EC] px-3.5 py-3">
                      <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#789083]">{copy.nextMove}</div>
                      <div className="mt-1 text-[11px] font-semibold leading-relaxed text-[#3E584A]">{summary.suggestedFocus}</div>
                    </div>
                    {openQuestions.length ? (
                      <div className="rounded-[17px] bg-white/72 px-3.5 py-3">
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#909A93]">{copy.openQuestions}</div>
                        <div className="mt-2 space-y-1.5">
                          {openQuestions.slice(0, 3).map((question) => (
                            <div key={question} className="text-[10px] leading-relaxed text-[#68736C]">• {question}</div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[17px] border border-dashed border-[#D5E0D8] bg-white/48 px-4 py-5 text-[11px] leading-relaxed text-[#7F8B83]">
                    {copy.emptyBrief}
                  </div>
                )}
                {summaryError ? <div className="mt-3 text-[10px] text-[#A34762]">{summaryError}</div> : null}
              </section>

              <section className="rounded-[22px] border border-[#E1E5E2] bg-[#F0F2F0] px-4 py-3.5">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#59675F]">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.privacyTitle}
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-[#7A847D]">{copy.privacyBody}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
