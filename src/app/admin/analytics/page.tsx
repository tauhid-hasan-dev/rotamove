import type { Metadata } from "next";
import { AnalyticsView } from "@/components/admin/views/analytics-view";

export const metadata: Metadata = { title: "Traffic analytics" };

export default function AdminAnalyticsPage() {
  return <AnalyticsView />;
}
