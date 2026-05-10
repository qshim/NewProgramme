"use client";

import { Loader2 } from "lucide-react";

function splitActionPrompt(content = "") {
  const text = String(content || "").trim();
  const match = text.match(/\b(To move forward[\s\S]*)$/i);
  if (!match?.index) return null;

  const context = text.slice(0, match.index).trim();
  const action = match[1].trim();
  if (!context || !action) return null;

  return { action, context };
}

function AssistantMessageContent({ content, shouldSplit = false }) {
  const split = shouldSplit ? splitActionPrompt(content) : null;
  if (!split) return content;
  const questionMatch = split.action.match(/(what specific[\s\S]*\?)$/i);
  const actionPrefix = questionMatch?.index > 0 ? split.action.slice(0, questionMatch.index) : "";
  const actionQuestion = questionMatch ? questionMatch[1] : "";

  return (
    <div className="space-y-3">
      <div className="text-[12px] font-medium leading-[1.55] text-slate-700">
        {questionMatch ? (
          <>
            {actionPrefix}
            <em className="font-medium text-slate-700">{actionQuestion}</em>
          </>
        ) : (
          split.action
        )}
      </div>
      <div className="border-t border-slate-200/60 pt-3 text-[12px] font-normal leading-[1.55] text-slate-400">
        {split.context}
      </div>
    </div>
  );
}

export default function DrawerChatTranscript({
  chatMessages = [],
  isChatLoading = false,
  activeSuggestion,
  chatBottomRef,
}) {
  return (
    <div className="flex flex-col gap-2">
      {chatMessages.length === 0 && !isChatLoading && activeSuggestion && (
        <div className="text-center text-xs text-slate-500">AI is preparing a response...</div>
      )}
      {chatMessages.map((msg, index) => (
        <div
          key={`${msg.role}-${index}`}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-xs leading-relaxed shadow-[0_6px_14px_rgba(0,0,0,0.04)] ${
              msg.role === "user"
                ? "rounded-br-[8px] bg-[#7BA592] text-white"
                : "rounded-bl-[8px] border border-white/80 bg-white/78 text-slate-700"
            }`}
          >
            {msg.role === "assistant" ? (
              <AssistantMessageContent content={msg.content} shouldSplit={index === 0} />
            ) : (
              msg.content
            )}
          </div>
        </div>
      ))}
      {isChatLoading && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-1.5 rounded-[14px] rounded-bl-[8px] border border-white/80 bg-white/78 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
            <span className="text-xs text-slate-500">Thinking...</span>
          </div>
        </div>
      )}
      <div ref={chatBottomRef} />
    </div>
  );
}
