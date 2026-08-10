"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    getViewportForBounds,
} from "reactflow";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftTeamContextPanel from "./LeftTeamContextPanel";
import RightAgentDrawer from "./RightAgentDrawer";
import TopBar from "./TopBar";
import WorkspaceStarter from "./WorkspaceStarter";
import AdminOverviewPanel from "./AdminOverviewPanel";
import { getNodeSnapshot, getRelatedNodeIds } from "@/components/thinkingMachine/utils/graphSnapshots";
import { buildAttachedNodesContext } from "@/components/thinkingMachine/utils/chatDropGeometry";
import { decorateConnectorEdges, toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { computeNodeBounds, placeIncomingNodesPreservingLayout, relayoutTopLevelThinkingNodes, shiftClusterRightOfExisting } from "@/lib/thinkingMachine/graphMerge";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useDraftGrouping } from "@/components/thinkingMachine/hooks/useDraftGrouping";
import { useGhostDragToChat } from "@/components/thinkingMachine/hooks/useGhostDragToChat";
import { useThinkingCollaboration } from "@/components/thinkingMachine/hooks/useThinkingCollaboration";
import { useThinkingGraphState } from "@/components/thinkingMachine/hooks/useThinkingGraphState";
import { useThinkingAiAnalyze } from "@/components/thinkingMachine/hooks/useThinkingAiAnalyze";
import { useRightDrawerChat } from "@/components/thinkingMachine/hooks/useRightDrawerChat";
import { useProjectGraphSync } from "@/components/thinkingMachine/hooks/useProjectGraphSync";
import { useChatGraphIngest } from "@/components/thinkingMachine/hooks/useChatGraphIngest";
import { useMeetingCaptureFlow } from "@/components/thinkingMachine/hooks/useMeetingCaptureFlow";
import { useTeamContextSummary } from "@/components/thinkingMachine/hooks/useTeamContextSummary";
import { useWorkspaceTranslations } from "@/components/thinkingMachine/hooks/useWorkspaceTranslations";
import { useConceptStudio } from "@/components/thinkingMachine/hooks/useConceptStudio";
import {
    buildMeetingMemoryReadout,
    getDefaultMeetingMemory,
    mergeMeetingMemory,
} from "@/lib/thinkingMachine/meetingMemory";
import { readCurrentUser } from "@/lib/thinkingMachine/clientUser";
import { buildReasoningAlignmentAnalysis, getAlignmentVisualMeta } from "@/lib/thinkingMachine/reasoningAlignment";
import { buildTeamConflictAnalysis } from "@/lib/thinkingMachine/conflictAnalysis";
import { explainConflict, summarizeTeamContext } from "@/lib/thinkingMachine/apiClient";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";
import { normalizeAiModelProfile } from "@/lib/ai/modelRegistry";
import {
    getReasoningModeProfile,
    getNextVisibility,
    getPreviousVisibility,
    normalizeLayerOrigin,
    normalizeReasoningStage,
    normalizeRelationLabel,
    normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const UI_LANGUAGE_STORAGE_KEY = "thinkingMachineUiLanguage";
const AI_MODEL_PROFILE_STORAGE_KEY = "thinkingMachineAiModelProfile";
const MOCK_CURRENT_USER_ID = "mock-user-1";
const MOCK_CURRENT_USER_ROLE = "owner";
const AUTO_FIT_MAX_ZOOM = 1;

function readInitialUiLanguage() {
    if (typeof window === "undefined") return "en";
    try {
        const storedLanguage = window.localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
        return ["en", "ko", "ja"].includes(storedLanguage) ? storedLanguage : "en";
    } catch {
        return "en";
    }
}

function readInitialModelProfile() {
    if (typeof window === "undefined") return "auto";
    try {
        return normalizeAiModelProfile(window.localStorage.getItem(AI_MODEL_PROFILE_STORAGE_KEY));
    } catch {
        return "auto";
    }
}

function cubicOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

function toNodeBrief(node) {
    if (!node) return null;
    return {
        id: node.id,
        title: node.data?.title || "Untitled node",
        content: node.data?.content || "",
        category: node.data?.category || "Idea",
        phase: node.data?.phase,
    };
}

function buildAlignmentStrategyContext({ relationship, sourceNode, targetNode }) {
    const sourceBrief = toNodeBrief(sourceNode);
    const targetBrief = toNodeBrief(targetNode);
    const sourceTitle = sourceBrief?.title || "Source node";
    const targetTitle = targetBrief?.title || "Target node";
    const relationLabel = relationship?.relationLabel || "relationship";
    const summary = relationship?.summary || `${sourceTitle} and ${targetTitle} still need clarification.`;

    return {
        id: `strategy-${relationship?.edgeId || relationship?.id || `${sourceBrief?.id}-${targetBrief?.id}`}`,
        edgeId: relationship?.edgeId || relationship?.id || "",
        status: "draft",
        sourceNode: sourceBrief,
        targetNode: targetBrief,
        relationshipLabel: relationship?.displayLabel || "Unresolved difference",
        diagnosis: summary,
        strategy: `Align these nodes by adding one bridging clarification: what exact criterion, evidence, or definition would make "${sourceTitle}" usable for "${targetTitle}"?`,
        steps: [
            `Name the missing clarification between "${sourceTitle}" and "${targetTitle}".`,
            `Add or update one note that states the shared criterion in plain language.`,
            `Move the relationship to Partial alignment once both nodes share the same frame.`,
        ],
        refinePrompt: `Help me refine an alignment strategy for this unresolved relationship. Source: "${sourceTitle}". Target: "${targetTitle}". Current relation: "${relationLabel}". What is the smallest clarification, evidence, or definition that would move it toward partial alignment?`,
    };
}

export default function ThinkingMachine({
    projectId = "",
    initialProjectTitle = "Thinking Machine",
    projectMetaHref = "/projects",
    projectMetaLabel = "Back to projects",
    currentUser: initialCurrentUser = null,
}) {
    const [nodes, setNodes, baseOnNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [drawerMode, setDrawerMode] = useState("tip");
    const [stage, setStage] = useState("research-diverge");
    const [projectTitle, setProjectTitle] = useState(initialProjectTitle);
    const [canvasMode, setCanvasMode] = useState("personal");
    const [uiLanguage, setUiLanguage] = useState(readInitialUiLanguage);
    const [modelProfile, setModelProfile] = useState(readInitialModelProfile);
    const [inputMode, setInputMode] = useState("workspace");
    const [isCanvasInteractive, setIsCanvasInteractive] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [pendingChatCandidateGraph, setPendingChatCandidateGraph] = useState(null);
    const [inputGuidance, setInputGuidance] = useState(null);
    const [hasStartedInput, setHasStartedInput] = useState(false);
    const [currentUser] = useState(() => {
        if (initialCurrentUser) return initialCurrentUser;
        if (typeof window !== "undefined") return readCurrentUser();
        return null;
    });
    const [isGraphHydrating, setIsGraphHydrating] = useState(true);
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);
    const [selectedActivityEventId, setSelectedActivityEventId] = useState(null);
    const [teamContextSummary, setTeamContextSummary] = useState(null);
    const [isTeamContextLoading, setIsTeamContextLoading] = useState(false);
    const [teamContextError, setTeamContextError] = useState("");
    const [adminOverviewSummary, setAdminOverviewSummary] = useState(null);
    const [isAdminOverviewLoading, setIsAdminOverviewLoading] = useState(false);
    const [adminOverviewError, setAdminOverviewError] = useState("");
    const [isTeamContextPanelOpen, setIsTeamContextPanelOpen] = useState(false);
    const [meetingMemory, setMeetingMemory] = useState(() => getDefaultMeetingMemory());
    const [meetingCaptureSummary, setMeetingCaptureSummary] = useState(null);
    const [isMeetingCaptureLoading, setIsMeetingCaptureLoading] = useState(false);
    const [meetingSessionIdValue] = useState(() => `meeting-${Date.now()}`);
    const meetingSessionIdRef = useRef(meetingSessionIdValue);
    const lastSavedGraphRef = useRef("");
    const lastSyncedTitleRef = useRef(initialProjectTitle);
    const [openConflictNodeId, setOpenConflictNodeId] = useState(null);
    const [conflictExplainResultByNodeId, setConflictExplainResultByNodeId] = useState({});
    const [conflictExplainLoadingByNodeId, setConflictExplainLoadingByNodeId] = useState({});
    const [selectedAlignmentStrategy, setSelectedAlignmentStrategy] = useState(null);
    const [manualAlignmentByEdgeId, setManualAlignmentByEdgeId] = useState({});
    const previousConflictStateRef = useRef({});

    const { isAdminMode, setIsAdminMode } = useAdminMode({
        storageKey: ADMIN_MODE_STORAGE_KEY,
        hintDismissedKey: ADMIN_HINT_DISMISSED_KEY,
    });

    const currentUserId = currentUser?.id || MOCK_CURRENT_USER_ID;
    const currentUserName = currentUser?.name || "You";
    const currentUserRole = currentUser?.role || MOCK_CURRENT_USER_ROLE;
    const currentUserEmail = currentUser?.email || "";
    const currentUserPicture = currentUser?.picture || "";

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
        } catch {
            // Language preference should not block the workspace.
        }
    }, [uiLanguage]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            window.localStorage.setItem(AI_MODEL_PROFILE_STORAGE_KEY, modelProfile);
        } catch {
            // Model preference should not block the workspace.
        }
    }, [modelProfile]);

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(() => new Set());
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
    const nodeContextSuggestions = useMemo(() => {
        return [...nodes]
            .filter((node) => node?.type === "thinkingNode" && node?.id)
            .reverse()
            .map((node) => ({
                id: `node-context-${node.id}`,
                nodeId: node.id,
                _source: "node-context",
                type: "attachedNodes",
                title: node?.data?.title || "",
                content: node?.data?.content || "",
                category: node?.data?.category,
                phase: node?.data?.phase,
                sourceType: node?.data?.sourceType,
                visibility: node?.data?.visibility,
                confidence: node?.data?.confidence || "medium",
                attached_nodes: [
                    {
                        id: node.id,
                        title: node?.data?.title || "",
                        content: node?.data?.content || "",
                        category: node?.data?.category,
                        phase: node?.data?.phase,
                    },
                ],
            }));
    }, [nodes]);
    const drawerSuggestions = useMemo(() => {
        const combined = [...suggestions, ...nodeContextSuggestions];
        return combined.filter((item) => item?.id && !dismissedSuggestionIds.has(item.id));
    }, [dismissedSuggestionIds, nodeContextSuggestions, suggestions]);
    const unseenSuggestions = useMemo(
        () => drawerSuggestions,
        [drawerSuggestions]
    );

    // Chat state (Drawer Chat primary + optional legacy dialog fallback)
    const [, setAttachedNodes] = useState([]); // [{id,title,content,category,phase,sourceType,visibility,confidence}]
    const reactFlowRef = useRef(null);
    const previewNodesFromChatRef = useRef(null);
    const handlePreviewNodesFromChatProxy = useCallback((...args) => {
        return previewNodesFromChatRef.current?.(...args);
    }, []);

    const {
        activeSuggestion,
        setActiveSuggestion,
        chatMessages,
        chatInput,
        setChatInput,
        isChatLoading,
        isChatConverting,
        chatConversionError,
        handleDrawerModeToggle,
        handleDrawerChatSubmit,
        handleDrawerContextSelect,
        resetChat,
    } = useRightDrawerChat({
        suggestions: unseenSuggestions,
        nodes,
        edges,
        onPreviewNodesFromChat: handlePreviewNodesFromChatProxy,
        isDrawerOpen,
        setIsDrawerOpen,
        drawerMode,
        setDrawerMode,
        stage,
        uiLanguage,
        modelProfile,
    });

    const handleDrawerModeChange = useCallback((nextMode) => {
        handleDrawerModeToggle(nextMode);
        setIsDrawerOpen(true);
    }, [handleDrawerModeToggle]);

    const handleDrawerSuggestionSelect = useCallback((item) => {
        if (!item) return;
        if (item?.id && item?._source !== "node-auto") {
            setDismissedSuggestionIds((prev) => {
                const next = new Set(prev);
                next.add(item.id);
                return next;
            });
        }
        handleDrawerContextSelect(item);
    }, [handleDrawerContextSelect]);

    const {
        selectedDraftIds,
        showDraftConvertPrompt,
        setShowDraftConvertPrompt,
        draftConvertIdsRef,
        selectionBoxEnabled,
        draftSubmittingIds,
        createPostitDraft,
        createImageDraft,
        handlePostitChangeText,
        handleImageChangeCaption,
        handleImagePick,
        handleDraftSubmit,
        handleSelectionChange,
        convertDraftsToGroup,
        toggleIdeaGroupMode,
    } = useDraftGrouping({
        nodes,
        edges,
        setNodes,
        setEdges,
        isAnalyzing,
        setIsAnalyzing,
        setSuggestions,
        reactFlowRef,
        stage,
        currentUserId,
        currentUserName,
    });

    const {
        isChatDropActive,
        ghostDrag,
        chatButtonRef,
        chatDropZoneRef,
        filteredOnNodesChange,
        handleNodeDragStart,
        handleNodeDragUpdate,
        handleNodeDragStop,
    } = useGhostDragToChat({
        nodes,
        setNodes,
        baseOnNodesChange,
        setAttachedNodes,
        setActiveSuggestion,
        setDrawerMode,
        setIsDrawerOpen,
    });

    const {
        projectLastUpdated,
        activityLog,
        teamMembers,
        currentMember,
        lastRefreshedAt,
        recordProjectActivity,
        refreshProjectCollaborationMeta,
    } = useThinkingCollaboration({
        projectId,
        currentUserId,
        currentUserRole,
        currentUserName,
        currentUserEmail,
        currentUserPicture,
    });
    const effectiveCurrentUserRole = currentMember?.role || currentUserRole;
    const canAccessAdminView =
        ["owner", "admin"].includes(String(effectiveCurrentUserRole || "").toLowerCase()) ||
        teamMembers.length === 0;
    const isAdminView = canAccessAdminView && isAdminMode;
    const normalizedStage = useMemo(() => normalizeReasoningStage(stage), [stage]);

    useProjectGraphSync({
        projectId,
        nodes,
        edges,
        normalizedStage,
        meetingMemory,
        currentUserId,
        currentUserName,
        currentUserEmail,
        currentUserPicture,
        effectiveCurrentUserRole,
        isGraphHydrating,
        setNodes,
        setEdges,
        setStage,
        setMeetingMemory,
        setProjectTitle,
        setHasStartedInput,
        setIsGraphHydrating,
        refreshProjectCollaborationMeta,
        lastSavedGraphRef,
        lastSyncedTitleRef,
        projectTitle,
    });

    const handleFlowInit = (instance) => {
        reactFlowRef.current = instance;
    };

    const animateViewportToNodes = useCallback((targetNodes) => {
        const inst = reactFlowRef?.current;
        const bounds = computeNodeBounds(targetNodes);
        if (!inst || !bounds) return;
        const canvasElement = document.querySelector(".tm-canvas-flow");
        const viewportWidth = canvasElement?.clientWidth ?? window.innerWidth;
        const viewportHeight = canvasElement?.clientHeight ?? window.innerHeight;
        if (typeof inst.setViewport === "function") {
            requestAnimationFrame(() => {
                const nextViewport = getViewportForBounds(
                    {
                        x: bounds.minX - 72,
                        y: bounds.minY - 72,
                        width: Math.max(260, bounds.maxX - bounds.minX) + 144,
                        height: Math.max(220, bounds.maxY - bounds.minY) + 144,
                    },
                    viewportWidth,
                    viewportHeight,
                    0.2,
                    AUTO_FIT_MAX_ZOOM,
                    0.18
                );
                nextViewport.zoom = Math.min(nextViewport.zoom, AUTO_FIT_MAX_ZOOM);
                inst.setViewport(nextViewport, {
                    duration: 700,
                    ease: cubicOut,
                });
            });
        }
    }, []);

    const handleStageChange = useCallback((nextStage) => {
        const safeStage = normalizeReasoningStage(nextStage);
        if (safeStage === normalizedStage) return;
        setStage(safeStage);
        void recordProjectActivity("stage_changed", {
            nodeTitle: safeStage,
            nodeType: "Stage",
            before: { stage: normalizedStage },
            after: { stage: safeStage },
            relatedNodeIds: [],
            metadata: {
                reason: "Canvas reasoning stage changed",
            },
            stage: safeStage,
        });
    }, [normalizedStage, recordProjectActivity]);

    const {
        handleAddNodesFromChat,
        handlePreviewNodesFromChat,
        handleCommitCandidateNodes,
        handleCommitCandidateNodesAsPrivate,
        handleDiscardCandidateNodes,
        pendingCandidatePreview,
    } = useChatGraphIngest({
        nodes,
        edges,
        currentUserId,
        currentUserName,
        normalizedStage,
        setNodes,
        setEdges,
        setActiveSuggestion,
        pendingChatCandidateGraph,
        setPendingChatCandidateGraph,
        animateViewportToNodes,
        recordProjectActivity,
    });
    useEffect(() => {
        previewNodesFromChatRef.current = handlePreviewNodesFromChat;
    }, [handlePreviewNodesFromChat]);

    const {
        messages: conceptMessages,
        input: conceptInput,
        setInput: setConceptInput,
        isLoading: isConceptLoading,
        error: conceptError,
        submit: handleConceptSubmit,
        reset: resetConceptStudio,
    } = useConceptStudio({
        projectTitle,
        nodes,
        selectedNodeId,
        uiLanguage,
        modelProfile,
        onPreviewGraph: handlePreviewNodesFromChat,
    });

    const handleSetNodeVisibility = useCallback((nodeId, nextVisibility) => {
        const normalizedNext = normalizeVisibility(nextVisibility);
        let previousVisibility = null;
        let previousLayerOrigin = "personal";
        let nextNodeTitle = "";
        let nextNodeType = "";
        let beforeSnapshot = null;
        let afterSnapshot = null;
        const relatedNodeIds = getRelatedNodeIds(nodeId, edges);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== nodeId || node.type !== "thinkingNode") return node;
                previousVisibility = normalizeVisibility(node.data?.visibility);
                previousLayerOrigin = normalizeLayerOrigin(node.data?.layerOrigin, previousVisibility);
                nextNodeTitle = node.data?.title || "";
                nextNodeType = node.data?.category || "";
                beforeSnapshot = getNodeSnapshot(node, edges);
                const isPromotingToTeam =
                    ["private", "candidate"].includes(previousVisibility) &&
                    ["shared", "reviewed", "agreed"].includes(normalizedNext);
                const updated = {
                    ...node,
                    data: {
                        ...node.data,
                        ownerId: currentUserId,
                        editedBy: currentUserName,
                        visibility: normalizedNext,
                        layerOrigin: isPromotingToTeam ? previousLayerOrigin : normalizeLayerOrigin(node.data?.layerOrigin, normalizedNext),
                        promotedFromVisibility: isPromotingToTeam ? previousVisibility : node.data?.promotedFromVisibility || "",
                        promotedAt: isPromotingToTeam ? new Date().toISOString() : node.data?.promotedAt || "",
                        promotedBy: isPromotingToTeam ? currentUserName : node.data?.promotedBy || "",
                    },
                };
                const rebuilt = toReactFlowNode({
                    id: updated.id,
                    position: updated.position,
                    data: {
                        label: updated.data?.title,
                        content: updated.data?.content,
                        category: updated.data?.category,
                        phase: updated.data?.phase,
                        ownerId: updated.data?.ownerId,
                        editedBy: updated.data?.editedBy,
                        sourceType: updated.data?.sourceType,
                        visibility: updated.data?.visibility,
                        confidence: updated.data?.confidence,
                        layerOrigin: updated.data?.layerOrigin,
                        promotedFromVisibility: updated.data?.promotedFromVisibility,
                        promotedAt: updated.data?.promotedAt,
                        promotedBy: updated.data?.promotedBy,
                        conflictState: updated.data?.conflictState,
                        conflictSummary: updated.data?.conflictSummary,
                        conflictLinkedNodeIds: updated.data?.conflictLinkedNodeIds,
                        conflictUpdatedAt: updated.data?.conflictUpdatedAt,
                    },
                }, null);
                afterSnapshot = getNodeSnapshot({ ...updated, ...rebuilt }, edges);
                return {
                    ...updated,
                    ...rebuilt,
                    parentNode: updated.parentNode,
                    extent: updated.extent,
                    hidden: updated.hidden,
                    selected: updated.selected,
                };
            })
        );
        void recordProjectActivity("node_visibility_changed", {
            nodeId,
            nodeTitle: nextNodeTitle,
            nodeType: nextNodeType,
            before: beforeSnapshot,
            after: afterSnapshot,
            relatedNodeIds,
            stage: normalizedStage,
        });
        if (["shared", "reviewed", "agreed"].includes(normalizedNext) && ["private", "candidate"].includes(previousVisibility || "")) {
            setCanvasMode("team");
            void recordProjectActivity("node_promoted_to_team", {
                nodeId,
                nodeTitle: nextNodeTitle,
                nodeType: nextNodeType,
                before: beforeSnapshot,
                after: afterSnapshot,
                relatedNodeIds,
                stage: normalizedStage,
                metadata: {
                    promotedFromVisibility: previousVisibility,
                },
            });
        }
        if (normalizedNext === "shared" && previousVisibility !== "shared") {
            void recordProjectActivity("node_shared", {
                nodeId,
                nodeTitle: nextNodeTitle,
                nodeType: nextNodeType,
                before: beforeSnapshot,
                after: afterSnapshot,
                relatedNodeIds,
                stage: normalizedStage,
            });
        }
    }, [currentUserId, currentUserName, edges, normalizedStage, recordProjectActivity, setCanvasMode, setNodes]);

    const handleNodeSelectionChange = useCallback(
        ({ nodes: selectedNodes = [] } = {}) => {
            handleSelectionChange?.({ nodes: selectedNodes });
            const firstThinkingNode = selectedNodes.find((node) => node?.type === "thinkingNode");
            if (firstThinkingNode?.id) {
                setSelectedNodeId(firstThinkingNode.id);
                setDrawerMode("chat");
                setIsDrawerOpen(true);
            }
            // 캔버스 빈 공간을 클릭해도 선택만 해제되고,
            // 마지막으로 본 노드 컨텍스트와 AI 의견은 그대로 유지되도록
            // 선택 노드를 강제로 null 로 리셋하지 않는다.
        },
        [handleSelectionChange]
    );

    const {
        hasThinkingGraph,
        selectedNode,
        visibleCanvasNodeIds,
        canvasNodes,
        canvasEdges,
        selectedNodeLinkedNodes,
    } = useThinkingGraphState({
        nodes,
        edges,
        selectedNodeId,
        canvasMode,
        currentUserId,
    });
    const candidateCanvasPreviewNodes = useMemo(() => {
        if (!pendingCandidatePreview?.nodes?.length) return [];
        const placedNodes = placeIncomingNodesPreservingLayout(
            canvasNodes,
            pendingCandidatePreview.nodes,
            pendingCandidatePreview.edges || []
        );
        return placedNodes.map((node) => ({
            ...node,
            draggable: false,
            selectable: false,
            focusable: false,
            className: `${node.className || ""} tm-candidate-preview-node`.trim(),
            style: {
                ...(node.style || {}),
                opacity: 0.68,
                filter: "saturate(0.72)",
                pointerEvents: "none",
            },
            data: {
                ...node.data,
                previewState: "draft",
            },
        }));
    }, [canvasNodes, pendingCandidatePreview]);
    const candidateCanvasPreviewEdges = useMemo(() => {
        if (!candidateCanvasPreviewNodes.length) return [];
        const allPreviewNodes = [...canvasNodes, ...candidateCanvasPreviewNodes];
        return toConnectorEdges(
            pendingCandidatePreview?.edges || [],
            allPreviewNodes,
            canvasEdges
        ).map((edge) => ({
            ...edge,
            selectable: false,
            focusable: false,
            data: {
                ...(edge.data || {}),
                alignmentState: "partial",
                alignmentLabel: "Draft branch",
                alignmentStroke: "rgba(94, 143, 116, 0.48)",
                alignmentLineDash: "5 7",
                lineWidth: 1.25,
            },
        }));
    }, [canvasEdges, canvasNodes, candidateCanvasPreviewNodes, pendingCandidatePreview?.edges]);
    useEffect(() => {
        if (!candidateCanvasPreviewNodes.length) return;
        animateViewportToNodes(candidateCanvasPreviewNodes);
    }, [animateViewportToNodes, candidateCanvasPreviewNodes]);
    const reasoningAlignmentAnalysis = useMemo(
        () => buildReasoningAlignmentAnalysis({
            nodes: canvasNodes,
            edges: canvasEdges,
            selectedNodeId,
        }),
        [canvasEdges, canvasNodes, selectedNodeId]
    );
    const adminAlignmentAnalysis = useMemo(
        () => buildReasoningAlignmentAnalysis({
            nodes: nodes.filter((node) => node?.type === "thinkingNode"),
            edges,
            selectedNodeId: null,
        }),
        [edges, nodes]
    );
    const teamConflictAnalysis = useMemo(
        () => buildTeamConflictAnalysis({
            nodes,
            edges,
        }),
        [edges, nodes]
    );
    const handleConnectorAlignmentClick = useCallback((edgeId) => {
        const relationship = reasoningAlignmentAnalysis?.relationships?.find((item) => item.edgeId === edgeId);
        const edge = canvasEdges.find((item) => item.id === edgeId);
        if (relationship && relationship.state !== "unresolved") return;
        if (!relationship && !edge) return;

        const fallbackRelationship = {
            id: edgeId,
            edgeId,
            sourceId: edge?.source,
            targetId: edge?.target,
            state: "unresolved",
            displayLabel: "Unresolved difference",
            relationLabel: edge?.data?.label || edge?.label || "relationship",
            summary: edge?.data?.alignmentReason || "",
        };
        const targetRelationship = relationship || fallbackRelationship;
        const sourceNode = canvasNodes.find((node) => node.id === targetRelationship.sourceId);
        const targetNode = canvasNodes.find((node) => node.id === targetRelationship.targetId);
        const relatedNodes = [sourceNode, targetNode].filter(Boolean);
        const relatedIds = relatedNodes.map((node) => node.id);

        setSelectedAlignmentStrategy(buildAlignmentStrategyContext({
            relationship: targetRelationship,
            sourceNode,
            targetNode,
        }));
        setActiveSuggestion(null);
        resetChat?.();
        setHighlightedNodeIds(new Set(relatedIds));
        if (sourceNode?.id) {
            setSelectedNodeId(sourceNode.id);
        }
        if (relatedNodes.length) {
            animateViewportToNodes(relatedNodes);
        }
        setDrawerMode("chat");
        setIsDrawerOpen(true);
        setHasStartedInput(true);
    }, [animateViewportToNodes, canvasEdges, canvasNodes, reasoningAlignmentAnalysis?.relationships, resetChat, setActiveSuggestion]);

    const decoratedCanvasEdges = useMemo(
        () =>
            decorateConnectorEdges(canvasEdges, reasoningAlignmentAnalysis).map((edge) => {
                const manualAlignment = manualAlignmentByEdgeId[edge.id];
                if (!manualAlignment) {
                    return {
                        ...edge,
                        data: {
                            ...(edge.data || {}),
                            onAlignmentLabelClick: handleConnectorAlignmentClick,
                        },
                    };
                }

                const visualMeta = getAlignmentVisualMeta(manualAlignment.state);
                return {
                    ...edge,
                    data: {
                        ...(edge.data || {}),
                        alignmentState: manualAlignment.state,
                        alignmentLabel: manualAlignment.label || visualMeta.label,
                        alignmentStroke: visualMeta.stroke,
                        alignmentLabelBackground: visualMeta.labelBackground,
                        alignmentLineDash: visualMeta.lineDash,
                        onAlignmentLabelClick: handleConnectorAlignmentClick,
                    },
                };
            }),
        [canvasEdges, handleConnectorAlignmentClick, manualAlignmentByEdgeId, reasoningAlignmentAnalysis]
    );
    const alignmentSummary = useMemo(
        () => reasoningAlignmentAnalysis?.selectedSummary || {
            counts: reasoningAlignmentAnalysis?.counts || {},
            sections: reasoningAlignmentAnalysis?.sections || {},
        },
        [reasoningAlignmentAnalysis]
    );
    const workspaceTranslationTexts = useMemo(() => {
        const values = [];
        const add = (value) => {
            if (typeof value === "string" && value.trim()) values.push(value);
        };

        // Translate what is visible in the drawer first, then continue through the canvas in the background.
        unseenSuggestions.forEach((suggestion) => {
            add(suggestion?.title);
            add(suggestion?.content);
        });
        nodes.forEach((node) => {
            add(node?.data?.title);
            add(node?.data?.content);
            add(node?.data?.conflictSummary);
        });
        Object.values(alignmentSummary?.sections || {}).forEach((items) => {
            if (!Array.isArray(items)) return;
            items.forEach((item) => add(item?.summary));
        });
        add(selectedAlignmentStrategy?.diagnosis);
        add(selectedAlignmentStrategy?.strategy);
        selectedAlignmentStrategy?.steps?.forEach(add);
        pendingCandidatePreview?.nodes?.forEach((node) => {
            add(node?.data?.title);
            add(node?.data?.content);
        });
        chatMessages.forEach((message) => add(message?.content));
        Object.values(conflictExplainResultByNodeId).forEach((explanation) => {
            add(explanation?.summary);
            add(explanation?.whyDifferent);
            add(explanation?.suggestedNextStep);
        });

        return values;
    }, [
        alignmentSummary,
        chatMessages,
        conflictExplainResultByNodeId,
        nodes,
        pendingCandidatePreview,
        selectedAlignmentStrategy,
        unseenSuggestions,
    ]);
    const { localizeText } = useWorkspaceTranslations({
        uiLanguage,
        texts: workspaceTranslationTexts,
    });
    const localizedCanvasNodes = useMemo(
        () => canvasNodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                localizedTitle: localizeText(node?.data?.title),
                localizedContent: localizeText(node?.data?.content),
                localizedConflictSummary: localizeText(node?.data?.conflictSummary),
            },
        })),
        [canvasNodes, localizeText]
    );
    const localizedCandidateCanvasPreviewNodes = useMemo(
        () => candidateCanvasPreviewNodes.map((node) => ({
            ...node,
            data: {
                ...node.data,
                localizedTitle: localizeText(node?.data?.title),
                localizedContent: localizeText(node?.data?.content),
            },
        })),
        [candidateCanvasPreviewNodes, localizeText]
    );
    const localizedSuggestions = useMemo(
        () => unseenSuggestions.map((suggestion) => ({
            ...suggestion,
            localizedTitle: localizeText(suggestion?.title),
            localizedContent: localizeText(suggestion?.content),
        })),
        [localizeText, unseenSuggestions]
    );
    const localizedActiveSuggestion = useMemo(() => {
        if (!activeSuggestion) return null;
        return localizedSuggestions.find((item) => item.id === activeSuggestion.id) || {
            ...activeSuggestion,
            localizedTitle: localizeText(activeSuggestion?.title),
            localizedContent: localizeText(activeSuggestion?.content),
        };
    }, [activeSuggestion, localizedSuggestions, localizeText]);
    const localizedSelectedNode = useMemo(() => {
        if (!selectedNode) return null;
        return localizedCanvasNodes.find((node) => node.id === selectedNode.id) || selectedNode;
    }, [localizedCanvasNodes, selectedNode]);
    const localizedLinkedNodes = useMemo(
        () => selectedNodeLinkedNodes.map((node) => ({
            ...node,
            localizedTitle: localizeText(node?.title),
            localizedContent: localizeText(node?.content),
        })),
        [localizeText, selectedNodeLinkedNodes]
    );
    const localizedAlignmentSummary = useMemo(() => ({
        ...alignmentSummary,
        sections: Object.fromEntries(
            Object.entries(alignmentSummary?.sections || {}).map(([key, items]) => [
                key,
                Array.isArray(items)
                    ? items.map((item) => ({
                        ...item,
                        localizedSummary: localizeText(item?.summary),
                    }))
                    : items,
            ])
        ),
    }), [alignmentSummary, localizeText]);
    const localizedAlignmentStrategy = useMemo(() => {
        if (!selectedAlignmentStrategy) return null;
        return {
            ...selectedAlignmentStrategy,
            sourceNode: selectedAlignmentStrategy.sourceNode
                ? {
                    ...selectedAlignmentStrategy.sourceNode,
                    localizedTitle: localizeText(selectedAlignmentStrategy.sourceNode.title),
                }
                : null,
            targetNode: selectedAlignmentStrategy.targetNode
                ? {
                    ...selectedAlignmentStrategy.targetNode,
                    localizedTitle: localizeText(selectedAlignmentStrategy.targetNode.title),
                }
                : null,
            localizedDiagnosis: localizeText(selectedAlignmentStrategy.diagnosis),
            localizedStrategy: localizeText(selectedAlignmentStrategy.strategy),
            localizedSteps: selectedAlignmentStrategy.steps?.map(localizeText) || [],
        };
    }, [localizeText, selectedAlignmentStrategy]);
    const localizedCandidatePreview = useMemo(() => {
        if (!pendingCandidatePreview) return null;
        return {
            ...pendingCandidatePreview,
            nodes: (pendingCandidatePreview.nodes || []).map((node) => ({
                ...node,
                data: {
                    ...node.data,
                    localizedTitle: localizeText(node?.data?.title),
                    localizedContent: localizeText(node?.data?.content),
                },
            })),
        };
    }, [localizeText, pendingCandidatePreview]);
    const localizedChatMessages = useMemo(
        () => chatMessages.map((message) => ({
            ...message,
            localizedContent: localizeText(message?.content),
        })),
        [chatMessages, localizeText]
    );
    const localizedConflictByNodeId = useMemo(
        () => Object.fromEntries(
            Object.entries(teamConflictAnalysis?.conflictByNodeId || {}).map(([nodeId, conflict]) => [
                nodeId,
                {
                    ...conflict,
                    linkedNodeTitles: (conflict?.linkedNodeTitles || []).map(localizeText),
                },
            ])
        ),
        [localizeText, teamConflictAnalysis?.conflictByNodeId]
    );
    const localizedConflictExplanations = useMemo(
        () => Object.fromEntries(
            Object.entries(conflictExplainResultByNodeId).map(([nodeId, explanation]) => [
                nodeId,
                {
                    ...explanation,
                    summary: localizeText(explanation?.summary),
                    whyDifferent: localizeText(explanation?.whyDifferent),
                    suggestedNextStep: localizeText(explanation?.suggestedNextStep),
                },
            ])
        ),
        [conflictExplainResultByNodeId, localizeText]
    );
    const meetingMemoryReadout = useMemo(
        () => buildMeetingMemoryReadout(meetingMemory, nodes),
        [meetingMemory, nodes]
    );

    useEffect(() => {
        setNodes((prevNodes) => {
            let hasChanges = false;
            const nextNodes = prevNodes.map((node) => {
                if (node?.type !== "thinkingNode") return node;
                const conflictMeta = teamConflictAnalysis?.conflictByNodeId?.[node.id] || null;
                const nextConflictState = conflictMeta?.state || "none";
                const nextConflictSummary = conflictMeta?.summary || "";
                const nextConflictLinkedNodeIds = conflictMeta?.linkedNodeIds || [];
                const currentConflictLinkedNodeIds = Array.isArray(node?.data?.conflictLinkedNodeIds)
                    ? node.data.conflictLinkedNodeIds
                    : [];
                const idsChanged =
                    currentConflictLinkedNodeIds.length !== nextConflictLinkedNodeIds.length ||
                    currentConflictLinkedNodeIds.some((value, index) => value !== nextConflictLinkedNodeIds[index]);
                const summaryChanged = (node?.data?.conflictSummary || "") !== nextConflictSummary;
                const stateChanged = (node?.data?.conflictState || "none") !== nextConflictState;
                if (!idsChanged && !summaryChanged && !stateChanged) return node;
                hasChanges = true;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        conflictState: nextConflictState,
                        conflictSummary: nextConflictSummary,
                        conflictLinkedNodeIds: nextConflictLinkedNodeIds,
                        conflictUpdatedAt: nextConflictState === "none"
                            ? ""
                            : node?.data?.conflictUpdatedAt || new Date().toISOString(),
                    },
                };
            });
            return hasChanges ? nextNodes : prevNodes;
        });
    }, [setNodes, teamConflictAnalysis]);

    useEffect(() => {
        if (isGraphHydrating) return;
        const previousStates = previousConflictStateRef.current || {};
        const nextStates = {};
        nodes.forEach((node) => {
            if (node?.type !== "thinkingNode") return;
            const nextConflict = teamConflictAnalysis?.conflictByNodeId?.[node.id] || null;
            const nextState = nextConflict?.state || "none";
            nextStates[node.id] = nextState;
        });
        if (Object.keys(previousStates).length === 0) {
            previousConflictStateRef.current = nextStates;
            return;
        }
        nodes.forEach((node) => {
            if (node?.type !== "thinkingNode") return;
            const nextConflict = teamConflictAnalysis?.conflictByNodeId?.[node.id] || null;
            const nextState = nextConflict?.state || "none";
            const previousState = previousStates[node.id] || "none";
            if (nextState !== "none" && previousState !== nextState) {
                void recordProjectActivity("node_conflict_detected", {
                    nodeId: node.id,
                    nodeTitle: node?.data?.title || "",
                    nodeType: node?.data?.category || "",
                    before: {
                        conflictState: previousState,
                    },
                    after: {
                        conflictState: nextState,
                        conflictSummary: nextConflict?.summary || "",
                    },
                    relatedNodeIds: nextConflict?.linkedNodeIds || [],
                    stage: normalizedStage,
                    metadata: {
                        conflictLabel: nextConflict?.label || "",
                    },
                });
            }
        });
        previousConflictStateRef.current = nextStates;
    }, [isGraphHydrating, nodes, normalizedStage, recordProjectActivity, teamConflictAnalysis]);

    useEffect(() => {
        if (selectedNodeId && !visibleCanvasNodeIds.has(selectedNodeId)) {
            const clearSelectionTimer = window.setTimeout(() => {
                setSelectedNodeId((currentId) => (currentId === selectedNodeId ? null : currentId));
            }, 0);
            return () => window.clearTimeout(clearSelectionTimer);
        }
    }, [selectedNodeId, visibleCanvasNodeIds]);

    // 선택된 노드를 기반으로 AI 의견이 항상 Workspace 상단에 보이도록
    // 자동 attachedNodes suggestion 을 만든다.
    useEffect(() => {
        if (!selectedNode) return;
        if (selectedAlignmentStrategy) return;
        // 사용자가 명시적으로 선택한 제안(activeSuggestion)이 있으면 건드리지 않는다.
        if (activeSuggestion && activeSuggestion._source !== "node-auto") return;
        if (activeSuggestion && activeSuggestion._source === "node-auto" && activeSuggestion.nodeId === selectedNode.id) {
            return;
        }

        const autoSuggestion = {
            id: `node-auto-${selectedNode.id}`,
            nodeId: selectedNode.id,
            _source: "node-auto",
            type: "attachedNodes",
            title: selectedNode.data?.title || "",
            content: selectedNode.data?.content || "",
            category: selectedNode.data?.category,
            phase: selectedNode.data?.phase,
            attached_nodes: [
                {
                    id: selectedNode.id,
                    title: selectedNode.data?.title || "",
                    content: selectedNode.data?.content || "",
                    category: selectedNode.data?.category,
                    phase: selectedNode.data?.phase,
                },
            ],
        };

        const syncDrawerTimer = window.setTimeout(() => {
            setActiveSuggestion(autoSuggestion);
            setDrawerMode("chat");
            setIsDrawerOpen(true);
        }, 0);

        return () => window.clearTimeout(syncDrawerTimer);
    }, [activeSuggestion, selectedAlignmentStrategy, selectedNode, setActiveSuggestion, setDrawerMode, setIsDrawerOpen]);

    const handlePromoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getNextVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const handleDemoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getPreviousVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const handleClearSelectedNode = useCallback(() => {
        setSelectedNodeId(null);
        setActiveSuggestion(null);
        setOpenConflictNodeId(null);
    }, [setActiveSuggestion]);

    const reasoningModeProfile = useMemo(() => getReasoningModeProfile(normalizedStage), [normalizedStage]);
    const workspaceCopy = useMemo(() => getWorkspaceCopy(uiLanguage), [uiLanguage]);
    const { handleInputSubmit } = useThinkingAiAnalyze({
        nodes,
        edges,
        stage,
        projectTitle,
        setNodes,
        setEdges,
        setSuggestions,
        setHighlightedNodeIds,
        setDrawerMode,
        setIsDrawerOpen,
        recordProjectActivity,
        animateViewportToNodes,
        setIsAnalyzing,
        setInputGuidance,
        uiLanguage,
        modelProfile,
        currentUserId,
        currentUserName,
    });
    const handleInputModeChange = useCallback((nextMode) => {
        setInputMode(nextMode);
        if (nextMode === "meeting") {
            setActiveSuggestion(null);
            resetChat?.();
            setDrawerMode("chat");
            setIsDrawerOpen(true);
        } else if (nextMode === "concept") {
            setDrawerMode("chat");
            setIsDrawerOpen(true);
        }
    }, [resetChat, setActiveSuggestion]);
    const prepareStarterInput = useCallback((value) => {
        setActiveSuggestion(null);
        resetChat?.();
        setSelectedNodeId(null);
        setInputMode("workspace");
        setDrawerMode("chat");
        setIsDrawerOpen(true);
        setChatInput(value);
        setHasStartedInput(true);
    }, [resetChat, setActiveSuggestion, setChatInput]);
    const handleStarterIntentSelect = useCallback(({ prompt } = {}) => {
        prepareStarterInput(String(prompt || ""));
    }, [prepareStarterInput]);
    const handleStarterImport = useCallback(({ fileName, content } = {}) => {
        const prefix = workspaceCopy.starter.importedPrefix;
        prepareStarterInput(`${prefix}: ${fileName || "notes"}\n\n${String(content || "")}`);
    }, [prepareStarterInput, workspaceCopy.starter.importedPrefix]);
    const handleBlankWorkspace = useCallback(() => {
        prepareStarterInput("");
    }, [prepareStarterInput]);
    const showWorkspaceStarter = !isGraphHydrating && !hasThinkingGraph && !hasStartedInput;
    const { handleMeetingCaptureSubmit } = useMeetingCaptureFlow({
        projectId,
        projectTitle,
        uiLanguage,
        modelProfile,
        nodes,
        edges,
        currentUserId,
        currentUserName,
        normalizedStage,
        meetingMemory,
        meetingMemoryReadout,
        meetingSessionIdRef,
        setNodes,
        setEdges,
        setMeetingMemory,
        setMeetingCaptureSummary,
        setIsMeetingCaptureLoading,
        setTeamContextError,
        setIsTeamContextPanelOpen,
        setHighlightedNodeIds,
        animateViewportToNodes,
        recordProjectActivity,
    });

    // 우측 Drawer 하단 입력창 동작:
    // - 기본(컨텍스트 없음)일 때: 사용자 입력을 기반으로 /api/analyze 를 호출해 새 노드 + 제안 생성
    // - 제안 카드/attachedNodes 컨텍스트가 있을 때: 해당 컨텍스트를 anchor 로 /api/chat 경로를 사용
    const handleRightDrawerSubmit = useCallback(async () => {
        const trimmedText = chatInput.trim();
        if (!trimmedText) return;
        setHasStartedInput(true);

        if (inputMode === "meeting" && !isMeetingCaptureLoading) {
            await handleMeetingCaptureSubmit(trimmedText);
            setChatInput("");
            return;
        }

        if (!activeSuggestion && !isAnalyzing) {
            await handleInputSubmit({
                text: trimmedText,
                selectedNode,
            });
            setChatInput("");
            return;
        }

        await handleDrawerChatSubmit();
    }, [activeSuggestion, chatInput, handleDrawerChatSubmit, handleInputSubmit, handleMeetingCaptureSubmit, inputMode, isAnalyzing, isMeetingCaptureLoading, selectedNode, setChatInput]);

    const focusNodesByIds = useCallback((nodeIds = []) => {
        const ids = Array.from(new Set((Array.isArray(nodeIds) ? nodeIds : []).filter(Boolean)));
        if (!ids.length) return;
        setCanvasMode("team");
        setHighlightedNodeIds(new Set(ids));
        const targetNodes = nodes.filter((node) => ids.includes(node.id));
        if (targetNodes.length) {
            animateViewportToNodes(targetNodes);
            const firstTarget = targetNodes.find((node) => node?.type === "thinkingNode");
            if (firstTarget?.id) {
                setSelectedNodeId(firstTarget.id);
                setDrawerMode("chat");
                setIsDrawerOpen(true);
            }
        }
    }, [animateViewportToNodes, nodes]);

    const handleAlignmentSignalSelect = useCallback((item) => {
        const ids = Array.from(new Set((Array.isArray(item?.nodeIds) ? item.nodeIds : []).filter(Boolean)));
        const relatedNodes = nodes.filter((node) => ids.includes(node.id) && node?.type === "thinkingNode");
        if (!relatedNodes.length) return;

        const context = buildAttachedNodesContext(relatedNodes);
        const signalLabel = item?.label || "Reasoning signal";
        const signalSummary = item?.summary || "";

        setCanvasMode("team");
        setHighlightedNodeIds(new Set(ids));
        animateViewportToNodes(relatedNodes);
        setSelectedNodeId(relatedNodes[0]?.id || null);
        setActiveSuggestion({
            ...context,
            id: `alignment-${item?.id || context.id}`,
            title: signalLabel,
            content: signalSummary || context.content,
            category: "Insight",
            initialUserMessage: `Help me resolve this reasoning alignment signal: "${signalSummary || signalLabel}". Suggest the smallest next comment, evidence, or clarification that would move it forward.`,
        });
        setDrawerMode("chat");
        setIsDrawerOpen(true);
        setHasStartedInput(true);
    }, [animateViewportToNodes, nodes, setActiveSuggestion]);

    const handleApplySelectedAlignmentStrategy = useCallback(() => {
        if (!selectedAlignmentStrategy?.edgeId) return;
        setManualAlignmentByEdgeId((prev) => ({
            ...prev,
            [selectedAlignmentStrategy.edgeId]: {
                state: "partially_aligned",
                label: "Partial alignment",
            },
        }));
        setSelectedAlignmentStrategy((prev) => (
            prev
                ? {
                    ...prev,
                    status: "applied",
                    relationshipLabel: "Partial alignment",
                }
                : prev
        ));
    }, [selectedAlignmentStrategy]);

    const handleRefineSelectedAlignmentStrategy = useCallback(() => {
        if (!selectedAlignmentStrategy) return;
        const relatedIds = [
            selectedAlignmentStrategy.sourceNode?.id,
            selectedAlignmentStrategy.targetNode?.id,
        ].filter(Boolean);
        const relatedNodes = nodes.filter((node) => relatedIds.includes(node.id) && node?.type === "thinkingNode");
        if (!relatedNodes.length) return;

        const context = buildAttachedNodesContext(relatedNodes);
        setActiveSuggestion({
            ...context,
            id: `alignment-refine-${selectedAlignmentStrategy.edgeId || context.id}`,
            _source: "alignment-strategy",
            title: "Resolve unresolved difference",
            content: selectedAlignmentStrategy.diagnosis,
            category: "Insight",
            initialUserMessage: selectedAlignmentStrategy.refinePrompt,
        });
        setDrawerMode("chat");
        setIsDrawerOpen(true);
        setHasStartedInput(true);
        setSelectedAlignmentStrategy((prev) => (prev ? { ...prev, status: "refining" } : prev));
    }, [nodes, selectedAlignmentStrategy, setActiveSuggestion]);

    const handleDismissSelectedAlignmentStrategy = useCallback(() => {
        setSelectedAlignmentStrategy(null);
    }, []);

    const {
        filteredTeamActivity,
        handleSelectTeamMember,
        handleSelectActivity,
        handleExplainTeamContext,
    } = useTeamContextSummary({
        activityLog,
        teamMembers,
        selectedTeamMemberId,
        setSelectedTeamMemberId,
        selectedActivityEventId,
        setSelectedActivityEventId,
        setTeamContextSummary,
        setIsTeamContextLoading,
        setTeamContextError,
        nodes,
        focusNodesByIds,
        normalizedStage,
        projectId,
        projectTitle,
        uiLanguage,
        modelProfile,
    });

    const handleGenerateAdminOverview = useCallback(async () => {
        if (!canAccessAdminView) return;
        const teamVisibility = new Set(["shared", "reviewed", "agreed"]);
        const thinkingNodes = nodes.filter((node) => node?.type === "thinkingNode");
        const nodeVisibilityById = new Map(
            thinkingNodes.map((node) => [node.id, normalizeVisibility(node?.data?.visibility)])
        );
        const relatedNodes = thinkingNodes.slice(0, 32).map((node) => {
            const visibility = nodeVisibilityById.get(node.id);
            const isTeamVisible = teamVisibility.has(visibility);
            return {
                id: node.id,
                title: isTeamVisible ? node?.data?.title || "Untitled node" : `Private ${node?.data?.category || "reasoning"} item`,
                content: isTeamVisible ? node?.data?.content || "" : "Private content withheld from the admin briefing.",
                category: node?.data?.category,
                phase: node?.data?.phase,
                visibility,
            };
        });
        const activityEvents = activityLog.slice(0, 24).map((item) => {
            const isTeamVisible = teamVisibility.has(nodeVisibilityById.get(item?.nodeId));
            return {
                id: item?.id,
                type: item?.type,
                timestamp: item?.timestamp,
                userId: item?.userId,
                userName: item?.userName,
                userRole: item?.userRole,
                nodeId: item?.nodeId,
                nodeTitle: isTeamVisible ? item?.nodeTitle : item?.nodeId ? "Private reasoning item" : item?.nodeTitle,
                relatedNodeIds: item?.relatedNodeIds,
            };
        });

        setIsAdminOverviewLoading(true);
        setAdminOverviewError("");
        try {
            const result = await summarizeTeamContext({
                scope: "project",
                projectId,
                projectTitle,
                activityEvents,
                relatedNodes,
                stage: normalizedStage,
                uiLanguage,
                modelProfile,
            });
            setAdminOverviewSummary(result);
        } catch (error) {
            setAdminOverviewError(
                error?.response?.data?.error ||
                error?.message ||
                workspaceCopy.errors.teamContext
            );
        } finally {
            setIsAdminOverviewLoading(false);
        }
    }, [
        activityLog,
        canAccessAdminView,
        modelProfile,
        nodes,
        normalizedStage,
        projectId,
        projectTitle,
        uiLanguage,
        workspaceCopy.errors.teamContext,
    ]);

    const handleToggleTeamContextPanel = useCallback(() => {
        setIsTeamContextPanelOpen((prev) => !prev);
    }, []);

    const handleToggleConflictPopover = useCallback((nodeId, nextOpen) => {
        if (nextOpen) {
            setSelectedNodeId(nodeId || null);
        }
        setOpenConflictNodeId(nextOpen ? nodeId : null);
    }, []);

    const handleExplainConflict = useCallback(async (nodeId) => {
        const conflictMeta = teamConflictAnalysis?.conflictByNodeId?.[nodeId];
        const selectedConflictNode = nodes.find((node) => node?.id === nodeId && node?.type === "thinkingNode");
        if (!conflictMeta || !selectedConflictNode) return;
        const conflictingNodes = nodes
            .filter((node) => conflictMeta.linkedNodeIds.includes(node.id) && node?.type === "thinkingNode")
            .map((node) => ({
                id: node.id,
                title: node?.data?.title || "",
                content: node?.data?.content || "",
                category: node?.data?.category,
                phase: node?.data?.phase,
            }));
        const surroundingNodeIds = new Set([
            ...getRelatedNodeIds(nodeId, edges),
            ...conflictMeta.linkedNodeIds.flatMap((relatedId) => getRelatedNodeIds(relatedId, edges)),
        ]);
        conflictMeta.linkedNodeIds.forEach((relatedId) => surroundingNodeIds.delete(relatedId));
        surroundingNodeIds.delete(nodeId);
        const surroundingNodes = nodes
            .filter((node) => surroundingNodeIds.has(node.id) && node?.type === "thinkingNode")
            .slice(0, 6)
            .map((node) => ({
                id: node.id,
                title: node?.data?.title || "",
                content: node?.data?.content || "",
                category: node?.data?.category,
                phase: node?.data?.phase,
            }));
        const relevantActivity = (Array.isArray(activityLog) ? activityLog : [])
            .filter((item) => item?.nodeId === nodeId || (item?.relatedNodeIds || []).some((relatedId) => conflictMeta.linkedNodeIds.includes(relatedId)))
            .slice(0, 6);

        setConflictExplainLoadingByNodeId((prev) => ({
            ...prev,
            [nodeId]: true,
        }));
        try {
            const result = await explainConflict({
                projectTitle,
                stage: normalizedStage,
                selectedNode: {
                    id: selectedConflictNode.id,
                    title: selectedConflictNode?.data?.title || "",
                    content: selectedConflictNode?.data?.content || "",
                    category: selectedConflictNode?.data?.category,
                    phase: selectedConflictNode?.data?.phase,
                },
                conflictingNodes,
                surroundingNodes,
                activityEvents: relevantActivity,
                uiLanguage,
                modelProfile,
            });
            setConflictExplainResultByNodeId((prev) => ({
                ...prev,
                [nodeId]: result,
            }));
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.message ||
                workspaceCopy.conflict.failed;
            setConflictExplainResultByNodeId((prev) => ({
                ...prev,
                [nodeId]: {
                    summary: message,
                    whyDifferent: workspaceCopy.conflict.unavailable,
                    assumptionGap: "",
                    riskIfIgnored: "",
                    suggestedNextStep: workspaceCopy.conflict.retry,
                },
            }));
        } finally {
            setConflictExplainLoadingByNodeId((prev) => ({
                ...prev,
                [nodeId]: false,
            }));
        }
    }, [activityLog, edges, modelProfile, nodes, normalizedStage, projectTitle, teamConflictAnalysis, uiLanguage, workspaceCopy.conflict]);

    return (
        <div className="w-full h-screen relative flex flex-col overflow-hidden bg-slate-50">
            <div
                className="pointer-events-none absolute bottom-7 left-6 z-[20] flex h-[24.5px] w-[157px] items-center whitespace-nowrap"
                style={{
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 600,
                    fontSize: "13.59805px",
                    lineHeight: "180%",
                    letterSpacing: "0.14em",
                    color: "#4B5D7B",
                }}
            >
                THINKING MACHINE
            </div>
            <TopBar
                stage={normalizedStage}
                onStageChange={handleStageChange}
                projectTitle={projectTitle}
                onProjectTitleChange={setProjectTitle}
                projectMetaHref={projectMetaHref}
                projectMetaLabel={workspaceCopy.topBar.projectWorkspace}
                uiLanguage={uiLanguage}
                canvasMode={canvasMode}
                onCanvasModeChange={setCanvasMode}
                drawerMode={drawerMode}
                onDrawerModeChange={handleDrawerModeChange}
                isDrawerOpen={isDrawerOpen}
            />

            <main className="flex-1 w-full h-full relative">
                {!showWorkspaceStarter && !isAdminView ? (
                    <LeftTeamContextPanel
                        isOpen={isTeamContextPanelOpen}
                        teamMembers={teamMembers}
                        activityItems={filteredTeamActivity}
                        selectedMemberId={selectedTeamMemberId}
                        selectedActivityId={selectedActivityEventId}
                        summary={teamContextSummary}
                        isSummaryLoading={isTeamContextLoading}
                        summaryError={teamContextError}
                        meetingMemoryReadout={meetingMemoryReadout}
                        isMeetingMemoryLoading={isMeetingCaptureLoading}
                        currentUserId={currentUserId}
                        onToggle={handleToggleTeamContextPanel}
                        onSelectMember={handleSelectTeamMember}
                        onSelectActivity={handleSelectActivity}
                        onExplainContext={handleExplainTeamContext}
                        onFocusNode={(nodeId) => focusNodesByIds([nodeId])}
                        uiLanguage={uiLanguage}
                    />
                ) : null}
                {!hasThinkingGraph && !localizedCandidateCanvasPreviewNodes.length ? (
                    <div className="tm-canvas-bg h-full w-full" data-stage={stage}>
                        <div className="absolute inset-0 z-[5]" />
                    </div>
                ) : (
                    <>
                        <NodeMap
                            nodes={[...localizedCanvasNodes, ...localizedCandidateCanvasPreviewNodes]}
                            edges={[...decoratedCanvasEdges, ...candidateCanvasPreviewEdges]}
                            onNodesChange={filteredOnNodesChange}
                            onEdgesChange={onEdgesChange}
                            highlightedNodeIds={highlightedNodeIds}
                            onNodeDragStart={handleNodeDragStart}
                            onNodeDrag={handleNodeDragUpdate}
                            onNodeDragStop={handleNodeDragStop}
                            onInit={handleFlowInit}
                            onSelectionChange={handleNodeSelectionChange}
                            selectionBoxEnabled={selectionBoxEnabled}
                            isCanvasInteractive={isCanvasInteractive}
                            draftHandlers={{
                                onPostitChangeText: handlePostitChangeText,
                                onImagePick: handleImagePick,
                                onImageChangeCaption: handleImageChangeCaption,
                                onDraftSubmit: handleDraftSubmit,
                                onToggleIdeaGroup: toggleIdeaGroupMode,
                            }}
                            draftSubmittingIds={draftSubmittingIds}
                            canvasStage={stage}
                            conflictByNodeId={localizedConflictByNodeId}
                            openConflictNodeId={openConflictNodeId}
                            conflictExplainResultByNodeId={localizedConflictExplanations}
                            conflictExplainLoadingByNodeId={conflictExplainLoadingByNodeId}
                            onToggleConflictPopover={handleToggleConflictPopover}
                            onExplainConflict={handleExplainConflict}
                            uiLanguage={uiLanguage}
                        />

                    </>
                )}

                <AnimatePresence>
                    {isAdminView && !showWorkspaceStarter ? (
                        <AdminOverviewPanel
                            projectTitle={projectTitle}
                            nodes={nodes}
                            activityLog={activityLog}
                            teamMembers={teamMembers}
                            alignmentCounts={adminAlignmentAnalysis?.counts}
                            currentUserId={currentUserId}
                            summary={adminOverviewSummary}
                            isSummaryLoading={isAdminOverviewLoading}
                            summaryError={adminOverviewError}
                            onGenerateSummary={handleGenerateAdminOverview}
                            onClose={() => setIsAdminMode(false)}
                            uiLanguage={uiLanguage}
                        />
                    ) : null}
                </AnimatePresence>

                {showWorkspaceStarter ? (
                    <WorkspaceStarter
                        uiLanguage={uiLanguage}
                        onUiLanguageChange={setUiLanguage}
                        onSelectIntent={handleStarterIntentSelect}
                        onBlankWorkspace={handleBlankWorkspace}
                        onImportWork={handleStarterImport}
                    />
                ) : null}

                {showDraftConvertPrompt && (
                    <div className="pointer-events-none absolute inset-x-0 top-20 z-[75] flex justify-center">
                        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[12px] font-semibold text-slate-700 shadow-[0_12px_26px_rgba(0,0,0,0.14)] backdrop-blur-[12px]">
                            <span>
                                {uiLanguage === "en"
                                    ? `${workspaceCopy.draft.convertPrefix} ${selectedDraftIds.length} ${workspaceCopy.draft.convertSuffix}`
                                    : `${workspaceCopy.draft.convertPrefix} ${selectedDraftIds.length}${workspaceCopy.draft.convertSuffix}`}
                            </span>
                            <button
                                type="button"
                                onClick={() => void convertDraftsToGroup(draftConvertIdsRef.current)}
                                className="inline-flex items-center justify-center rounded-full bg-teal-500 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-teal-600 disabled:opacity-55"
                                disabled={isAnalyzing}
                                aria-label={workspaceCopy.draft.confirm}
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDraftConvertPrompt(false)}
                                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-white/80"
                                aria-label={workspaceCopy.draft.cancel}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {isDrawerOpen && !showWorkspaceStarter && !isAdminView ? (
                        <RightAgentDrawer
                            isOpen={isDrawerOpen}
                            mode={drawerMode}
                            stage={normalizedStage}
                            suggestions={localizedSuggestions}
                            onStageChange={handleStageChange}
                            activeSuggestion={localizedActiveSuggestion}
                            selectedNode={localizedSelectedNode}
                            linkedNodes={localizedLinkedNodes}
	                            candidateGraph={localizedCandidatePreview}
	                            alignmentSummary={localizedAlignmentSummary}
	                            alignmentStrategy={localizedAlignmentStrategy}
	                            inputGuidance={inputGuidance}
	                            currentUserRole={effectiveCurrentUserRole}
                            projectLastUpdated={projectLastUpdated}
                            activityLog={activityLog}
                            lastRefreshedAt={lastRefreshedAt}
                            chatMessages={localizedChatMessages}
                            chatInput={chatInput}
                            isChatLoading={isAnalyzing || isChatLoading}
                            isChatConverting={isChatConverting}
                            chatConversionError={chatConversionError}
                            inputMode={inputMode}
                            onInputModeChange={handleInputModeChange}
                            meetingCaptureSummary={meetingCaptureSummary}
                            isMeetingCaptureLoading={isMeetingCaptureLoading}
                            onChatInputChange={(value) => {
                                if (String(value || "").trim().length > 0) {
                                    setHasStartedInput(true);
                                }
                                setChatInput(value);
                            }}
                            onUseGuidancePrompt={(prompt) => {
                                setChatInput(prompt);
                                setInputGuidance(null);
                            }}
                            onDismissInputGuidance={() => setInputGuidance(null)}
                            onChatSubmit={handleRightDrawerSubmit}
                            conceptMessages={conceptMessages}
                            conceptInput={conceptInput}
                            isConceptLoading={isConceptLoading}
                            conceptError={conceptError}
                            onConceptInputChange={(value) => {
                                if (String(value || "").trim()) setHasStartedInput(true);
                                setConceptInput(value);
                            }}
                            onConceptSubmit={(prompt) => {
                                setHasStartedInput(true);
                                void handleConceptSubmit(prompt);
                            }}
                            onConceptReset={resetConceptStudio}
                            onCommitCandidateNodes={handleCommitCandidateNodes}
                            onCommitCandidateNodesAsPrivate={handleCommitCandidateNodesAsPrivate}
                            onDiscardCandidateNodes={handleDiscardCandidateNodes}
                            onPromoteSelectedNode={handlePromoteSelectedNode}
                            onDemoteSelectedNode={handleDemoteSelectedNode}
                            onSetNodeVisibility={handleSetNodeVisibility}
	                            onChatContextSelect={handleDrawerSuggestionSelect}
	                            onAlignmentSignalSelect={handleAlignmentSignalSelect}
	                            onApplyAlignmentStrategy={handleApplySelectedAlignmentStrategy}
	                            onRefineAlignmentStrategy={handleRefineSelectedAlignmentStrategy}
	                            onDismissAlignmentStrategy={handleDismissSelectedAlignmentStrategy}
	                            modeLabel={reasoningModeProfile.label}
                            candidateHint={uiLanguage === "en" ? reasoningModeProfile.candidateHint : workspaceCopy.candidate.defaultHint}
                            selectedNodeQuickActions={reasoningModeProfile.selectedNodeActions}
                            uiLanguage={uiLanguage}
                            onUiLanguageChange={setUiLanguage}
                            modelProfile={modelProfile}
                            onModelProfileChange={setModelProfile}
                            canvasMode={canvasMode}
                            onCanvasModeChange={setCanvasMode}
                            canAccessAdminView={canAccessAdminView}
                            isAdminView={isAdminView}
                            onAdminViewChange={setIsAdminMode}
                            chatButtonRef={chatButtonRef}
                            chatDropZoneRef={chatDropZoneRef}
                            isChatDropActive={isChatDropActive}
                            onClearSelectedNode={handleClearSelectedNode}
                            onAddPostit={createPostitDraft}
                            onAddImage={createImageDraft}
                            showDrawerHint={!hasStartedInput && !nodes.some((node) => node?.type === "thinkingNode")}
                        />
                    ) : null}
                </AnimatePresence>

                <AnimatePresence>
                    {ghostDrag && (
                        <motion.div
                            key="ghost-drag"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{
                                opacity: ghostDrag.phase === "dropping" ? 0 : 0.55,
                                scale: ghostDrag.phase === "dropping" ? 0.72 : 1,
                                x: (ghostDrag.phase === "dropping" ? ghostDrag.targetX : ghostDrag.x) - 90,
                                y: (ghostDrag.phase === "dropping" ? ghostDrag.targetY : ghostDrag.y) - 40,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", damping: 26, stiffness: 420 }}
                            className="pointer-events-none fixed left-0 top-0 z-[90]"
                            style={{ width: 180, height: 80 }}
                        >
                            <div
                                className="h-full w-full rounded-[26px] border border-white/70 bg-white/35 shadow-[0_16px_38px_rgba(0,0,0,0.14)] backdrop-blur-[10px]"
                                aria-hidden
                            >
                                <div className="flex h-full w-full items-center justify-center px-4 text-[12px] font-semibold text-slate-800/80">
                                    {ghostDrag.count > 1 ? `${ghostDrag.count} nodes` : "1 node"}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
