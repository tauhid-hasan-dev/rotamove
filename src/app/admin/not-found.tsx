import Link from "next/link";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function AdminNotFound() {
  const cookieVal = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieVal) ? cookieVal : "en";
  const dict = getDictionary(locale);
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-20 text-center">
      <p className="code text-xs text-muted-foreground">404</p>
      <p className="text-sm font-medium">{dict.admin.errors.notFoundTitle}</p>
      <Button asChild variant="outline" size="sm">
        <Link href="/admin">{dict.admin.errors.backToDashboard}</Link>
      </Button>
    </div>
  );
}
