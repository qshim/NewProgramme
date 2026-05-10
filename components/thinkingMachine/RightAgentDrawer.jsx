"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, GitBranch, Image as ImageIcon, Loader2, Sparkles, StickyNote } from "lucide-react";
import {
  getSuggestionTagMeta,
  getTypeMeta,
  normalizeNodeData,
  normalizeSuggestionTags,
} from "@/lib/thinkingMachine/nodeMeta";
import NodeDetailCard from "@/components/thinkingMachine/cards/NodeDetailCard";
import CandidateGraphCard from "@/components/thinkingMachine/cards/CandidateGraphCard";
import AlignmentSummaryCard from "@/components/thinkingMachine/cards/AlignmentSummaryCard";
import DrawerSuggestionCarousel from "@/components/thinkingMachine/drawer/DrawerSuggestionCarousel";
import DrawerMeetingCaptureSection from "@/components/thinkingMachine/drawer/DrawerMeetingCaptureSection";
import DrawerChatTranscript from "@/components/thinkingMachine/drawer/DrawerChatTranscript";
import { getRightDrawerCopy } from "@/components/thinkingMachine/drawer/rightDrawerCopy";

function MicButtonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[18px] w-[18px]">
      <rect x="9" y="3.5" width="6" height="10" rx="3" fill="currentColor" />
      <path
        d="M6.5 10.5C6.5 13.5376 8.96243 16 12 16C15.0376 16 17.5 13.5376 17.5 10.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M12 16V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 20H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RightAgentDrawer({
  isOpen,
  mode,
  suggestions,
  activeSuggestion,
  selectedNode,
  linkedNodes,
  candidateGraph,
  alignmentSummary,
  currentUserRole = "owner",
  chatMessages,
  chatInput,
  isChatLoading,
  isChatConverting,
  onChatInputChange,
  onChatSubmit,
  onChatConvertToNodes,
  inputMode = "workspace",
  onInputModeChange,
  meetingCaptureSummary,
  isMeetingCaptureLoading = false,
  onCommitCandidateNodes,
  onCommitCandidateNodesAsPrivate,
  onDiscardCandidateNodes,
  onPromoteSelectedNode,
  onDemoteSelectedNode,
  onSetNodeVisibility,
  onChatContextSelect,
  onAlignmentSignalSelect,
  modeLabel,
  candidateHint,
  selectedNodeQuickActions,
  uiLanguage = "en",
  onUiLanguageChange,
  canvasMode = "personal",
  onCanvasModeChange,
  chatButtonRef,
  chatDropZoneRef,
  isChatDropActive,
  onClearSelectedNode,
  onAddPostit,
  onAddImage,
  showDrawerHint = true,
}) {
  const isTip = mode === "tip";
  const isChat = mode === "chat";
  const isMeetingCapture = inputMode === "meeting";
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];
  const shouldShowContextPanel = suggestionItems.length > 0;
  const activeMeta = normalizeNodeData(activeSuggestion || {});
  const categoryColors = getTypeMeta(activeMeta.category);
  const activeSuggestionTags = normalizeSuggestionTags(activeSuggestion?.suggestionTags || activeSuggestion?.tags, activeMeta);
  const shouldShowActiveSuggestionCard = Boolean(activeSuggestion && activeSuggestion?.type !== "attachedNodes");
  const drawerFieldBaseFade =
    "linear-gradient(169.55deg, rgba(199, 251, 201, 0.3) 9.44%, rgba(179, 236, 236, 0.3) 97.4%)";
  const drawerFieldRadialAlpha = "none";
  const drawerFieldLemonStrip = "none";
  const drawerFieldEdgeOverlay = "none";
  const chatBottomRef = useRef(null);
  const contextScrollRef = useRef(null);
  const panelScrollRef = useRef(null);
  const [loadingOverlayText, setLoadingOverlayText] = useState("");
  const [isLoadingOverlayExiting, setIsLoadingOverlayExiting] = useState(false);
  const [canScrollSuggestionsLeft, setCanScrollSuggestionsLeft] = useState(false);
  const [canScrollSuggestionsRight, setCanScrollSuggestionsRight] = useState(false);
  const shouldShowDrawerHint = showDrawerHint && !selectedNode;
  const copy = getRightDrawerCopy(uiLanguage);

  useEffect(() => {
    if (!isOpen || !isChat) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading, isOpen, isChat]);

  useEffect(() => {
    contextScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    panelScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [mode, activeSuggestion?.id]);

  useEffect(() => {
    const el = contextScrollRef.current;
    if (!el) return;

    const updateScrollButtons = () => {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      setCanScrollSuggestionsLeft(el.scrollLeft > 6);
      setCanScrollSuggestionsRight(el.scrollLeft < maxScrollLeft - 6);
    };

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [suggestionItems.length]);

  useEffect(() => {
    if (!isChatLoading && loadingOverlayText) {
      const exitStartTimer = window.setTimeout(() => {
        setIsLoadingOverlayExiting(true);
      }, 0);
      const exitTimer = window.setTimeout(() => {
        setLoadingOverlayText("");
        setIsLoadingOverlayExiting(false);
      }, 240);

      return () => {
        window.clearTimeout(exitStartTimer);
        window.clearTimeout(exitTimer);
      };
    }
  }, [isChatLoading, loadingOverlayText]);

  const handleChatSubmit = (event) => {
    event.preventDefault();
    const submittedText = String(chatInput || "").trim();
    if (submittedText && !isChatLoading) {
      setLoadingOverlayText(submittedText);
      setIsLoadingOverlayExiting(false);
    }
    onChatSubmit?.();
  };

  const handleSuggestionScroll = (direction) => {
    const el = contextScrollRef.current;
    if (!el) return;
    const delta = Math.max(168, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({
      left: direction === "left" ? -delta : delta,
      behavior: "smooth",
    });
  };

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[45] overflow-visible">
      <div className="relative flex h-full w-[365px] transform-gpu sm:w-[385px] lg:w-[397px]">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[0] w-[96px]"
          aria-hidden
          style={{ background: drawerFieldLemonStrip }}
        />
        <motion.div
          ref={chatDropZoneRef}
          className={`relative h-full w-[365px] overflow-hidden rounded-none pointer-events-auto opacity-100 sm:w-[385px] lg:w-[397px] ${
            isChat && isChatDropActive ? "ring-4 ring-teal-300/40" : ""
          }`}
          aria-hidden={false}
          initial={{ x: 44, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 44, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `${drawerFieldRadialAlpha}, ${drawerFieldBaseFade}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16"
            aria-hidden
            style={{ background: drawerFieldEdgeOverlay }}
          />
          <div
            className={`pointer-events-none absolute inset-x-8 top-[62px] z-[11] flex justify-center transition-all duration-300 ${
              shouldShowDrawerHint ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
            aria-hidden={!shouldShowDrawerHint}
          >
              <div
                className="origin-top-center scale-[0.46] sm:scale-[0.485] lg:scale-[0.505]"
                style={{
                  width: "520px",
                  height: "58px",
                }}
              >
                <div
                  className="flex h-[58px] w-[520px] items-center gap-[7px] rounded-[30px] pl-[14px] pr-[19px]"
                  style={{
                    background: "#FFFFFF",
                    opacity: 0.85,
                    boxShadow: "0px 1px 10px rgba(33, 97, 5, 0.08)",
                  }}
                >
                  <div className="flex translate-x-[6px] items-center gap-[7px]">
                    <Sparkles className="h-[36px] w-[34px] shrink-0 text-[#FD9A00]" strokeWidth={1.8} />
                    <div
                      className="whitespace-nowrap"
                      style={{
                        width: "432px",
                        height: "34px",
                        fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                        fontStyle: "normal",
                        fontWeight: 600,
                        fontSize: "18.8905px",
                        lineHeight: "180%",
                        color: "#758E71",
                      }}
                    >
                      Start with a thought, or select a node to extend it.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-4 pt-4">
            <div className="mb-2 flex justify-end pr-1">
              <div className="flex items-center gap-2">
                <div className="pointer-events-auto inline-flex items-center rounded-[14px] border border-white/80 bg-white/72 p-[2px] shadow-[0_7px_18px_rgba(76,108,90,0.10)] backdrop-blur-[14px]">
                  <button
                    type="button"
                    onClick={() => onInputModeChange?.("workspace")}
                    className={`inline-flex h-6 min-w-[74px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                      !isMeetingCapture
                        ? "bg-[#6F8A7B] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                        : "text-[#839083]"
                    }`}
                  >
                    {copy.workspaceInputTab}
                  </button>
                  <button
                    type="button"
                    onClick={() => onInputModeChange?.("meeting")}
                    className={`inline-flex h-6 min-w-[68px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                      isMeetingCapture
                        ? "bg-[#6F8A7B] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                        : "text-[#839083]"
                    }`}
                  >
                    {copy.meetingTab}
                  </button>
                </div>
                <div className="pointer-events-auto inline-flex items-center rounded-[14px] border border-white/80 bg-white/72 p-[2px] shadow-[0_7px_18px_rgba(76,108,90,0.10)] backdrop-blur-[14px]">
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("personal")}
                  className={`inline-flex h-6 min-w-[62px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                    canvasMode === "personal"
                      ? "bg-[#7BA592] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                      : "text-[#839083]"
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("team")}
                  className={`inline-flex h-6 min-w-[50px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                    canvasMode === "team"
                      ? "bg-[#7BA592] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                      : "text-[#A2ABA1]"
                  }`}
                >
                  Team
                </button>
                </div>
                <div className="pointer-events-auto inline-flex items-center rounded-[14px] border border-slate-200/80 bg-[#F0F1EF]/86 p-[2px] shadow-[0_5px_14px_rgba(15,23,42,0.06)] backdrop-blur-[14px]">
                  <button
                    type="button"
                    onClick={() => onUiLanguageChange?.("en")}
                    aria-label="Switch interface language to English"
                    className={`inline-flex h-6 min-w-[31px] items-center justify-center rounded-[12px] px-2 text-[10px] font-bold transition ${
                      uiLanguage === "en"
                        ? "bg-white text-slate-700 shadow-[0_2px_7px_rgba(15,23,42,0.08)]"
                        : "text-slate-400"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onUiLanguageChange?.("ko")}
                    aria-label="Switch interface language to Korean"
                    className={`inline-flex h-6 min-w-[31px] items-center justify-center rounded-[12px] px-2 text-[10px] font-bold transition ${
                      uiLanguage === "ko"
                        ? "bg-white text-slate-700 shadow-[0_2px_7px_rgba(15,23,42,0.08)]"
                        : "text-slate-400"
                    }`}
                  >
                    KR
                  </button>
                </div>
              </div>
            </div>

            {shouldShowContextPanel ? (
              <DrawerSuggestionCarousel
                suggestionItems={suggestionItems}
                activeSuggestion={activeSuggestion}
                contextScrollRef={contextScrollRef}
                canScrollSuggestionsLeft={canScrollSuggestionsLeft}
                canScrollSuggestionsRight={canScrollSuggestionsRight}
                onSuggestionScroll={handleSuggestionScroll}
                onChatContextSelect={onChatContextSelect}
              />
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/70 bg-[rgba(255,255,255,0.34)] px-3.5 pb-3 pt-4 shadow-[0_14px_28px_rgba(88,116,104,0.09)] backdrop-blur-[16px]">
              <div className="min-h-0 flex-1 overflow-hidden text-sm text-slate-700">
                <div className="flex h-full min-h-0 flex-col">
                  <div
                    ref={panelScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto px-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div className="flex flex-col gap-3 pb-2">
                      <NodeDetailCard
                        selectedNode={selectedNode}
                        linkedNodes={linkedNodes}
                        currentUserRole={currentUserRole}
                        modeLabel={modeLabel}
                        quickActions={selectedNodeQuickActions}
                        onPromote={onPromoteSelectedNode}
                        onDemote={onDemoteSelectedNode}
                        onShare={() => onSetNodeVisibility?.(selectedNode?.id, "shared")}
                        onSetVisibility={(nextVisibility) => onSetNodeVisibility?.(selectedNode?.id, nextVisibility)}
                        onClearSelection={onClearSelectedNode}
                      />
                      <AlignmentSummaryCard
                        selectedNode={selectedNode}
                        summary={alignmentSummary}
                        onSelectSignal={onAlignmentSignalSelect}
                      />
                      {isMeetingCapture ? (
                        <DrawerMeetingCaptureSection meetingCaptureSummary={meetingCaptureSummary} />
                      ) : null}

                      {shouldShowActiveSuggestionCard ? (
                        <div
                          className={`rounded-[14px] border ${categoryColors.border} ${categoryColors.tint} px-3`}
                          style={{ paddingTop: 11, paddingBottom: 17 }}
                        >
                          <div
                            className="font-heading line-clamp-1 text-xs font-semibold text-slate-800"
                            style={{ position: "relative", left: 3 }}
                          >
                            {activeSuggestion.title}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {[
                              ["reasoning", activeSuggestionTags.reasoning],
                              ["lens", activeSuggestionTags.lens],
                              ["question", activeSuggestionTags.question],
                            ].filter(([axis, value]) => !(axis === "lens" && value === "User")).map(([axis, value]) => {
                              const meta = getSuggestionTagMeta(axis, value);
                              return (
                                <span key={`${axis}-${value}`} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
                                  {value}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <CandidateGraphCard
                        candidateGraph={candidateGraph}
                        candidateHint={candidateHint}
                        onCommit={onCommitCandidateNodes}
                        onCommitAsPrivate={onCommitCandidateNodesAsPrivate}
                        onDiscard={onDiscardCandidateNodes}
                      />

                      <DrawerChatTranscript
                        chatMessages={chatMessages}
                        isChatLoading={isChatLoading}
                        activeSuggestion={activeSuggestion}
                        chatBottomRef={chatBottomRef}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 pt-3">
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <button
                        type="button"
                        onClick={onAddPostit}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/78 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.07)] transition hover:bg-white"
                        aria-label={copy.note}
                        title={copy.note}
                      >
                        <StickyNote className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onAddImage}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/78 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.07)] transition hover:bg-white"
                        aria-label={copy.image}
                        title={copy.image}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/78 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.07)] transition hover:bg-white"
                        aria-label={copy.voice}
                        title={copy.voice}
                      >
                        <MicButtonIcon />
                      </button>
                    </div>

                    <form onSubmit={handleChatSubmit} className="space-y-2">
                      <div
                        ref={chatButtonRef}
                        className="relative overflow-hidden rounded-[16px] border border-white/85 bg-white/88 px-4 pb-11 pt-3 shadow-[0_8px_18px_rgba(126,154,138,0.10)]"
                      >
                        {loadingOverlayText ? (
                          <div
                            className={`pointer-events-none absolute inset-x-4 top-3 bottom-12 transition-opacity duration-200 ${
                              isLoadingOverlayExiting ? "opacity-0" : "opacity-100"
                            }`}
                            aria-hidden="true"
                          >
                            <div className="drawer-loading-gradient-text h-full w-full overflow-hidden whitespace-pre-wrap break-words text-[13px] font-medium leading-[1.45]">
                              {loadingOverlayText}
                            </div>
                          </div>
                        ) : null}
                        <textarea
                          value={chatInput}
                          onChange={(event) => onChatInputChange?.(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleChatSubmit(event);
                            }
                          }}
                          placeholder={isMeetingCapture ? "Add one meeting turn or note block..." : selectedNode ? "Add a related thought..." : "Add a thought..."}
                          disabled={isChatLoading || isMeetingCaptureLoading}
                          rows={2}
                          className={`min-h-[68px] w-full resize-none border-none bg-transparent pr-11 text-[13px] font-medium leading-[1.45] outline-none ${
                            loadingOverlayText
                              ? "text-transparent caret-transparent placeholder:text-transparent"
                              : "text-slate-700 placeholder:text-[#A4B2C6]"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || isMeetingCaptureLoading || !chatInput?.trim()}
                          className="absolute bottom-3.5 right-3.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(97,129,95,0.35)] bg-[linear-gradient(136.99deg,rgba(199,255,232,0.28)_-0.49%,rgba(19,158,89,0.24)_142.16%),linear-gradient(0deg,rgba(147,205,186,0.2),rgba(147,205,186,0.2))] shadow-[0_6px_14px_rgba(61,107,79,0.10)] transition disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Send message"
                        >
                          <ArrowUp className="h-4 w-4 text-[#5A8054]" strokeWidth={2.1} />
                        </button>
                      </div>
                    </form>

                    {activeSuggestion && chatMessages.length >= 2 && !isMeetingCapture && (
                      <button
                        type="button"
                        onClick={onChatConvertToNodes}
                        disabled={isChatConverting}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-55"
                      >
                        {isChatConverting ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Creating nodes...
                          </>
                        ) : (
                          <>
                            <GitBranch className="h-3 w-3" />
                            Convert to node candidates
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
