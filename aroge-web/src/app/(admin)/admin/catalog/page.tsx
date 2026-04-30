import { AdminShell } from "@/features/layout/admin-shell";
import { ModulePlaceholder } from "@/shared/ui/cards";

export default function Page() {
  return (
    <AdminShell title="Catalog">
      <ModulePlaceholder
        title="Catalog Module"
        bullets={[
          "Server-side table pagination/sort/filter",
          "Typed Hono API integration",
          "Role-guarded privileged actions with audit logs",
          "Responsive layout with mobile-friendly action drawers",
        ]}
      />
    </AdminShell>
  );
}
