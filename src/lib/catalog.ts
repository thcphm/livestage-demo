/**
 * Fixed catalogs shared by the whole app (ported from the demo).
 * Every label is bilingual; the `Localized` type makes a missing language a type error.
 */

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type Localized = Record<Locale, string>;

export const loc = (value: Localized | null | undefined, locale: Locale): string =>
  value ? (value[locale] ?? value.vi) : "";

/* ---------- regions & cities ---------- */

export type RegionId = "vn" | "ca";
export type Currency = "VND" | "CAD";
export type CityId = "hcm" | "hn" | "dn" | "hp" | "nt" | "dl" | "tor" | "ham" | "mis" | "ott" | "van" | "mtl" | "cal";
export type PayMethod = "card" | "momo" | "bank" | "paypal" | "interac" | "cash";

export interface Region {
  id: RegionId;
  flag: string;
  name: Localized;
  currency: Currency;
  cities: CityId[];
  payMethods: PayMethod[];
  /** Input step for artist fees, in minor units. */
  feeStep: number;
  /** Input step for ticket prices, in minor units. */
  ticketStep: number;
  /** Budget tiers used by request forms and filters; a booking stores the index. */
  budgets: Localized[];
  /** Upper bound of each budget tier in minor units (null = no upper bound). */
  budgetCaps: (number | null)[];
}

export const REGIONS: Record<RegionId, Region> = {
  vn: {
    id: "vn",
    flag: "VN",
    name: { vi: "Việt Nam", en: "Vietnam" },
    currency: "VND",
    cities: ["hcm", "hn", "dn", "hp", "nt", "dl"],
    payMethods: ["card", "momo", "bank", "cash"],
    feeStep: 100_000,
    ticketStep: 10_000,
    budgets: [
      { vi: "Dưới 3 triệu", en: "Under ₫3M" },
      { vi: "3–5 triệu", en: "₫3–5M" },
      { vi: "5–10 triệu", en: "₫5–10M" },
      { vi: "10–20 triệu", en: "₫10–20M" },
      { vi: "Trên 20 triệu", en: "Over ₫20M" },
    ],
    budgetCaps: [3_000_000, 5_000_000, 10_000_000, 20_000_000, null],
  },
  ca: {
    id: "ca",
    flag: "CA",
    name: { vi: "Canada", en: "Canada" },
    currency: "CAD",
    cities: ["tor", "ham", "mis", "ott", "van", "mtl", "cal"],
    payMethods: ["card", "paypal", "interac", "cash"],
    feeStep: 5_000,
    ticketStep: 100,
    budgets: [
      { vi: "Dưới $300", en: "Under $300" },
      { vi: "$300–600", en: "$300–600" },
      { vi: "$600–1.200", en: "$600–1,200" },
      { vi: "$1.200–2.500", en: "$1,200–2,500" },
      { vi: "Trên $2.500", en: "Over $2,500" },
    ],
    budgetCaps: [30_000, 60_000, 120_000, 250_000, null],
  },
};

export const REGION_IDS = Object.keys(REGIONS) as RegionId[];
export const DEFAULT_REGION: RegionId = "ca";
export const isRegionId = (v: unknown): v is RegionId => typeof v === "string" && v in REGIONS;

export interface City {
  id: CityId;
  region: RegionId;
  name: Localized;
  /** IANA time zone; show times are local to the city. */
  timeZone: string;
}

export const CITIES: Record<CityId, City> = {
  hcm: { id: "hcm", region: "vn", name: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City" }, timeZone: "Asia/Ho_Chi_Minh" },
  hn: { id: "hn", region: "vn", name: { vi: "Hà Nội", en: "Hanoi" }, timeZone: "Asia/Ho_Chi_Minh" },
  dn: { id: "dn", region: "vn", name: { vi: "Đà Nẵng", en: "Da Nang" }, timeZone: "Asia/Ho_Chi_Minh" },
  hp: { id: "hp", region: "vn", name: { vi: "Hải Phòng", en: "Hai Phong" }, timeZone: "Asia/Ho_Chi_Minh" },
  nt: { id: "nt", region: "vn", name: { vi: "Nha Trang", en: "Nha Trang" }, timeZone: "Asia/Ho_Chi_Minh" },
  dl: { id: "dl", region: "vn", name: { vi: "Đà Lạt", en: "Da Lat" }, timeZone: "Asia/Ho_Chi_Minh" },
  tor: { id: "tor", region: "ca", name: { vi: "Toronto", en: "Toronto" }, timeZone: "America/Toronto" },
  ham: { id: "ham", region: "ca", name: { vi: "Hamilton", en: "Hamilton" }, timeZone: "America/Toronto" },
  mis: { id: "mis", region: "ca", name: { vi: "Mississauga", en: "Mississauga" }, timeZone: "America/Toronto" },
  ott: { id: "ott", region: "ca", name: { vi: "Ottawa", en: "Ottawa" }, timeZone: "America/Toronto" },
  van: { id: "van", region: "ca", name: { vi: "Vancouver", en: "Vancouver" }, timeZone: "America/Vancouver" },
  mtl: { id: "mtl", region: "ca", name: { vi: "Montréal", en: "Montréal" }, timeZone: "America/Toronto" },
  cal: { id: "cal", region: "ca", name: { vi: "Calgary", en: "Calgary" }, timeZone: "America/Edmonton" },
};

/* ---------- artists & events ---------- */

export type CategoryId = "singer" | "band" | "dj" | "acoustic" | "instrument" | "magic" | "comedy" | "dance";

export const CATEGORIES: { id: CategoryId; name: Localized; desc: Localized }[] = [
  { id: "singer", name: { vi: "Ca sĩ", en: "Singers" }, desc: { vi: "Pop, ballad, bolero, soul", en: "Pop, ballad, soul, R&B" } },
  { id: "band", name: { vi: "Ban nhạc", en: "Bands" }, desc: { vi: "Cover band, jazz, funk", en: "Cover bands, jazz, funk" } },
  { id: "dj", name: { vi: "DJ", en: "DJs" }, desc: { vi: "EDM, house, party", en: "House, disco, party" } },
  { id: "acoustic", name: { vi: "Acoustic", en: "Acoustic" }, desc: { vi: "Guitar mộc, song ca", en: "Unplugged duos, folk" } },
  { id: "instrument", name: { vi: "Nhạc công", en: "Instrumentalists" }, desc: { vi: "Saxophone, violin, piano", en: "Sax, violin, piano" } },
  { id: "magic", name: { vi: "Ảo thuật", en: "Magicians" }, desc: { vi: "Close-up, sân khấu", en: "Close-up, stage" } },
  { id: "comedy", name: { vi: "Hài độc thoại", en: "Comedians" }, desc: { vi: "Stand-up, MC hài", en: "Stand-up, hosts" } },
  { id: "dance", name: { vi: "Múa", en: "Dancers" }, desc: { vi: "Vũ đoàn, dance cover", en: "Dance troupes" } },
];

export type EventTypeId = "restaurant" | "bar" | "wedding" | "birthday" | "corporate" | "opening";

export const EVENT_TYPES: Record<EventTypeId, Localized> = {
  restaurant: { vi: "Nhà hàng / Cafe", en: "Restaurant / Café" },
  bar: { vi: "Bar / Lounge", en: "Bar / Lounge" },
  wedding: { vi: "Tiệc cưới", en: "Wedding" },
  birthday: { vi: "Sinh nhật", en: "Birthday" },
  corporate: { vi: "Event công ty", en: "Corporate event" },
  opening: { vi: "Khai trương", en: "Grand opening" },
};

export type VenueTypeId = "restaurant" | "bar" | "cafe" | "corporate" | "hotel";

export const VENUE_TYPES: Record<VenueTypeId, Localized> = {
  restaurant: { vi: "Nhà hàng", en: "Restaurant" },
  bar: { vi: "Bar / Lounge", en: "Bar / Lounge" },
  cafe: { vi: "Cafe", en: "Café" },
  corporate: { vi: "Công ty sự kiện", en: "Event company" },
  hotel: { vi: "Khách sạn / Resort", en: "Hotel / Resort" },
};

export type TravelArea = "local" | "region" | "intl";

export const TRAVEL_AREAS: Record<TravelArea, Localized> = {
  local: { vi: "Nội thành", en: "Local only" },
  region: { vi: "Liên tỉnh", en: "Travels regionally" },
  intl: { vi: "Quốc tế", en: "International" },
};

export type EquipmentId = "speakers" | "mic" | "stage" | "lights" | "piano";

export const EQUIPMENT: Record<EquipmentId, Localized> = {
  speakers: { vi: "Loa", en: "Speakers" },
  mic: { vi: "Micro", en: "Microphones" },
  stage: { vi: "Sân khấu", en: "Stage" },
  lights: { vi: "Ánh sáng", en: "Lighting" },
  piano: { vi: "Đàn piano", en: "Piano" },
};

/** Index stored in quotes: 0 flexible, 1 standard, 2 strict. */
export const CANCEL_POLICIES: Localized[] = [
  { vi: "Linh hoạt: hoàn 100% cọc nếu huỷ trước 7 ngày, 50% nếu trước 3 ngày.", en: "Flexible: 100% deposit refund 7+ days out, 50% 3+ days out." },
  { vi: "Tiêu chuẩn: hoàn 50% cọc nếu huỷ trước 7 ngày, không hoàn sau đó.", en: "Standard: 50% deposit refund 7+ days out, none after that." },
  { vi: "Nghiêm ngặt: không hoàn cọc sau khi xác nhận.", en: "Strict: deposit is non-refundable once confirmed." },
];

export const PAY_METHODS: Record<PayMethod, { name: Localized; note: Localized }> = {
  card: { name: { vi: "Thẻ ATM / Visa / Mastercard", en: "Debit / Visa / Mastercard" }, note: { vi: "Thanh toán ngay qua cổng LiveStage", en: "Pay instantly through LiveStage" } },
  momo: { name: { vi: "Ví MoMo / VNPay", en: "MoMo / VNPay wallet" }, note: { vi: "Quét mã trong ứng dụng ví", en: "Scan the code in your wallet app" } },
  bank: { name: { vi: "Chuyển khoản ngân hàng (QR)", en: "Bank transfer (QR)" }, note: { vi: "Xác nhận tự động khi nhận tiền", en: "Confirmed automatically on receipt" } },
  paypal: { name: { vi: "PayPal", en: "PayPal" }, note: { vi: "Dành cho khách quốc tế", en: "For international guests" } },
  interac: { name: { vi: "Interac e-Transfer", en: "Interac e-Transfer" }, note: { vi: "Chuyển khoản qua email tại Canada", en: "Email money transfer in Canada" } },
  cash: { name: { vi: "Tiền mặt tại quầy", en: "Cash at the door" }, note: { vi: "Không khuyến khích – giữ chỗ tối đa 30 phút trước giờ diễn", en: "Not preferred – seats held until 30 min before showtime" } },
};

/* ---------- booking lifecycle ---------- */

export type BookingStatus =
  | "open" | "new" | "quoted" | "pending_payment" | "confirmed"
  | "completed" | "declined" | "rejected" | "cancelled" | "closed";

export type Tone = "info" | "warn" | "ok" | "bad" | "neutral" | "accent";

export const BOOKING_STATUS: Record<BookingStatus, { label: Localized; tone: Tone }> = {
  open: { label: { vi: "Đang tìm nghệ sĩ", en: "Looking for artist" }, tone: "info" },
  new: { label: { vi: "Yêu cầu mới", en: "New request" }, tone: "info" },
  quoted: { label: { vi: "Đã báo giá", en: "Quoted" }, tone: "warn" },
  pending_payment: { label: { vi: "Chờ đặt cọc", en: "Awaiting deposit" }, tone: "warn" },
  confirmed: { label: { vi: "Đã chốt", en: "Confirmed" }, tone: "ok" },
  completed: { label: { vi: "Đã diễn ra", en: "Completed" }, tone: "neutral" },
  declined: { label: { vi: "Nghệ sĩ từ chối", en: "Declined by artist" }, tone: "bad" },
  rejected: { label: { vi: "Khách từ chối", en: "Declined by venue" }, tone: "bad" },
  cancelled: { label: { vi: "Đã huỷ", en: "Cancelled" }, tone: "bad" },
  closed: { label: { vi: "Đã chọn nghệ sĩ khác", en: "Another artist chosen" }, tone: "neutral" },
};

export const ACTIVE_STATUSES: BookingStatus[] = ["open", "new", "quoted", "pending_payment", "confirmed"];
export const BOOKED_STATUSES: BookingStatus[] = ["pending_payment", "confirmed", "completed"];
/** Contact details of the other party are revealed only in these statuses. */
export const REVEALED_STATUSES: BookingStatus[] = ["confirmed", "completed"];
