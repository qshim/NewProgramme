"use client";

import { useState } from "react";
import TopBarProjectBreadcrumb from "@/components/thinkingMachine/layout/TopBarProjectBreadcrumb";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

export default function TopBar({
  projectTitle = "Thinking Machine",
  onProjectTitleChange,
  projectMetaHref = "/projects",
  projectMetaLabel = "Project workspace",
  uiLanguage = "en",
}) {
  const copy = getWorkspaceCopy(uiLanguage).topBar;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(projectTitle);

  const commitTitle = () => {
    const nextTitle = draftTitle.trim() || "Untitled Project";
    setDraftTitle(nextTitle);
    onProjectTitleChange?.(nextTitle);
    setIsEditingTitle(false);
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] px-6 py-4">
      <div className="flex items-start justify-between">
        <TopBarProjectBreadcrumb
          projectMetaHref={projectMetaHref}
          projectMetaLabel={projectMetaLabel}
          isEditingTitle={isEditingTitle}
          projectTitle={projectTitle}
          draftTitle={draftTitle}
          setDraftTitle={setDraftTitle}
          setIsEditingTitle={(nextEditing) => {
            if (nextEditing) setDraftTitle(projectTitle);
            setIsEditingTitle(nextEditing);
          }}
          commitTitle={commitTitle}
          uiCopy={copy}
        />
      </div>
    </header>
  );
}
