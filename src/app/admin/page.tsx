import type { Metadata } from "next";
import { DashboardView } from "@/components/admin/views/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <DashboardView />;
}
