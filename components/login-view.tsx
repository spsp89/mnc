"use client";

import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  KeyRound,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/app-shell";
import type { PortalKind } from "@/lib/auth-types";
import { appPath, readJsonResponse } from "@/lib/client-routing";

type SessionResponse = {
  data?: { destination?: string };
  message?: string | string[];
};

export function LoginView({
  initialPortal = "customer",
  lockedPortal = false,
  signedIn,
  returnTo,
}: {
  initialPortal?: PortalKind;
  lockedPortal?: boolean;
  signedIn: boolean;
  returnTo?: string;
}) {
  const [portal, setPortal] = useState<PortalKind>(initialPortal);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [emailStage, setEmailStage] = useState<"login" | "register" | "verify" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const defaultDestination = portal === "admin" ? "/admin/dashboard" : portal === "business" ? "/business/dashboard" : "/account";
  const requestedDestination = returnTo?.startsWith("/") && !returnTo.startsWith("//")
    && (portal !== "admin" || returnTo.startsWith("/admin"))
    && (portal !== "business" || returnTo.startsWith("/business") || returnTo.startsWith("/merchant"))
      ? returnTo
      : null;

  function readMessage(body: SessionResponse, fallback: string) {
    return Array.isArray(body.message)
      ? body.message.join(" ")
      : body.message ?? fallback;
  }

  function finish(destination?: string) {
    setMessage("Signed in. Opening your secure workspace…");
    // Use a document navigation so the first protected render always sees the
    // newly-issued HttpOnly cookies. A client-router transition can reuse the
    // pre-login server payload and leave the authenticated user on this page.
    window.location.assign(appPath(destination || requestedDestination || defaultDestination));
  }

  async function authenticateWithOtp(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(
        appPath(`/api/session/otp/${otpRequested ? "verify" : "request"}`),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phone,
            portal,
            returnTo,
            ...(otpRequested ? { code } : {}),
          }),
        },
      );
      const body = await readJsonResponse<SessionResponse & {
        data?: { destination?: string; developmentCode?: string; testingOnly?: boolean };
      }>(response, "Mobile verification returned an unreadable response.");
      if (!response.ok) {
        throw new Error(readMessage(body, "Mobile verification failed."));
      }
      if (!otpRequested) {
        setOtpRequested(true);
        if (body.data?.developmentCode) setCode(body.data.developmentCode);
        setMessage(
          body.data?.developmentCode
            ? `${body.data.testingOnly ? "Testing code" : "Development code"}: ${body.data.developmentCode}`
            : "A 6-digit verification code has been sent.",
        );
        return;
      }
      finish(body.data?.destination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mobile verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function authenticateWithEmail(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    const endpoint =
      emailStage === "register"
        ? "register"
        : emailStage === "verify"
          ? "verify"
          : emailStage === "forgot"
            ? "password/request-reset"
            : emailStage === "reset"
              ? "password/reset"
          : "login";
    const payload =
      emailStage === "register"
        ? { email, password, displayName }
          : emailStage === "verify"
          ? { email, code: emailCode, portal, returnTo }
          : emailStage === "forgot"
            ? { email }
            : emailStage === "reset"
              ? { email, code: emailCode, newPassword: password }
          : { email, password, portal, returnTo };
    try {
      const endpointPath = emailStage === "forgot" || emailStage === "reset"
        ? `/api/session/${endpoint}`
        : `/api/session/email/${endpoint}`;
      const response = await fetch(appPath(endpointPath), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJsonResponse<SessionResponse & {
        data?: { destination?: string; developmentCode?: string };
      }>(response, "Email sign-in returned an unreadable response.");
      if (!response.ok) {
        throw new Error(readMessage(body, "Email sign-in failed."));
      }
      if (emailStage === "register") {
        setEmailStage("verify");
        setMessage(
          body.data?.developmentCode
            ? `Development verification code: ${body.data.developmentCode}`
            : "Check your email for a 6-digit verification code.",
        );
        return;
      }
      if (emailStage === "forgot") {
        setEmailStage("reset");
        setEmailCode(body.data?.developmentCode ?? "");
        setMessage(
          body.data?.developmentCode
            ? `Development reset code: ${body.data.developmentCode}`
            : "If an eligible account exists, a reset code has been sent.",
        );
        return;
      }
      if (emailStage === "reset") {
        setEmailStage("login");
        setPassword("");
        setEmailCode("");
        setMessage("Password reset. Sign in with your new password.");
        return;
      }
      finish(body.data?.destination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Email sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  const title =
    portal === "admin"
      ? "Administrator access"
      : portal === "business"
        ? "Manage your BNC business"
        : "Sign in to your BNC account";
  const description =
    portal === "admin"
      ? "Only accounts with an assigned operational role can enter."
      : portal === "business"
        ? "Owners and invited team members use the same secure identity."
        : "Save businesses, track enquiries and manage your preferences.";

  return (
    <AppShell>
      <section className="login-page">
        <div className="login-story">
          <span className="login-story-mark"><Sparkles size={24} /></span>
          <span className="eyebrow">One identity, the right workspace</span>
          <h1>Everything you manage stays under your control.</h1>
          <p>Customers, business teams and BNC operators share one secure sign-in while permissions remain separate.</p>
          <div className="login-benefits">
            <span><BadgeCheck size={17} /><div><strong>Role-aware access</strong><small>Every protected action is checked on the API</small></div></span>
            <span><MessageCircle size={17} /><div><strong>One account</strong><small>Move between customer and business work without duplicate profiles</small></div></span>
            <span><ShieldCheck size={17} /><div><strong>Private sessions</strong><small>Tokens stay in encrypted, HttpOnly browser cookies</small></div></span>
          </div>
          <div className="login-privacy-note"><LockKeyhole size={15} /> Signing in never grants a business or admin role by itself.</div>
        </div>

        <div className="login-card">
          {!lockedPortal && (
            <div className="login-mode">
              <button type="button" className={portal === "customer" ? "active" : ""} onClick={() => setPortal("customer")}>Customer</button>
              <button type="button" className={portal === "business" ? "active" : ""} onClick={() => setPortal("business")}>Business</button>
            </div>
          )}
          <span className="login-icon">
            {portal === "business" ? <Building2 size={22} /> : <ShieldCheck size={22} />}
          </span>
          <h2>{signedIn ? "Choose your destination" : title}</h2>
          <p>{signedIn ? "You already have an active BNC session." : description}</p>

          {signedIn ? (
            <Link
              className="secure-signin primary"
              href={requestedDestination || defaultDestination}
            >
              Open workspace <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <form className="otp-form" onSubmit={authenticateWithEmail}>
                {emailStage === "register" && (
                  <label>Name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={100} autoComplete="name" required /></label>
                )}
                <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" required disabled={emailStage === "verify"} /></label>
                {!["verify", "forgot"].includes(emailStage) && (
                  <label>{emailStage === "reset" ? "New password" : "Password"}<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={128} autoComplete={emailStage === "login" ? "current-password" : "new-password"} required /></label>
                )}
                {(emailStage === "verify" || emailStage === "reset") && (
                  <label>{emailStage === "reset" ? "Password reset code" : "Email verification code"}<input value={emailCode} onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required /></label>
                )}
                <button type="submit" disabled={busy}><KeyRound size={16} /> {emailStage === "register" ? "Create account" : emailStage === "verify" ? "Verify email" : emailStage === "forgot" ? "Send reset code" : emailStage === "reset" ? "Reset password" : "Sign in securely"}</button>
                {emailStage === "login" && (
                  <button className="otp-change-number" type="button" onClick={() => { setEmailStage("forgot"); setMessage(""); }}>Forgot password?</button>
                )}
                {(emailStage === "forgot" || emailStage === "reset") && (
                  <button className="otp-change-number" type="button" onClick={() => { setEmailStage("login"); setMessage(""); }}>Back to sign in</button>
                )}
                {portal !== "admin" && (
                  emailStage !== "forgot" && emailStage !== "reset" && <button className="otp-change-number" type="button" onClick={() => { setEmailStage(emailStage === "login" ? "register" : "login"); setMessage(""); }}>
                    {emailStage === "login" ? "Create a new account" : "Back to sign in"}
                  </button>
                )}
              </form>

              <div className="login-divider"><span>or use mobile OTP</span></div>
              <form className="otp-form" onSubmit={authenticateWithOtp}>
                <label>Mobile number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" autoComplete="tel" required disabled={otpRequested} /></label>
                {otpRequested && (
                  <label>Verification code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} pattern="\d{6}" autoComplete="one-time-code" placeholder="6-digit OTP" required /></label>
                )}
                <button type="submit" disabled={busy}><KeyRound size={16} /> {otpRequested ? "Verify and continue" : "Send secure code"}</button>
                {otpRequested && (
                  <button className="otp-change-number" type="button" onClick={() => { setOtpRequested(false); setCode(""); setMessage(""); }}>Use another number</button>
                )}
              </form>
            </>
          )}

          {message && <p className="login-message" role="status">{message}</p>}
          <div className="login-checks">
            <span><Check size={14} /> Short-lived access sessions</span>
            <span><Check size={14} /> Rotating refresh protection</span>
            <span><Check size={14} /> Server-enforced workspace roles</span>
          </div>
          <small>By continuing, you agree to BNC’s <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</small>
        </div>
      </section>
    </AppShell>
  );
}
