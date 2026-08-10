"use client";

import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Compass,
  FileText,
  Focus,
  Scale,
  Upload,
} from "lucide-react";
import { getWorkspaceCopy } from "@/components/thinkingMachine/i18n/workspaceCopy";

const INTENTS = [
  {
    id: "frame",
    icon: Focus,
    accent: "bg-[#E88D78]",
    iconClassName: "bg-[#FBE9E4] text-[#A94F3C]",
  },
  {
    id: "evidence",
    icon: FileText,
    accent: "bg-[#7BA592]",
    iconClassName: "bg-[#E7F2EC] text-[#476D5B]",
  },
  {
    id: "explore",
    icon: Compass,
    accent: "bg-[#6F8FA5]",
    iconClassName: "bg-[#E8F0F4] text-[#456477]",
  },
  {
    id: "align",
    icon: Scale,
    accent: "bg-[#C6A35B]",
    iconClassName: "bg-[#F7F0DE] text-[#846928]",
  },
];

const ACCEPTED_FILE_TYPES = ".txt,.md,.csv,.json,text/plain,text/markdown,application/json,text/csv";
const MAX_IMPORT_SIZE = 1024 * 1024;

export default function WorkspaceStarter({
  uiLanguage = "en",
  onUiLanguageChange,
  onSelectIntent,
  onBlankWorkspace,
  onImportWork,
}) {
  const workspaceCopy = getWorkspaceCopy(uiLanguage);
  const copy = workspaceCopy.starter;
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_SIZE) {
      setFileError(copy.fileTooLarge);
      return;
    }

    try {
      const content = await file.text();
      if (!content.trim()) {
        setFileError(copy.fileEmpty);
        return;
      }
      setFileError("");
      onImportWork?.({ fileName: file.name, content: content.trim() });
    } catch {
      setFileError(copy.fileFailed);
    }
  };

  return (
    <section className="pointer-events-none absolute inset-0 z-[30] flex items-center justify-center bg-[#FBFAF5]/40 px-6 pb-8 pt-20">
      <div className="pointer-events-auto absolute right-6 top-5 inline-flex items-center rounded-full border border-[#DCE3DF] bg-white/82 p-1 shadow-[0_8px_24px_rgba(41,57,48,0.06)] backdrop-blur-md">
        {["en", "ko", "ja"].map((language) => (
          <button
            key={language}
            type="button"
            onClick={() => onUiLanguageChange?.(language)}
            className={`inline-flex h-6 min-w-7 items-center justify-center rounded-full px-2 text-[9px] font-semibold uppercase transition ${
              uiLanguage === language
                ? "bg-[#E8EEEA] text-[#40544A]"
                : "text-[#9AA59F] hover:text-[#5E7067]"
            }`}
            aria-label={
              language === "en"
                ? workspaceCopy.drawer.switchEnglish
                : language === "ko"
                  ? workspaceCopy.drawer.switchKorean
                  : workspaceCopy.drawer.switchJapanese
            }
          >
            {language === "ja" ? "JP" : language === "ko" ? "KR" : "EN"}
          </button>
        ))}
      </div>
      <div className="pointer-events-auto w-full max-w-[760px]">
        <div className="mb-7 max-w-[570px]">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#718177]">
            <span className="h-2 w-2 rounded-full bg-[#7BA592]" />
            {copy.eyebrow}
          </div>
          <h1 className="font-heading text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-[#24312B] sm:text-[36px]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-[#69766F]">
            {copy.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {INTENTS.map(({ id, icon: Icon, accent, iconClassName }, index) => {
            const intent = copy.intents[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectIntent?.({ id, prompt: intent.prompt })}
                className="group relative min-h-[148px] overflow-hidden rounded-[22px] border border-[#DDE4DF] bg-white/88 p-5 text-left shadow-[0_12px_34px_rgba(41,57,48,0.055)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#C6D4CB] hover:shadow-[0_18px_44px_rgba(41,57,48,0.09)]"
              >
                <span className={`absolute inset-x-5 top-0 h-[3px] rounded-b-full ${accent}`} />
                <div className="flex items-start justify-between gap-4">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[12px] ${iconClassName}`}>
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                  </span>
                  <span className="pt-1 text-[10px] font-semibold tabular-nums text-[#A1AAA5]">
                    0{index + 1}
                  </span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-[#2D3933]">
                      {intent.title}
                    </h2>
                    <p className="mt-1.5 text-[12px] leading-[1.45] text-[#748078]">
                      {intent.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 translate-y-0 text-[#9AA59F] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#5F776A]" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#DDE4DF]/80 pt-4">
          <button
            type="button"
            onClick={onBlankWorkspace}
            className="text-[12px] font-semibold text-[#66736C] underline decoration-[#BCC7C0] underline-offset-4 transition hover:text-[#32443A]"
          >
            {copy.blank}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#66736C] underline decoration-[#BCC7C0] underline-offset-4 transition hover:text-[#32443A]"
          >
            <Upload className="h-3.5 w-3.5" />
            {copy.import}
          </button>
          <span className="text-[11px] text-[#9AA49E]">{copy.importHint}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {fileError ? (
          <div className="mt-2 text-[11px] font-medium text-[#A94F3C]" role="alert">
            {fileError}
          </div>
        ) : null}
      </div>
    </section>
  );
}
