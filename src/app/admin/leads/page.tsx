import type { Metadata } from "next";
import { LeadsView } from "@/components/admin/views/leads-view";

export const metadata: Metadata = { title: "Leads" };

export default function AdminLeadsPage() {
  return <LeadsView />;
}
