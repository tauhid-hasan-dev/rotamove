import type { Metadata } from "next";
import { SettingsView } from "@/components/admin/views/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SettingsView initialTab={tab} />;
}
