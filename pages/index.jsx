import { useState } from "react";
import { useRouter } from "next/router";
import Script from "next/script";
import { motion } from "framer-motion";
import { Eye, Lock, Mail, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

const LOGIN_STORAGE_KEY = "isLoggedIn";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const DotGrid = dynamic(() => import("@/components/DotGrid/DotGrid"), { ssr: false });
const ColorBends = dynamic(() => import("@/components/ColorBends/ColorBends"), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [googleScriptReady, setGoogleScriptReady] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    window.localStorage.setItem(LOGIN_STORAGE_KEY, "true");
    void router.push("/projects");
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");

    if (!GOOGLE_CLIENT_ID) {
      setErrorMessage(
        "Google sign-in is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local.",
      );
      return;
    }

    if (!googleScriptReady || typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      setErrorMessage("Google sign-in is still loading. Please try again.");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      prompt: "select_account",
      callback: async (tokenResponse) => {
        if (tokenResponse?.error || !tokenResponse?.access_token) {
          setErrorMessage("Google sign-in failed. Please try again.");
          return;
        }

        try {
          const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });

          if (!profileResponse.ok) {
            setErrorMessage("Google account verification failed.");
            return;
          }

          const profile = await profileResponse.json();
          if (!profile?.sub) {
            setErrorMessage("Invalid Google account response.");
            return;
          }

          window.localStorage.setItem(LOGIN_STORAGE_KEY, "true");
          window.localStorage.setItem(
            "googleAuthProfile",
            JSON.stringify({
              sub: profile.sub,
              email: profile.email || "",
              name: profile.name || "",
              picture: profile.picture || "",
            }),
          );
          void router.push("/projects");
        } catch {
          setErrorMessage("Google sign-in failed. Please try again.");
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-[#F3F8F8] text-slate-100">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptReady(true)}
        onError={() => setErrorMessage("Unable to load Google sign-in script.")}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#F3F8F8]" />
      <div className="pointer-events-none absolute inset-0 z-8 opacity-30">
        <ColorBends
          colors={["#7BA592", "#8FDDAF", "#349B6D73", "#9DE7CB", "#349B6D73", "#76D7A1"]}
          rotation={100}
          speed={0.32}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0}
          transparent
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-20 opacity-10">
        <DotGrid
          dotSize={2}
          gap={10}
          baseColor="#6d8ea5"
          activeColor="#cce8ff"
          proximity={130}
          shockRadius={260}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[30] bg-[#F3F8F8]/20 backdrop-blur-[10px]"
        aria-hidden
      />

      <div className="relative z-40 mx-auto flex h-dvh w-full max-w-5xl flex-col items-center justify-start px-6 pb-10 pt-16 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="select-none text-center caret-transparent"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-3.5 py-1 text-[10px] text-[#7BA592] shadow-[0_8px_24px_rgba(123,165,146,0.18)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#7BA592]" />
            Visual node program
          </div>
          <h1 className="mt-6 text-5xl font-light tracking-[-0.04em] text-[#628C79] sm:text-6xl">
            Thinking
            <br />
            Machine
          </h1>
          <p className="mt-4 text-sm text-[#628C79] sm:text-base">
            A collaborative reasoning workspace for teams.
          </p>
        </motion.div>

        <div className="mt-10 w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
            className="w-full"
          >
            <div className="rounded-[28px] border border-white/35 bg-white/20 p-5 text-slate-100 shadow-[0_24px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-3xl sm:p-6">
              <form onSubmit={handleLogin} className="space-y-3">
                <label className="block">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A8A8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-2xl border border-white/25 bg-white/[0.85] py-2.5 pl-11 pr-4 text-sm text-[#A8A8A8] outline-none transition placeholder:text-[#A8A8A8] focus:border-white/35 focus:bg-white/[0.85]"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A8A8A8]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-2xl border border-white/25 bg-white/[0.85] py-2.5 pl-11 pr-12 text-sm text-[#A8A8A8] outline-none transition placeholder:text-[#A8A8A8] focus:border-white/35 focus:bg-white/[0.85]"
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-0 text-[#A8A8A8] transition hover:text-[#A8A8A8]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                {errorMessage ? (
                  <div className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="submit"
                    className="group relative w-full overflow-hidden rounded-2xl border border-[#7BA592]/70 bg-white px-3 py-2.5 text-sm font-semibold text-[#484848] shadow-[0_18px_55px_rgba(15,23,42,0.12)] transition hover:bg-white"
                  >
                    Go
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    aria-label="Google login"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-[#7BA592]/70 bg-white px-3 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_55px_rgba(15,23,42,0.10)] transition hover:bg-white"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.35 0 6.36 1.15 8.72 3.41l6.49-6.49C35.24 2.84 29.94.5 24 .5 14.62.5 6.51 5.88 2.56 13.72l7.55 5.86C12.1 13.54 17.6 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.5 24.5c0-1.64-.15-3.21-.42-4.73H24v8.95h12.63c-.54 2.9-2.2 5.36-4.69 7.01l7.22 5.61c4.22-3.9 6.34-9.64 6.34-16.84z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.11 28.58c-.5-1.48-.79-3.05-.79-4.58 0-1.53.29-3.1.79-4.58l-7.55-5.86C.92 16.73 0 20.25 0 24c0 3.75.92 7.27 2.56 10.44l7.55-5.86z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 47.5c5.94 0 11.24-1.97 14.99-5.36l-7.22-5.61c-2.02 1.36-4.61 2.16-7.77 2.16-6.4 0-11.9-4.04-13.89-10.08l-7.55 5.86C6.51 42.12 14.62 47.5 24 47.5z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

      </div>
    </main>
  );
}
