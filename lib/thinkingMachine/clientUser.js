const STORED_USER_KEY = "thinkingMachineCurrentUser";
const GOOGLE_PROFILE_KEY = "googleAuthProfile";

function buildFallbackUser(previous = {}) {
  return {
    id: previous.id || `local-user-${Date.now()}`,
    name: previous.name || "Local teammate",
    email: previous.email || "",
    picture: previous.picture || "",
    role: previous.role || "editor",
  };
}

export function readCurrentUser() {
  if (typeof window === "undefined") {
    return {
      id: "mock-user-1",
      name: "You",
      email: "",
      picture: "",
      role: "owner",
    };
  }

  try {
    const stored = window.localStorage.getItem(STORED_USER_KEY);
    const existingUser = stored ? JSON.parse(stored) : null;
    const googleRaw = window.localStorage.getItem(GOOGLE_PROFILE_KEY);
    const googleProfile = googleRaw ? JSON.parse(googleRaw) : null;

    const nextUser = googleProfile?.sub
      ? {
          id: googleProfile.sub,
          name: googleProfile.name || existingUser?.name || "Google teammate",
          email: googleProfile.email || existingUser?.email || "",
          picture: googleProfile.picture || existingUser?.picture || "",
          role: existingUser?.role || "editor",
        }
      : buildFallbackUser(existingUser || {});

    window.localStorage.setItem(STORED_USER_KEY, JSON.stringify(nextUser));
    return nextUser;
  } catch {
    const fallback = buildFallbackUser();
    window.localStorage.setItem(STORED_USER_KEY, JSON.stringify(fallback));
    return fallback;
  }
}
