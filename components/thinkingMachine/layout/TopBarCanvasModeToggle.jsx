"use client";

const TOPBAR_META_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "130%",
  letterSpacing: "-0.176px",
};

export default function TopBarCanvasModeToggle({ canvasMode, onCanvasModeChange }) {
  return (
    <div className="pointer-events-auto flex w-full items-start justify-end">
      <div
        className="inline-flex h-[27px] w-[130px] items-center rounded-[25px] px-[3px] shadow-[0.5px_1px_5px_rgba(0,0,0,0.1)]"
        style={{ background: "#F6F6F2" }}
      >
        <button
          type="button"
          onClick={() => onCanvasModeChange?.("personal")}
          className="inline-flex h-[22px] w-[64px] items-center justify-center rounded-[25px] transition"
          style={{
            background: canvasMode === "personal" ? "#7BA592" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: canvasMode === "personal" ? "#FFFFFF" : "#929B94",
          }}
        >
          Personal
        </button>
        <button
          type="button"
          onClick={() => onCanvasModeChange?.("team")}
          className="inline-flex h-[22px] w-[60px] items-center justify-center rounded-[25px] transition"
          style={{
            background: canvasMode === "team" ? "#7BA592" : "transparent",
            fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
            fontStyle: "normal",
            fontWeight: 700,
            fontSize: "10.3838px",
            lineHeight: "180%",
            color: canvasMode === "team" ? "#FFFFFF" : "#929B94",
          }}
        >
          Team
        </button>
      </div>
    </div>
  );
}

