import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Shell } from "@/components/common/section";
import { RegisterForm } from "@/components/partners/register/register-form";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partners/register">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.register.title,
    description: dict.register.lede,
    alternates: {
      canonical: localePath(locale, "/partners/register"),
      languages: alternateLanguages("/partners/register"),
    },
  };
}

export default function PartnerRegisterPage() {
  return (
    <>
      <SiteHeader variant="flush" />
      <main id="main" className="relative pb-24 pt-10 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[460px] opacity-70 glow-brand"
          aria-hidden
        />
        <Shell>
          <RegisterForm />
        </Shell>
      </main>
      <SiteFooter />
    </>
  );
}
