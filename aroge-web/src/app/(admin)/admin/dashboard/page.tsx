import { AdminShell } from "@/features/layout/admin-shell";
import { KpiGrid, ModulePlaceholder } from "@/shared/ui/cards";

const kpis = [
  { label: "GMV", value: "$1.28M", delta: "+12.4%" },
  { label: "Orders", value: "8,420", delta: "+5.1%" },
  { label: "Dispute Rate", value: "1.8%", delta: "-0.4pp" },
  { label: "Payout Latency", value: "17h", delta: "-2h" },
];

export default function DashboardPage() {
  return <AdminShell title="Executive Overview"><KpiGrid data={kpis} /><div className="mt-4"><ModulePlaceholder title="Risk & Operations Feed" bullets={["Real-time fraud spikes", "SLA breach alerts", "Payout failure queue", "Drill-down links"]} /></div></AdminShell>;
}
