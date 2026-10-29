import type { Metadata } from "next";
import { ApplicationDetailView } from "@/components/admin/views/application-detail-view";

export const metadata: Metadata = { title: "Application" };

export default async function AdminApplicationPage({
  params,
}: PageProps<"/admin/companies/pending/[reference]">) {
  const { reference } = await params;
  return <ApplicationDetailView reference={reference} />;
}
