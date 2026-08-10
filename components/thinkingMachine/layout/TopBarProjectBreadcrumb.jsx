"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const TOPBAR_CENTER_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "110%",
  letterSpacing: "-0.32px",
};

export default function TopBarProjectBreadcrumb({
  projectMetaHref,
  projectMetaLabel,
  isEditingTitle,
  projectTitle,
  draftTitle,
  setDraftTitle,
  setIsEditingTitle,
  commitTitle,
  uiCopy = {},
}) {
  return (
    <div className="pointer-events-auto flex max-w-[calc(100vw-48px)] justify-self-start pt-0.5">
      <motion.div
        layout
        className="flex max-w-full flex-wrap items-baseline gap-2 text-[14px] font-medium text-slate-700/88"
        style={TOPBAR_CENTER_TEXT_STYLE}
        transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
      >
        <Link
          href={projectMetaHref}
          className="inline-flex shrink-0 transition hover:text-slate-900"
          style={TOPBAR_CENTER_TEXT_STYLE}
        >
          {projectMetaLabel}
        </Link>
        <span className="text-slate-400/80">/</span>
        <div className="min-w-0 max-w-full">
          {isEditingTitle ? (
            <motion.input
              layout="position"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTitle();
                }
                if (event.key === "Escape") {
                  setDraftTitle(projectTitle || "Untitled Project");
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="w-full border-none bg-transparent px-0 py-0 text-[14px] font-medium text-slate-800 outline-none shadow-none"
              style={TOPBAR_CENTER_TEXT_STYLE}
              aria-label={uiCopy.projectTitle || "Project title"}
              transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
            />
          ) : (
            <motion.button
              layout="position"
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="max-w-full break-words text-left text-[14px] font-medium text-slate-700/88 transition hover:text-slate-900"
              style={TOPBAR_CENTER_TEXT_STYLE}
              aria-label={uiCopy.editProjectTitle || "Edit project title"}
              title={uiCopy.renameProject || "Rename project"}
              transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
            >
              {projectTitle || "Untitled Project"}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
