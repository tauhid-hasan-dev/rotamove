import type { Metadata } from "next";
import { PendingView } from "@/components/admin/views/pending-view";

export const metadata: Metadata = { title: "Pending applications" };

/**
 * A static segment beside the `[id]` route for company detail. Next resolves
 * static before dynamic, so this wins over `/admin/companies/pending` being
 * read as a company whose id is "pending" — and no mover id ever is.
 */
export default function AdminPendingCompaniesPage() {
  return <PendingView />;
}
