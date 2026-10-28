import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.legal.termsTitle,
    description: dict.legal.termsLede,
    alternates: {
      canonical: localePath(locale, "/terms"),
      languages: alternateLanguages("/terms"),
    },
  };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return (
    <LegalPage
      dict={dict}
      locale={locale}
      title={dict.legal.termsTitle}
      lede={dict.legal.termsLede}
      sections={dict.legal.termsSections}
    />
  );
}
