import type { Metadata } from "next";
import { UnlocksView } from "@/components/admin/views/unlocks-view";

export const metadata: Metadata = { title: "Unlocks" };

export default function AdminUnlocksPage() {
  return <UnlocksView />;
}
