"use client";

import { Activity, TrendingUp, Zap, CreditCard } from "lucide-react";
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

  async function signInWithGoogle() {
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (authError) throw authError;
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Google sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  function changeMode(nextMode: "sign-in" | "sign-up") {
    setMode(nextMode);
    setError("");
    setNotice("");
  }

  return (
    <main className="landing-screen">
      {/* Landing section — shown only when user is not signed in */}
      <section className="landing">
        <div className="landing-inner">
          <div className="landing-content">
            <div className="landing-eyebrow"><span className="eyebrow-mark" />Workout tracker</div>
            <h1>Track every session. Build a rhythm that lasts.</h1>
            <p className="landing-description">
              Log your workouts, watch your consistency grow, and spot the habits
              that move you forward. Free to start — upgrade when you want deeper
              insight and AI-guided plans.
            </p>
            <div className="landing-features" role="list">
              <div className="landing-feature" role="listitem">
                <span className="landing-feature-icon"><Activity size={15} strokeWidth={2} /></span>
                <span>Log strength, running, mobility, and cardio in seconds</span>
              </div>
              <div className="landing-feature" role="listitem">
                <span className="landing-feature-icon"><TrendingUp size={15} strokeWidth={2} /></span>
                <span>See your weekly activity, streaks, and progress at a glance</span>
              </div>
              <div className="landing-feature" role="listitem">
                <span className="landing-feature-icon"><Zap size={15} strokeWidth={2} /></span>
                <span>Quick-start templates and sample programs to keep you moving</span>
              </div>
              <div className="landing-feature" role="listitem">
                <span className="landing-feature-icon"><CreditCard size={15} strokeWidth={2} /></span>
                <span>Pro and Elite plans add AI plans, analytics, and coach features</span>
              </div>
            </div>
            <div className="landing-pricing">
              <div className="landing-price-item">
                <span className="landing-price-amount">Free</span>
                <span className="landing-price-label">Core tracking, forever</span>
              </div>
              <div className="landing-price-divider" />
              <div className="landing-price-item">
                <span className="landing-price-amount">£9.99</span>
                <span className="landing-price-label">Pro / month</span>
              </div>
              <div className="landing-price-divider" />
              <div className="landing-price-item">
                <span className="landing-price-amount">£24.99</span>
                <span className="landing-price-label">Elite / month</span>
              </div>
            </div>
          </div>

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

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <span className="auth-divider-line" />
            </div>

            <button className="google-button" type="button" onClick={signInWithGoogle} disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              <span>{mode === "sign-in" ? "Sign in with Google" : "Sign up with Google"}</span>
            </button>

            <p className="auth-switch">{mode === "sign-in" ? "New to FitBuzz?" : "Already have an account?"} <button className="text-button" type="button" onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Create an account" : "Sign in"}</button></p>
            <p className="auth-pricing-note">
              <a href="/pricing">View plans</a> — Free tier includes core tracking.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
