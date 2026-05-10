"use client";

import { useMemo } from "react";
import { normalizeNodeCategory } from "@/lib/thinkingMachine/nodeMeta";

export function useNodePorts({
  nodes,
  edges,
  highlightedNodeIds,
  draftHandlers,
  draftSubmittingIds,
  conflictByNodeId,
  openConflictNodeId,
  conflictExplainResultByNodeId,
  conflictExplainLoadingByNodeId,
  onToggleConflictPopover,
  onExplainConflict,
}) {
  const portVisibilityByNode = useMemo(() => {
    const map = new Map();
    edges.forEach((edge) => {
      if (edge?.source) {
        const current = map.get(edge.source) || { hasLeftPort: false, hasRightPort: false };
        current.hasRightPort = true;
        map.set(edge.source, current);
      }
      if (edge?.target) {
        const current = map.get(edge.target) || { hasLeftPort: false, hasRightPort: false };
        current.hasLeftPort = true;
        map.set(edge.target, current);
      }
    });
    return map;
  }, [edges]);

  const linkedCategoriesByNode = useMemo(() => {
    const nodeCategoryById = new Map(
      nodes
        .filter((node) => node?.id && node?.type === "thinkingNode")
        .map((node) => [node.id, normalizeNodeCategory(node?.data?.category)])
    );
    const map = new Map();
    const addLinkedCategory = (nodeId, linkedNodeId) => {
      const linkedCategory = nodeCategoryById.get(linkedNodeId);
      if (!nodeId || !linkedCategory) return;
      const categories = map.get(nodeId) || [];
      categories.push(linkedCategory);
      map.set(nodeId, categories);
    };

    edges.forEach((edge) => {
      addLinkedCategory(edge?.source, edge?.target);
      addLinkedCategory(edge?.target, edge?.source);
    });

    return map;
  }, [edges, nodes]);

  const displayNodes = useMemo(() => {
    const hasHighlightSet = highlightedNodeIds instanceof Set;
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        hasLeftPort: portVisibilityByNode.get(n.id)?.hasLeftPort || false,
        hasRightPort: portVisibilityByNode.get(n.id)?.hasRightPort || false,
        ...(n.type === "postitDraft"
          ? {
              onChangeText: draftHandlers?.onPostitChangeText,
              onSubmit: draftHandlers?.onDraftSubmit,
              isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
            }
          : {}),
        ...(n.type === "imageDraft"
          ? {
              onPickImage: draftHandlers?.onImagePick,
              onChangeCaption: draftHandlers?.onImageChangeCaption,
              onSubmit: draftHandlers?.onDraftSubmit,
              isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
            }
          : {}),
        ...(n.type === "ideaGroup"
          ? {
              onToggle: draftHandlers?.onToggleIdeaGroup,
            }
          : {}),
        ...(n.type === "thinkingNode"
          ? {
              nodeId: n.id,
              linkedNodeCategories: linkedCategoriesByNode.get(n.id) || [],
              conflictLinkedNodeTitles: conflictByNodeId?.[n.id]?.linkedNodeTitles || [],
              conflictExplanation: conflictExplainResultByNodeId?.[n.id] || null,
              isConflictPopoverOpen: openConflictNodeId === n.id,
              isConflictExplainLoading: Boolean(conflictExplainLoadingByNodeId?.[n.id]),
              onToggleConflictPopover,
              onExplainConflict,
            }
          : {}),
      },
      className: [n.className || "", hasHighlightSet && highlightedNodeIds.has(n.id) ? "node-highlighted" : ""]
        .filter(Boolean)
        .join(" "),
    }));
  }, [
    conflictByNodeId,
    conflictExplainLoadingByNodeId,
    conflictExplainResultByNodeId,
    draftHandlers,
    draftSubmittingIds,
    highlightedNodeIds,
    linkedCategoriesByNode,
    nodes,
    onExplainConflict,
    onToggleConflictPopover,
    openConflictNodeId,
    portVisibilityByNode,
  ]);

  return { displayNodes };
}
