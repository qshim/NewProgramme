import { startTransition, useCallback, useEffect, useRef, useState } from "react";

export function useAdminMode({
  storageKey = "vtm-admin-mode-enabled",
  hintDismissedKey = "vtm-admin-shortcut-hint-dismissed",
} = {}) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminShortcutHint, setShowAdminShortcutHint] = useState(false);
  const hasLoadedFromStorageRef = useRef(false);

  useEffect(() => {
    let enabled = false;
    let shouldShowHint = false;

    try {
      enabled = window.localStorage.getItem(storageKey) === "1";
    } catch {
      enabled = false;
    }

    try {
      shouldShowHint = window.sessionStorage.getItem(hintDismissedKey) !== "1";
    } catch {
      shouldShowHint = false;
    }

    startTransition(() => {
      setIsAdminMode(enabled);
      setShowAdminShortcutHint(shouldShowHint);
    });
    hasLoadedFromStorageRef.current = true;
  }, [storageKey, hintDismissedKey]);

  const dismissAdminShortcutHint = useCallback(() => {
    setShowAdminShortcutHint(false);
    try {
      window.sessionStorage.setItem(hintDismissedKey, "1");
    } catch {
      // ignore storage write errors
    }
  }, [hintDismissedKey]);

  useEffect(() => {
    if (!hasLoadedFromStorageRef.current) return;
    try {
      window.localStorage.setItem(storageKey, isAdminMode ? "1" : "0");
    } catch {
      // ignore storage write errors
    }
  }, [isAdminMode, storageKey]);

  useEffect(() => {
    const handleKeydown = (event) => {
      const isAdminToggle =
        (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "a";
      if (!isAdminToggle) return;

      event.preventDefault();
      setIsAdminMode((prev) => !prev);
      dismissAdminShortcutHint();
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [dismissAdminShortcutHint]);

  return {
    isAdminMode,
    showAdminShortcutHint,
    dismissAdminShortcutHint,
  };
}

