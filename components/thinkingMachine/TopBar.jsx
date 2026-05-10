"use client";

import { useEffect, useState } from "react";
import TopBarProjectBreadcrumb from "@/components/thinkingMachine/layout/TopBarProjectBreadcrumb";

export default function TopBar({
  projectTitle = "Thinking Machine",
  onProjectTitleChange,
  projectMetaHref = "/projects",
  projectMetaLabel = "Project workspace",
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(projectTitle);

  useEffect(() => {
    setDraftTitle(projectTitle);
  }, [projectTitle]);

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
          setIsEditingTitle={setIsEditingTitle}
          commitTitle={commitTitle}
        />
      </div>
    </header>
  );
}
