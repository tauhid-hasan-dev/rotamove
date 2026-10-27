import type { Metadata } from "next";
import { CompanyDetailView } from "@/components/admin/views/company-detail-view";

export const metadata: Metadata = { title: "Company detail" };

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompanyDetailView companyId={id} />;
}
