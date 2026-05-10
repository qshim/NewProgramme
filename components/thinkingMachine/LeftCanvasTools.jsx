"use client";

import { Lock, ScanSearch, Unlock, ZoomIn, ZoomOut } from "lucide-react";

const COPY = {
  en: {
    label: "Canvas tools",
    view: "View",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Fit",
    lock: "Lock",
    unlock: "Unlock",
  },
  ko: {
    label: "캔버스 도구",
    view: "뷰",
    zoomIn: "확대",
    zoomOut: "축소",
    fit: "맞춤",
    lock: "잠금",
    unlock: "잠금 해제",
  },
};

function IconButton({ onClick, label, children, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`group inline-flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-[0.97] ${
        active
          ? "bg-slate-800 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
          : "bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.10)] ring-1 ring-slate-200 hover:bg-slate-50 hover:shadow-[0_12px_26px_rgba(15,23,42,0.14)] hover:scale-[1.04]"
      }`}
    >
      {children}
    </button>
  );
}

export default function LeftCanvasTools({
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleInteractive,
  isInteractive = true,
  uiLanguage = "en",
}) {
  const copy = COPY[uiLanguage] || COPY.en;

  return (
    <div className="pointer-events-none absolute bottom-5 left-6 z-[72]">
      <div className="pointer-events-auto rounded-[24px] border border-white/70 bg-white/84 p-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-[14px]">
        <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-normal text-slate-500">
          {copy.label}
        </div>
        <div className="flex flex-col gap-3 rounded-[18px] bg-slate-50/90 px-2 py-2.5">
          <div>
            <div className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {copy.view}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <IconButton onClick={onZoomIn} label={copy.zoomIn}>
                <ZoomIn className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton onClick={onZoomOut} label={copy.zoomOut}>
                <ZoomOut className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton onClick={onFitView} label={copy.fit}>
                <ScanSearch className="h-4.5 w-4.5" />
              </IconButton>
              <IconButton onClick={onToggleInteractive} label={isInteractive ? copy.lock : copy.unlock} active={!isInteractive}>
                {isInteractive ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4.5 w-4.5" />}
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
