import Link from "next/link";
import { ReactNode } from "react";

const modules = [
  ["Dashboard", "/admin/dashboard"],
  ["Users", "/admin/users"],
  ["Catalog", "/admin/catalog"],
  ["Orders", "/admin/orders"],
  ["Disputes", "/admin/disputes"],
  ["Reports", "/admin/reports"],
  ["Authorization", "/admin/authorization"],
  ["Notifications", "/admin/notifications"],
  ["Settings", "/admin/settings"],
  ["Audit Log", "/admin/audit-log"],
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid md:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-800 p-4">
          <h1 className="mb-4 text-xl font-semibold">Aroge Backoffice</h1>
          <nav className="space-y-2 text-sm">
            {modules.map(([name, href]) => (
              <Link className="block rounded px-3 py-2 hover:bg-slate-800" href={href} key={href}>
                {name}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-6">
          <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
