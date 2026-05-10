"use client";

import ActorGlyph from "@/components/thinkingMachine/teamContext/ActorGlyph";

function MemberButton({ member, isActive, isCurrentUser, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition ${
        isActive
          ? "border-teal-300 bg-[linear-gradient(180deg,rgba(240,253,250,0.98)_0%,rgba(255,255,255,0.94)_100%)] shadow-[0_10px_24px_rgba(45,212,191,0.12)]"
          : "border-slate-200/80 bg-white/92 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <ActorGlyph actor={member} size="md" />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[12px] font-semibold text-slate-800">
          {member?.name || "Unknown teammate"}
          {isCurrentUser ? " (You)" : ""}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-400">{member?.role || "editor"}</div>
      </div>
    </button>
  );
}

export default function TeamContextMembersSection({
  members = [],
  selectedMemberId,
  currentUserId,
  onSelectMember,
}) {
  return (
    <div className="mt-3 shrink-0 rounded-[22px] border border-white/75 bg-white/82 p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Members</div>
        <button
          type="button"
          onClick={() => onSelectMember?.(null)}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
        >
          All
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {members.length ? (
          members.map((member) => (
            <MemberButton
              key={member.id}
              member={member}
              isActive={member.id === selectedMemberId}
              isCurrentUser={member.id === currentUserId}
              onClick={() => onSelectMember?.(member.id)}
            />
          ))
        ) : (
          <div className="rounded-xl bg-slate-50/90 px-3 py-2 text-[11px] text-slate-400">No teammates registered yet.</div>
        )}
      </div>
    </div>
  );
}
