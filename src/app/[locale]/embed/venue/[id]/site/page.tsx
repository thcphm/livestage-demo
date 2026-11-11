import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CITIES, loc, type Locale } from "@/lib/catalog";
import { embedVenue } from "@/demo/queries";

export const dynamic = "force-dynamic";

/**
 * A stand-in for the restaurant's own website, to show the widget in place: the Reservations
 * section is the LiveStage iframe. Styled differently on purpose (serif, the venue's own look).
 */
export default async function SampleVenueSite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = embedVenue(id);
  if (!data) notFound();
  const t = await getTranslations("ops.embed");
  const locale = (await getLocale()) as Locale;
  const { venue } = data;
  const serif = { fontFamily: 'Georgia, "Times New Roman", serif' };

  return (
    <div data-theme="light" className="min-h-screen !bg-[#f6f2ec] !text-[#2b2622]" style={serif}>
      <div className="bg-black px-4 py-2 text-center font-sans text-[13px] text-white">{t("siteNote")}</div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-2xl tracking-wide">{venue.name}</span>
        <nav className="hidden gap-7 text-[15px] sm:flex">
          <span>{t("siteMenu")}</span><span>{t("siteAbout")}</span><a href="#reservations" className="underline underline-offset-4">{t("title")}</a><span>{t("siteContact")}</span>
        </nav>
      </header>
      <div className="relative mx-auto h-[340px] max-w-5xl overflow-hidden">
        <Image src={venue.photo} alt="" fill priority sizes="1024px" className="object-cover" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-8">
          <p className="max-w-lg text-3xl leading-snug text-white">{t("siteHero", { city: loc(CITIES[venue.city].name, locale) })}</p>
        </div>
      </div>
      <section id="reservations" className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-3xl">{t("title")}</h2>
        <p className="mt-2 max-w-xl text-[16px] opacity-80">{t("siteIntro")}</p>
        <div className="mt-6 overflow-hidden rounded border border-[#d8cfc2] bg-white">
          <iframe src={`/${locale}/embed/venue/${venue.id}`} title={t("title")} className="block h-[820px] w-full" loading="lazy" />
        </div>
      </section>
      <footer className="border-t border-[#d8cfc2] py-6 text-center text-[14px] opacity-70">{venue.name}, {venue.address}</footer>
    </div>
  );
}
