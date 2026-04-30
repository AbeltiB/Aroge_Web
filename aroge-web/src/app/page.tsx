import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Aroge Backoffice Admin</h1>
      <p className="text-center text-slate-600">Production-grade Next.js admin dashboard scaffold integrated with shared Hono API contracts.</p>
      <div className="flex gap-3">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">Login</Link>
        <Link href="/admin/dashboard" className="rounded border px-4 py-2">Open Dashboard</Link>
      </div>
    </main>
  );
}
