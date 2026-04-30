import { env } from "@/shared/config/env";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-trace-id": crypto.randomUUID(),
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const honoClient = {
  me: () => request("/me"),
  requestTelegramCode: (phone: string) =>
    request("/auth/telegram/request-code", { method: "POST", body: JSON.stringify({ phone }) }),
  verifyTelegramCode: (phone: string, code: string) =>
    request("/auth/telegram/verify-code", { method: "POST", body: JSON.stringify({ phone, code }) }),
  refresh: () => request("/auth/refresh", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
};
