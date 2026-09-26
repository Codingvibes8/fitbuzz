"use client";

import { Activity } from "lucide-react";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("displayName") ?? "").trim();

    try {
      const supabase = createClient();
      if (mode === "sign-up") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName },
          },
        });
        if (authError) throw authError;
        setNotice(data.session ? "Your account is ready." : "Check your email to confirm your account.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Authentication failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode: "sign-in" | "sign-up") {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="brand-mark"><Activity size={18} strokeWidth={2.5} /></span><span className="brand-name">fitbuzz<span>.</span></span></div>
        <p className="eyebrow"><span className="eyebrow-mark" />Your training space</p>
        <h1 id="auth-title">{mode === "sign-in" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-description">{mode === "sign-in" ? "Sign in to pick up where your training left off." : "Save your workouts and build a rhythm that lasts."}</p>
        <form onSubmit={submit}>
          <div className="auth-fields">
            {mode === "sign-up" && <label className="form-field"><span className="form-label">Name</span><input className="form-input" name="displayName" autoComplete="name" maxLength={80} /></label>}
            <label className="form-field"><span className="form-label">Email</span><input className="form-input" name="email" type="email" autoComplete="email" required /></label>
            <label className="form-field"><span className="form-label">Password</span><input className="form-input" name="password" type="password" autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-up" ? 8 : undefined} required /></label>
          </div>
          {error && <p className="auth-message error" role="alert">{error}</p>}
          {notice && <p className="auth-message" role="status">{notice}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="auth-switch">{mode === "sign-in" ? "New to FitBuzz?" : "Already have an account?"} <button className="text-button" type="button" onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Create an account" : "Sign in"}</button></p>
      </section>
    </main>
  );
}