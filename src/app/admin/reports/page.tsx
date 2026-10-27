import type { Metadata } from "next";
import { ReportsView } from "@/components/admin/views/reports-view";

export const metadata: Metadata = { title: "Sales reports" };

export default function AdminReportsPage() {
  return <ReportsView />;
}
