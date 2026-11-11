import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/button";

export default async function ForArtistsPage() {
  const t = await getTranslations("forArtists");
  const points = ["b1", "b2", "b3", "b4"] as const;
  return (
    <div className="wrap py-10">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-10 items-center">
        <div>
          <h1 className="h-page">{t("title")}</h1>
          <p className="mt-2 text-muted max-w-lg">{t("sub")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={{ pathname: "/register", query: { role: "artist" } }} className={buttonClass("primary", "lg")}>{t("cta")}</Link>
            <Link href={{ pathname: "/login", query: { next: "/dashboard/artist" } }} className={buttonClass("ghost", "lg")}>{t("login")}</Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface2">
          <Image src="/demo/photos/acoustic-6.jpg" alt="" fill priority sizes="440px" className="object-cover" />
        </div>
      </div>
      <ul className="mt-14 grid sm:grid-cols-2 gap-x-10 gap-y-8">
        {points.map((k) => (
          <li key={k} className="border-t border-line pt-4">
            <h2 className="font-semibold">{t(k)}</h2>
            <p className="mt-1 text-muted">{t(`${k}Text`)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
