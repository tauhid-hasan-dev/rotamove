import type { Metadata } from "next";
import { OutboxView } from "@/components/admin/views/outbox-view";

export const metadata: Metadata = { title: "Outbox" };

export default function AdminOutboxPage() {
  return <OutboxView />;
}
