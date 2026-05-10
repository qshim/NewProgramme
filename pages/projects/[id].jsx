import { useRouter } from "next/router";
import { startTransition, useEffect, useState } from "react";
import ThinkingMachine from "@/components/thinkingMachine/ThinkingMachine";
import { fetchProject, joinProject } from "@/lib/thinkingMachine/apiClient";
import { readCurrentUser } from "@/lib/thinkingMachine/clientUser";

const LOGIN_STORAGE_KEY = "isLoggedIn";

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const isLoggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";
    if (!isLoggedIn) {
      void router.replace("/");
      return;
    }

    const run = async () => {
      try {
        const nextCurrentUser = readCurrentUser();
        const matchedProject = await fetchProject(id);

        if (!matchedProject) {
          void router.replace("/projects");
          return;
        }

        startTransition(() => {
          setProject(matchedProject);
          setCurrentUser(nextCurrentUser);
          setIsLoading(false);
        });
      } catch {
        void router.replace("/projects");
      }
    };
    void run();
  }, [id, router, router.isReady]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EFEFEF] text-slate-900">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading workspace...
        </div>
      </main>
    );
  }

  const isCurrentMember = Array.isArray(project?.members)
    ? project.members.some((member) => member?.id === currentUser?.id)
    : false;

  const handleJoinAndOpen = async () => {
    if (!project?.id || !currentUser) return;
    setIsJoining(true);
    try {
      const members = await joinProject(project.id, {
        ...currentUser,
        role: currentUser.role || "editor",
      });
      startTransition(() => {
        setProject((prev) => ({
          ...(prev || {}),
          members: Array.isArray(members) ? members : prev?.members || [],
        }));
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!isCurrentMember) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EFEFEF] px-6 text-slate-900">
        <div className="w-full max-w-xl rounded-[32px] border border-black/10 bg-white px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#558A72]">
            Join project
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#3C3C3C]">
            {project?.title || "Untitled Project"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            You are not participating in this project yet. Join it to add it to your project list and open the
            workspace.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleJoinAndOpen}
              disabled={isJoining}
              className="rounded-2xl bg-[#7BA592] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6b907f] disabled:opacity-60"
            >
              {isJoining ? "Joining..." : "Join project"}
            </button>
            <button
              type="button"
              onClick={() => void router.push("/projects")}
              className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#EFEFEF]">
      <ThinkingMachine
        projectId={String(project?.id || id || "")}
        initialProjectTitle={project?.title || "Untitled Project"}
        projectMetaHref="/projects"
        projectMetaLabel="Back to projects"
        currentUser={currentUser}
      />
    </main>
  );
}
