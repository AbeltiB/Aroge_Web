import { Kpi } from "@/entities/admin";

export function KpiGrid({ data }: { data: Kpi[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((kpi) => (
        <article key={kpi.label} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">{kpi.label}</p>
          <p className="text-2xl font-semibold">{kpi.value}</p>
          <p className="text-xs text-emerald-300">{kpi.delta}</p>
        </article>
      ))}
    </section>
  );
}

export function ModulePlaceholder({ title, bullets }: { title: string; bullets: string[] }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <h3 className="text-lg font-medium">{title}</h3>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
        {bullets.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </section>
  );
}
