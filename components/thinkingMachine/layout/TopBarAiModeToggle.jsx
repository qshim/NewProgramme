"use client";

const TOPBAR_META_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "130%",
  letterSpacing: "-0.176px",
};

export default function TopBarAiModeToggle({ mode, flow, onModeClick, onFlowClick }) {
  return (
    <div className="pointer-events-auto flex w-full items-start justify-end">
      <div
        className="inline-flex h-[27px] items-center rounded-[25px] px-[6px] shadow-[0.5px_1px_5px_rgba(0,0,0,0.1)]"
        style={{ background: "#F6F6F2" }}
      >
        <span
          className="mr-2 text-[10px] font-semibold text-[#929B94]"
          style={TOPBAR_META_TEXT_STYLE}
        >
          AI mode
        </span>
        <button
          type="button"
          onClick={() => onModeClick("research")}
          className="inline-flex h-[22px] w-[70px] items-center justify-center rounded-[25px] transition"
          style={{
            background: mode === "research" ? "#1F2937" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: mode === "research" ? "#FFFFFF" : "#4B5563",
          }}
        >
          Research
        </button>
        <button
          type="button"
          onClick={() => onModeClick("design")}
          className="ml-[2px] inline-flex h-[22px] w-[64px] items-center justify-center rounded-[25px] transition"
          style={{
            background: mode === "design" ? "#1F2937" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: mode === "design" ? "#FFFFFF" : "#4B5563",
          }}
        >
          Design
        </button>
        <span className="mx-1 text-[10px] text-slate-400">·</span>
        <button
          type="button"
          onClick={() => onFlowClick("diverge")}
          className="inline-flex h-[22px] w-[72px] items-center justify-center rounded-[25px] transition"
          style={{
            background: flow === "diverge" ? "#2563EB" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: flow === "diverge" ? "#FFFFFF" : "#4B5563",
          }}
        >
          Diverge
        </button>
        <button
          type="button"
          onClick={() => onFlowClick("converge")}
          className="ml-[2px] inline-flex h-[22px] w-[80px] items-center justify-center rounded-[25px] transition"
          style={{
            background: flow === "converge" ? "#2563EB" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: flow === "converge" ? "#FFFFFF" : "#4B5563",
          }}
        >
          Converge
        </button>
      </div>
    </div>
  );
}

