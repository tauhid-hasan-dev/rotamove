import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { getDictionary, resolveLocale } from "@/i18n/dictionaries";
import { alternateLanguages, localePath } from "@/i18n/paths";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return {
    title: dict.legal.privacyTitle,
    description: dict.legal.privacyLede,
    alternates: {
      canonical: localePath(locale, "/privacy"),
      languages: alternateLanguages("/privacy"),
    },
  };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  return (
    <LegalPage
      dict={dict}
      locale={locale}
      title={dict.legal.privacyTitle}
      lede={dict.legal.privacyLede}
      sections={dict.legal.privacySections}
    />
  );
}
