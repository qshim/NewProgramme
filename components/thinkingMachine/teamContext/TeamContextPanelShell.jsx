"use client";

import { motion } from "framer-motion";

export default function TeamContextPanelShell({ membersCount = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -16, y: 8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute left-0 top-[52px] w-[348px]"
    >
      <div className="flex max-h-[calc(100vh-170px)] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[rgba(244,248,245,0.9)] p-3.5 shadow-[0_18px_36px_rgba(88,116,104,0.10)] backdrop-blur-[18px]">
        <div className="shrink-0 rounded-[22px] border border-white/75 bg-white/80 px-3.5 py-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Team context</div>
              <div className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Review teammate activity and ask the agent what likely changed in the project context.
              </div>
            </div>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {membersCount} members
            </div>
          </div>
        </div>

        {children}
      </div>
    </motion.div>
  );
}
