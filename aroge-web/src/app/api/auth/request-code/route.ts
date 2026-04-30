import { NextRequest, NextResponse } from "next/server";
import { env } from "@/shared/config/env";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const upstream = await fetch(`${env.apiBaseUrl}${req.nextUrl.pathname.replace('/api','')}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
    body: payload || undefined,
  });
  const body = await upstream.text();
  const res = new NextResponse(body, { status: upstream.status });
  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) res.headers.set("set-cookie", setCookie);
  return res;
}
