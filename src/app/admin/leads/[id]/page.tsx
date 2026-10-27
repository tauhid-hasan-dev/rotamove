import type { Metadata } from "next";
import { LeadDetailView } from "@/components/admin/views/lead-detail-view";

export const metadata: Metadata = { title: "Lead detail" };

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeadDetailView leadId={id} />;
}
