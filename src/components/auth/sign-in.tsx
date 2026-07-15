"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";

export function SignIn() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setError(null);
    const { error: sendError } = await sendMagicLink(email.trim());
    setSending(false);
    if (sendError) {
      setError(sendError);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08080c] px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">Check your email.</h1>
        <p className="mt-2 max-w-xs text-sm text-white/60">
          We sent a link to {email}. Tap it and you're in — no password to remember.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#08080c] px-6">
      <h1 className="font-display text-3xl font-semibold text-[#F5EEDC]">Marquee</h1>
      <p className="mt-2 text-center text-sm text-white/50">
        Your list, saved for real. Not just this browser.
      </p>
      <form onSubmit={submit} className="mt-8 w-full max-w-xs space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:border-[#E3B24B]/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          className="w-full rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] py-3 text-sm font-semibold text-[#181104] transition-transform hover:brightness-110 disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Me a Link"}
        </button>
        {error && <p className="text-center text-xs text-red-300/90">{error}</p>}
      </form>
    </div>
  );
}
