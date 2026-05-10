import { startTransition, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  createProject as createProjectRequest,
  fetchProjects,
  joinProject,
} from "@/lib/thinkingMachine/apiClient";
import { readCurrentUser } from "@/lib/thinkingMachine/clientUser";

const LOGIN_STORAGE_KEY = "isLoggedIn";
const DotGrid = dynamic(() => import("@/components/DotGrid/DotGrid"), { ssr: false });

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createProjectDraft() {
  return {
    title: "Untitled Project",
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [myProjects, setMyProjects] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [joiningProjectId, setJoiningProjectId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const isLoggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";

    if (!isLoggedIn) {
      void router.replace("/");
      return;
    }

    const run = async () => {
      try {
        const nextCurrentUser = readCurrentUser();
        const nextProjects = await fetchProjects({
          currentUserId: nextCurrentUser.id,
          scope: "member",
        });
        startTransition(() => {
          setCurrentUser(nextCurrentUser);
          setMyProjects(nextProjects);
          setIsLoading(false);
        });
      } catch {
        startTransition(() => {
          setMyProjects([]);
          setIsLoading(false);
        });
      }
    };
    void run();
  }, [router]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    let cancelled = false;
    setIsSearchLoading(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const nextResults = await fetchProjects({
          currentUserId: currentUser.id,
          scope: "discover",
          query: trimmedQuery,
        });
        if (!cancelled) {
          setSearchResults(nextResults);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearchLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentUser, searchQuery]);

  const sortedProjects = useMemo(() => {
    return [...myProjects].sort((a, b) => {
      const aTime = new Date(a?.updatedAt || 0).getTime();
      const bTime = new Date(b?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [myProjects]);

  const handleCreateProject = async () => {
    const draftProject = createProjectDraft();
    const nextCurrentUser = currentUser || readCurrentUser();
    const nextProject = await createProjectRequest({
      title: draftProject.title,
      actor: {
        ...nextCurrentUser,
        role: "owner",
      },
    });
    setCurrentUser(nextCurrentUser);
    setMyProjects((prev) => [nextProject, ...prev]);
    void router.push(`/projects/${nextProject.id}`);
  };

  const handleOpenProject = (projectId) => {
    void router.push(`/projects/${projectId}`);
  };

  const handleJoinProject = async (project) => {
    if (!project?.id || !currentUser) return;
    setJoiningProjectId(project.id);
    try {
      await joinProject(project.id, {
        ...currentUser,
        role: currentUser.role || "editor",
      });
      const refreshedMyProjects = await fetchProjects({
        currentUserId: currentUser.id,
        scope: "member",
      });
      startTransition(() => {
        setMyProjects(refreshedMyProjects);
        setSearchResults((prev) =>
          prev.map((item) => (item.id === project.id ? { ...item, isMember: true } : item))
        );
      });
      void router.push(`/projects/${project.id}`);
    } finally {
      setJoiningProjectId("");
    }
  };

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#F3F8F8] text-slate-900">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <DotGrid
            dotSize={2}
            gap={10}
            baseColor="#6d8ea5"
            activeColor="#cce8ff"
            proximity={130}
            shockRadius={260}
            shockStrength={5}
            resistance={750}
            returnDuration={1.5}
          />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="rounded-3xl border border-black/10 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading projects...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F3F8F8] px-6 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
        <DotGrid
          dotSize={2}
          gap={10}
          baseColor="#6d8ea5"
          activeColor="#cce8ff"
          proximity={130}
          shockRadius={260}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>
      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#558A72]">
              Thinking Machine
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#3C3C3C]">Projects</h1>
            <p className="mt-2 text-sm text-slate-600">
              Search by project name, join a project, or open one you already participate in.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            className="rounded-2xl bg-[#9ED9BF] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#9ED9BF]"
          >
            Create New Project
          </button>
        </div>

        <div className="mb-8 rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#558A72]">
            Discover
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by project name"
              className="w-full rounded-2xl border border-black/10 bg-[#F8FBFB] px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#8DB9A3]"
            />
          </div>
          {searchQuery.trim() ? (
            <div className="mt-4">
              {isSearchLoading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Searching projects...
                </div>
              ) : searchResults.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {searchResults.map((project) => (
                    <div
                      key={`discover-${project.id}`}
                      className="rounded-2xl border border-black/10 bg-[#FCFEFE] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-lg font-semibold tracking-[-0.03em] text-[#3C3C3C]">
                            {project.title || "Untitled Project"}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Updated {formatDate(project.updatedAt)} · {project.memberCount || 0} members
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            project.isMember ? handleOpenProject(project.id) : void handleJoinProject(project)
                          }
                          disabled={joiningProjectId === project.id}
                          className="shrink-0 rounded-full bg-[#7BA592] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6b907f] disabled:opacity-60"
                        >
                          {joiningProjectId === project.id
                            ? "Joining..."
                            : project.isMember
                              ? "Open"
                              : "Join"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No projects matched that name.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {sortedProjects.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white px-8 py-14 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="text-lg font-semibold text-slate-900">No joined projects yet</div>
            <p className="mt-2 text-sm text-slate-600">
              Create one or search by name to join an existing project.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#558A72]">
              My Projects
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleOpenProject(project.id)}
                className="rounded-[28px] border border-black/10 bg-white p-5 text-left shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#558A72]">
                  Project
                </div>
                <div className="-translate-y-[8px] mt-3 line-clamp-2 text-xl font-semibold tracking-[-0.03em] text-[#3C3C3C]">
                  {project.title || "Untitled Project"}
                </div>
                <div className="mt-6 text-xs text-slate-600">
                  Updated {formatDate(project.updatedAt)} · {project.memberCount || 0} members
                </div>
              </button>
            ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
