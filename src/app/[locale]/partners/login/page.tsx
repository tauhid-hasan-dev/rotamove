import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { LoginForm } from "@/components/partners/login-form";
import { PARTNER_COOKIE } from "@/lib/partner-session";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partners/login">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.login.title,
    description: dict.login.lede,
    // A sign-in form has nothing to offer a search engine.
    robots: { index: false, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function PartnerLoginPage({
  params,
}: PageProps<"/[locale]/partners/login">) {
  const locale = resolveLocale((await params).locale);

  // Already signed in? Skip the form.
  const signedIn = (await cookies()).get(PARTNER_COOKIE)?.value === "1";
  if (signedIn) redirect(localePath(locale, "/partners/dashboard"));

  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="relative flex min-h-[70vh] items-center py-16 sm:py-24">
        <div
          className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[460px] opacity-70 glow-brand"
          aria-hidden
        />
        <Shell className="flex justify-center">
          <LoginForm />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
