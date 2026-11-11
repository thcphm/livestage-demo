import Image from "next/image";

/** "Lam Thảo Vy" – "LT"; strips common prefixes like "DJ" or "The" (as in the demo). */
export function initials(name: string): string {
  return name
    .replace(/^(DJ|Ảo thuật gia|Vũ đoàn|Saxophone|The)\s+/i, "")
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
}

/** Photo avatar; falls back to initials on a flat tint of the profile hue when there is no photo. */
export function Avatar({ name, hue = 200, size = 44, square = false, src }: { name: string; hue?: number; size?: number; square?: boolean; src?: string | null }) {
  const shape = square ? "rounded-lg" : "rounded-full";
  if (src) {
    return (
      <Image src={src} alt="" width={size} height={size} aria-hidden="true"
        className={`${shape} shrink-0 object-cover bg-surface2`} style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${shape} shrink-0 grid place-items-center font-medium select-none`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), background: `hsl(${hue} 30% 90%)`, color: `hsl(${hue} 35% 30%)` }}
    >
      {initials(name)}
    </span>
  );
}
