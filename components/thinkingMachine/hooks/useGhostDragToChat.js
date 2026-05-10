import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildAttachedNodesContext,
  getPointerClientPoint,
  isPointInRect,
  isPointInRightRegion,
  isPointNearRect,
} from "@/components/thinkingMachine/utils/chatDropGeometry";

export function useGhostDragToChat({
  nodes,
  setNodes,
  baseOnNodesChange,
  setAttachedNodes,
  setActiveSuggestion,
  setDrawerMode,
  setIsDrawerOpen,
} = {}) {
  const [isChatDropActive, setIsChatDropActive] = useState(false);
  const [ghostDrag, setGhostDrag] = useState(null); // {x,y,count,phase:"dragging"|"dropping", targetX?, targetY?}

  const chatButtonRef = useRef(null);
  const chatDropZoneRef = useRef(null);
  const didAutoOpenOnDragRef = useRef(false);
  const dragOriginRef = useRef(null); // { ids: string[], positions: Map<id, {x,y}> }
  const isNodeDraggingRef = useRef(false);
  const dragStartPointRef = useRef(null); // {x,y}
  const didShowGhostRef = useRef(false);
  const ghostCaptureRef = useRef(false);

  const isPointNearChatButton = (pt) => {
    const el = chatButtonRef.current;
    if (!pt || !el?.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    return isPointNearRect(pt, rect, 28);
  };

  const getChatDropZoneRect = () => {
    const el = chatDropZoneRef.current;
    if (!el?.getBoundingClientRect) return null;
    return el.getBoundingClientRect();
  };

  const isPointInChatRegion = (pt) => {
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    // 오른쪽 영역 진입만으로도 Chat 모드가 자연스럽게 열리도록 넓게 잡음
    return isPointInRightRegion(pt, width, 240);
  };

  const isPointInChatAttachZone = (pt) => {
    if (!pt) return false;
    if (isPointNearChatButton(pt)) return true;
    const rect = getChatDropZoneRect();
    // Drawer가 열려 있으면 실제 DropZone 전체(왼쪽 끝까지)를 인정
    if (rect && isPointInRect(pt, rect, 24)) return true;
    // Drawer가 닫혀 있거나 rect 측정이 어려운 상황에선 화면 오른쪽 영역으로 폴백
    return isPointInChatRegion(pt);
  };

  /** 고스트 캡처(노드 고정 + position change 차단)는 채팅 UI 근처에서만 — 오른쪽 넓은 gutter만으로는 켜지 않음 */
  const isPointInStrictGhostCaptureZone = (pt) => {
    if (!pt) return false;
    if (isPointNearChatButton(pt)) return true;
    const rect = getChatDropZoneRect();
    return Boolean(rect && isPointInRect(pt, rect, 24));
  };

  const isPointInChatDropZone = (pt) => {
    const rect = getChatDropZoneRect();
    if (rect) return isPointInRect(pt, rect, 24);
    // Drawer가 아직 열리지 않았을 때도 오른쪽 영역이면 드롭 허용
    return isPointInChatRegion(pt);
  };

  const getDropAnimationTarget = () => {
    const rect = getChatDropZoneRect();
    if (rect) return { x: rect.left + rect.width * 0.55, y: rect.top + 120 };
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    const height = typeof window !== "undefined" ? window.innerHeight : 0;
    return { x: Math.max(0, width - 180), y: Math.max(0, height * 0.35) };
  };

  // position 변경을 막지 않음 — 노드·엣지가 함께 부드럽게 따라가도록 React Flow 상태를 그대로 반영
  const filteredOnNodesChange = useMemo(() => {
    return (changes) => {
      baseOnNodesChange?.(changes);
    };
  }, [baseOnNodesChange]);

  const handleNodeDragUpdate = (event) => {
      const pt = getPointerClientPoint(event);
      const nearAttach = isPointInChatAttachZone(pt);
      setIsChatDropActive(Boolean(nearAttach));

      if (pt) {
        const start = dragStartPointRef.current;
        const dx = start ? pt.x - start.x : 0;
        const dy = start ? pt.y - start.y : 0;
        const dist2 = dx * dx + dy * dy;
        const movedEnough = dist2 >= 36; // 6px threshold

        const origin = dragOriginRef.current;
        const count = origin?.ids?.length || 1;
        const inGhostZone = isPointInStrictGhostCaptureZone(pt);
        // 고스트 드래그는 채팅 버튼/드롭존 위에서만 캡처 (화면 오른쪽 넓은 영역만으로는 캡처하지 않음)
        if (!ghostCaptureRef.current && movedEnough && inGhostZone) {
          ghostCaptureRef.current = true;
        }

        if (ghostCaptureRef.current && movedEnough) {
          didShowGhostRef.current = true;
          setGhostDrag((prev) => {
            if (prev?.phase === "dropping") return prev;
            return { x: pt.x, y: pt.y, count, phase: "dragging" };
          });
        }
      }

      if (nearAttach && !didAutoOpenOnDragRef.current) {
        didAutoOpenOnDragRef.current = true;
        setDrawerMode?.("chat");
        setIsDrawerOpen?.(true);
      }
  };

  const handleNodeDragStart = useCallback(
    (event, node) => {
      didAutoOpenOnDragRef.current = false;
      isNodeDraggingRef.current = true;
      ghostCaptureRef.current = false;
      didShowGhostRef.current = false;
      const selectedNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => n?.selected);
      const ids =
        node?.selected && selectedNodes.length ? selectedNodes.map((n) => n.id) : node?.id ? [node.id] : [];
      const positions = new Map();
      (Array.isArray(nodes) ? nodes : []).forEach((n) => {
        if (ids.includes(n.id)) positions.set(n.id, { x: n.position?.x ?? 0, y: n.position?.y ?? 0 });
      });
      dragOriginRef.current = { ids, positions };

      const pt = getPointerClientPoint(event);
      if (pt) dragStartPointRef.current = { x: pt.x, y: pt.y };
      // 고스트는 실제로 일정 거리 이상 움직였을 때만 보여준다 (클릭/탭 오작동 방지)
      setGhostDrag(null);
    },
    [nodes]
  );

  const handleNodeDragStop = (event, node) => {
      const pt = getPointerClientPoint(event);
      const shouldAttach = isPointInChatDropZone(pt);
      setIsChatDropActive(false);
      didAutoOpenOnDragRef.current = false;
      isNodeDraggingRef.current = false;
      dragStartPointRef.current = null;

      // 드롭존 밖에서 놓으면: 사용자가 드래그한 최종 위치 유지 (고스트만 정리)
      if (!shouldAttach) {
        setGhostDrag(null);
        window.setTimeout(() => {
          ghostCaptureRef.current = false;
        }, 0);
        return;
      }

      const selectedNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => n?.selected);
      const draggedNode = node ? (nodes.find((n) => n.id === node.id) || node) : null;
      const toAttach =
        draggedNode?.selected && selectedNodes.length ? selectedNodes : draggedNode ? [draggedNode] : [];
      if (toAttach.length === 0) {
        setGhostDrag(null);
        window.setTimeout(() => {
          ghostCaptureRef.current = false;
        }, 0);
        return;
      }

      const context = buildAttachedNodesContext(toAttach);

      // 채팅에 붙일 때만 드래그 시작 좌표로 되돌림 — 캔버스 레이아웃은 유지하고 맥락만 전달
      const origin = dragOriginRef.current;
      if (origin?.positions && origin?.ids?.length) {
        const idSet = new Set(origin.ids);
        setNodes?.((prev) =>
          prev.map((n) => {
            if (!idSet.has(n.id)) return n;
            const pos = origin.positions.get(n.id);
            if (!pos) return n;
            if (n.position?.x === pos.x && n.position?.y === pos.y) return n;
            return { ...n, position: { x: pos.x, y: pos.y } };
          })
        );
      }

      setAttachedNodes?.(context.attached_nodes);
      setActiveSuggestion?.(context);
      setDrawerMode?.("chat");
      setIsDrawerOpen?.(true);

      // 고스트 흡수 애니메이션 (고스트가 실제로 표시된 경우에만)
      if (pt && didShowGhostRef.current) {
        const target = getDropAnimationTarget();
        setGhostDrag({
          x: pt.x,
          y: pt.y,
          count: context.attached_nodes.length,
          phase: "dropping",
          targetX: target.x,
          targetY: target.y,
        });
        window.setTimeout(() => setGhostDrag(null), 260);
      } else {
        setGhostDrag(null);
      }

      window.setTimeout(() => {
        ghostCaptureRef.current = false;
      }, 0);
  };

  useEffect(() => {
    if (!ghostDrag) return undefined;
    const clear = () => {
      setGhostDrag(null);
      setIsChatDropActive(false);
      isNodeDraggingRef.current = false;
      didAutoOpenOnDragRef.current = false;
      dragStartPointRef.current = null;
    };
    window.addEventListener("mouseup", clear);
    window.addEventListener("touchend", clear);
    window.addEventListener("touchcancel", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("mouseup", clear);
      window.removeEventListener("touchend", clear);
      window.removeEventListener("touchcancel", clear);
      window.removeEventListener("blur", clear);
    };
  }, [ghostDrag]);

  return {
    isChatDropActive,
    ghostDrag,
    chatButtonRef,
    chatDropZoneRef,
    filteredOnNodesChange,
    handleNodeDragStart,
    handleNodeDragUpdate,
    handleNodeDragStop,
  };
}
