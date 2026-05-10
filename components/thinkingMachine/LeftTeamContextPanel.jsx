"use client";

import { AnimatePresence } from "framer-motion";
import TeamTimelineCard from "@/components/thinkingMachine/cards/TeamTimelineCard";
import AgentContextSummaryCard from "@/components/thinkingMachine/cards/AgentContextSummaryCard";
import MeetingMemoryCard from "@/components/thinkingMachine/cards/MeetingMemoryCard";
import TeamContextPanelShell from "@/components/thinkingMachine/teamContext/TeamContextPanelShell";
import TeamContextMembersSection from "@/components/thinkingMachine/teamContext/TeamContextMembersSection";

export default function LeftTeamContextPanel({
  isOpen,
  teamMembers,
  activityItems,
  selectedMemberId,
  selectedActivityId,
  summary,
  isSummaryLoading,
  summaryError,
  meetingMemoryReadout,
  isMeetingMemoryLoading,
  currentUserId,
  onToggle,
  onSelectMember,
  onSelectActivity,
  onExplainContext,
  onFocusNode,
}) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const items = Array.isArray(activityItems) ? activityItems : [];

  return (
    <div className="pointer-events-none absolute left-5 top-[50px] z-[58]">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border text-slate-700 backdrop-blur-[16px] transition ${
            isOpen
              ? "border-[#D7E2DB] bg-white/94 shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
              : "border-white/85 bg-white/90 shadow-[0_10px_20px_rgba(15,23,42,0.09)] hover:bg-white"
          }`}
          aria-label={isOpen ? "Hide team context" : "Show team context"}
          title={isOpen ? "Hide team context" : "Show team context"}
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.46)_0%,rgba(236,243,239,0.16)_100%)]" />
          <span className="relative flex h-[17px] w-[17px] items-center justify-center text-[#41526D]">
            <span className="absolute inset-0 rounded-[4px] border-[1.7px] border-current" />
            <span className="absolute bottom-[2px] left-1/2 top-[2px] w-0 -translate-x-1/2 border-l-[1.7px] border-current" />
          </span>
        </button>

        <AnimatePresence>
          {isOpen ? (
            <TeamContextPanelShell membersCount={members.length}>
                <TeamContextMembersSection
                  members={members}
                  selectedMemberId={selectedMemberId}
                  currentUserId={currentUserId}
                  onSelectMember={onSelectMember}
                />
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  <div className="flex flex-col gap-3">
                    <div className="min-h-0 flex-1">
                      <TeamTimelineCard
                        items={items}
                        selectedActivityId={selectedActivityId}
                        onSelectActivity={onSelectActivity}
                      />
                    </div>

                    <AgentContextSummaryCard
                      summary={summary}
                      isLoading={isSummaryLoading}
                      error={summaryError}
                      onExplain={onExplainContext}
                      onFocusNode={onFocusNode}
                    />
                    <MeetingMemoryCard
                      readout={meetingMemoryReadout}
                      isLoading={isMeetingMemoryLoading}
                    />
                  </div>
                </div>
            </TeamContextPanelShell>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
