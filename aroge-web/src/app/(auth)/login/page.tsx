"use client";

import { useState } from "react";
import { honoClient } from "@/shared/api/client";

export default function LoginPage() {
  const [phone, setPhone] = useState("+1");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Request a Telegram OTP to continue.");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-3xl font-semibold">Admin Sign in</h1>
      <input className="rounded border p-3" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 0000" />
      <button className="rounded bg-black px-4 py-2 text-white" onClick={async () => { await honoClient.requestTelegramCode(phone); setMessage("Code sent via Telegram. Expires in 5 minutes."); }}>Request code</button>
      <input className="rounded border p-3" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter OTP" />
      <button className="rounded bg-emerald-700 px-4 py-2 text-white" onClick={async () => { await honoClient.verifyTelegramCode(phone, code); setMessage("Verified. Redirecting to dashboard..."); }}>Verify code</button>
      <p className="text-sm text-slate-600">{message}</p>
    </main>
  );
}
