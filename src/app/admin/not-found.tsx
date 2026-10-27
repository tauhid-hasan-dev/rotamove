import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-20 text-center">
      <p className="code text-xs text-muted-foreground">404</p>
      <p className="text-sm font-medium">That admin page does not exist</p>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </div>
  );
}
