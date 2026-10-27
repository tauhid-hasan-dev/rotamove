import type { Metadata } from "next";
import { CompaniesView } from "@/components/admin/views/companies-view";

export const metadata: Metadata = { title: "Companies" };

export default function AdminCompaniesPage() {
  return <CompaniesView />;
}
