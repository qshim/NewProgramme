"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { translateWorkspaceContent } from "@/lib/thinkingMachine/apiClient";

const CACHE_STORAGE_KEY = "thinkingMachineTranslationCacheV1";
const MAX_CACHE_ENTRIES = 600;
const TRANSLATION_BATCH_SIZE = 16;

function hashText(value) {
  const text = String(value || "");
  let first = 2166136261;
  let second = 5381;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 16777619);
    second = ((second << 5) + second) ^ code;
  }
  return `${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}-${text.length}`;
}

function getCacheId(language, text) {
  return `${language}:${hashText(text)}`;
}

function readTranslationCache() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CACHE_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTranslationCache(nextEntries) {
  if (typeof window === "undefined") return;
  try {
    const entries = Object.entries(nextEntries);
    const trimmed = entries.length > MAX_CACHE_ENTRIES
      ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
      : nextEntries;
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Translation caching is an optimization and should never block the workspace.
  }
}

export function useWorkspaceTranslations({ uiLanguage = "en", texts = [] } = {}) {
  const [fetchedTranslations, setFetchedTranslations] = useState({});
  const sourceItems = useMemo(() => {
    if (uiLanguage === "en") return [];
    const unique = new Map();
    texts.forEach((value) => {
      const text = typeof value === "string" ? value.trim() : "";
      if (!text) return;
      unique.set(getCacheId(uiLanguage, text), text);
    });
    return [...unique].map(([id, text]) => ({ id, text }));
  }, [texts, uiLanguage]);

  const cachedTranslations = useMemo(() => {
    const cache = readTranslationCache();
    return Object.fromEntries(
      sourceItems.flatMap((item) => (typeof cache[item.id] === "string" ? [[item.id, cache[item.id]]] : []))
    );
  }, [sourceItems]);

  useEffect(() => {
    if (uiLanguage === "en" || !sourceItems.length) return undefined;
    const known = { ...cachedTranslations, ...fetchedTranslations };
    const missingItems = sourceItems.filter((item) => !known[item.id]);
    if (!missingItems.length) return undefined;

    let cancelled = false;
    translateWorkspaceContent({
      targetLanguage: uiLanguage,
      items: missingItems.slice(0, TRANSLATION_BATCH_SIZE),
    })
      .then((result) => {
        if (cancelled) return;
        const translations = Array.isArray(result?.translations) ? result.translations : [];
        const next = Object.fromEntries(
          translations.flatMap((item) => (
            typeof item?.id === "string" && typeof item?.text === "string" && item.text.trim()
              ? [[item.id, item.text.trim()]]
              : []
          ))
        );
        if (!Object.keys(next).length) return;
        setFetchedTranslations((current) => ({ ...current, ...next }));
        writeTranslationCache({ ...readTranslationCache(), ...next });
      })
      .catch((error) => {
        console.warn("Workspace translation unavailable:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [cachedTranslations, fetchedTranslations, sourceItems, uiLanguage]);

  const translations = useMemo(
    () => ({ ...cachedTranslations, ...fetchedTranslations }),
    [cachedTranslations, fetchedTranslations]
  );

  const localizeText = useCallback((value) => {
    const text = typeof value === "string" ? value : "";
    if (!text || uiLanguage === "en") return text;
    return translations[getCacheId(uiLanguage, text.trim())] || text;
  }, [translations, uiLanguage]);

  return {
    localizeText,
    isTranslating: uiLanguage !== "en" && sourceItems.some((item) => !translations[item.id]),
  };
}
