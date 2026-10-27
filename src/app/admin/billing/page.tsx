import type { Metadata } from "next";
import { BillingView } from "@/components/admin/views/billing-view";

export const metadata: Metadata = { title: "Billing" };

export default function AdminBillingPage() {
  return <BillingView />;
}
