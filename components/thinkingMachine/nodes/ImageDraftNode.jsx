"use client";

import { Image as ImageIcon, Loader2, Send } from "lucide-react";
import { useRef } from "react";

export default function ImageDraftNode({ id, data, selected }) {
  const inputRef = useRef(null);
  const imageUrl = typeof data?.imageUrl === "string" ? data.imageUrl : "";
  const caption = typeof data?.caption === "string" ? data.caption : "";
  const onPickImage = data?.onPickImage;
  const onChangeCaption = data?.onChangeCaption;
  const onSubmit = data?.onSubmit;
  const isSubmitting = Boolean(data?.isSubmitting);

  const handlePick = () => inputRef.current?.click();
  const canSubmit = Boolean(imageUrl) || Boolean(caption.trim());

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-[22px] border ${
        selected ? "border-teal-300 ring-2 ring-teal-200/70" : "border-white/70"
      } bg-white/78 shadow-[0_5px_12px_rgba(0,0,0,0.03)] backdrop-blur-[10px]`}
    >
      <div className="absolute right-2.5 top-2.5 z-10">
        <button
          type="button"
          onClick={() => onSubmit?.(id)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-teal-500 text-white shadow-sm transition hover:bg-teal-600 active:scale-[0.98] disabled:opacity-40"
          disabled={!canSubmit || isSubmitting}
          aria-label="Send image draft for analysis"
          title="Analyze"
        >
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) onPickImage?.(id, file);
          e.target.value = "";
        }}
      />

      <div className="relative flex h-full w-full flex-col gap-2 px-3 pb-3 pt-3">
        <button
          type="button"
          onClick={handlePick}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={isSubmitting}
          className={`group relative flex min-h-[78px] flex-1 items-center justify-center overflow-hidden rounded-[16px] border border-white/60 ${
            imageUrl ? "bg-black/5" : "bg-white/45"
          } nodrag nopan shadow-sm transition hover:bg-white/55 disabled:opacity-70`}
          aria-label="Click to upload an image"
          title="Upload image"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Draft" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-700/80">
              <ImageIcon className="h-5 w-5" />
              <span className="text-[11px] font-medium">Click to upload an image.</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 rounded-[16px] ring-0 ring-teal-300/40 transition group-hover:ring-2" />
        </button>

        <textarea
          value={caption}
          onChange={(e) => onChangeCaption?.(id, e.target.value)}
          placeholder="Optional: add a short note about this image..."
          disabled={isSubmitting}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          rows={3}
          className="nodrag nopan w-full resize-none rounded-[16px] border border-white/60 bg-white/50 px-2.5 py-2 text-[11px] leading-[1.4] text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-300 disabled:opacity-70"
        />
      </div>
    </div>
  );
}
