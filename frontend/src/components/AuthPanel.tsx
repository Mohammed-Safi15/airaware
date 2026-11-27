import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Mode = "signin" | "signup";

/** Frosted-glass auth form (sky-blue & pine system) used by Login.tsx. */
export function AuthPanel() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Deep-link (?mode=signup) keeps working even after a remount.
  useEffect(() => {
    if (searchParams.get("mode") === "signup") setMode("signup");
  }, [searchParams]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    const credentials = { email: email.trim(), password };

    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    // With "Confirm email" disabled, signUp returns an active session.
    // If it is ever re-enabled, data.session will be null and the user must confirm.
    if (mode === "signup" && !data.session) {
      setNotice("Account created. Check your email to confirm before signing in.");
      return;
    }

    setPassword("");
    setNotice(mode === "signup" ? "Account created and signed in." : "Signed in.");
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-sage-border)] bg-white/80 px-3.5 py-2.5 text-sm text-[var(--color-deep-pine)] outline-none transition-colors focus:border-[var(--color-sky-accent)] focus:ring-2 focus:ring-[var(--color-sky-soft)]";

  return (
    <section className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-[0_8px_30px_rgb(30,46,36,0.08)] backdrop-blur-md sm:p-7">
      {/* Mode tabs */}
      <div className="mb-5 flex gap-1 rounded-xl border border-[var(--color-sage-border)] bg-[var(--color-misty-alabaster)] p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
            className={`press-soft active:scale-[0.98] flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-[var(--color-deep-pine)] text-[var(--color-misty-alabaster)] shadow-sm"
                : "text-slate-500 hover:text-[var(--color-deep-pine)]"
            }`}
          >
            {m === "signin" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--color-deep-pine)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--color-deep-pine)]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 6 characters" : "••••••"}
            className={inputClass}
          />
          {mode === "signup" && (
            <p className="mt-1.5 text-xs text-slate-500">
              Minimum 6 characters.
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="press-soft active:scale-[0.98] w-full rounded-xl bg-[var(--color-deep-pine)] px-4 py-2.5 text-sm font-semibold text-[var(--color-misty-alabaster)] shadow-[0_8px_30px_rgb(30,46,36,0.18)] hover:bg-[var(--color-deep-pine-soft)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? "Working…"
            : mode === "signin"
              ? "Log In"
              : "Create account & start"}
        </button>
      </form>
    </section>
  );
}
