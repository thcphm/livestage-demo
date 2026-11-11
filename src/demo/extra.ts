import type { CategoryId, CityId, EventTypeId, Localized, RegionId, TravelArea } from "@/lib/catalog";
import type { DemoArtist, DemoBooking, DemoClient, DemoReview, DemoTravel, DemoVenue } from "./types";

/*
 * Demo data that is not in docs/demo/seed.json: photos, repertoires, travel windows, platform fees,
 * twelve more artists, a Hamilton venue, individual clients and the bookings that show R1–R7.
 * All people and businesses are fictional; photos are Unsplash stock (public/demo/photos/CREDITS.md).
 */

const P = (name: string) => `/demo/photos/${name}.jpg`;

/** "Title|Original|*" → song; a trailing * marks a well-known song (R5). */
export function songs(artistId: string, lines: string[]) {
  return lines.map((line, i) => {
    const [title, original, star] = line.split("|");
    return { id: `${artistId}-s${i + 1}`, title, original: original ?? "", signature: star === "*" };
  });
}

const fee = (bps: number, minimum = 0) => ({ bps, minimum });

/** Additions to the sixteen seed artists, keyed by id. */
export const SEED_ARTIST_EXTRAS: Record<string, {
  photo: string;
  gallery: string[];
  servesCities: CityId[];
  repertoire: string[];
  travel?: DemoTravel[];
  fee: { bps: number; minimum: number };
}> = {
  a1: {
    photo: P("singer-f1"), gallery: [P("singer-f6"), P("event-wedding"), P("venue-bar-5")], servesCities: [], fee: fee(1200),
    repertoire: ["Diễm xưa|Trịnh Công Sơn|*", "Hạ trắng|Trịnh Công Sơn|*", "Em ơi Hà Nội phố|Phú Quang|*", "Có chàng trai viết lên cây|Phan Mạnh Quỳnh", "Ngày đầu tiên|Đức Phúc", "Someone Like You|Adele", "Hello Vietnam|Marc Lavoine", "Một đời người một rừng cây|Trần Long Ẩn"],
    travel: [{ from: "2026-12-24", to: "2026-12-27", city: "dl", note: { vi: "Lưu diễn Đà Lạt dịp Giáng sinh – nhận tiệc riêng", en: "Da Lat Christmas run – open for private events" } }],
  },
  a2: {
    photo: P("band-5"), gallery: [P("band-3"), P("band-2"), P("event-party")], servesCities: ["dn", "hn"], fee: fee(1000),
    repertoire: ["Uptown Funk|Mark Ronson ft. Bruno Mars|*", "September|Earth, Wind & Fire|*", "Bước qua mùa cô đơn|Vũ.|*", "Treasure|Bruno Mars", "Don't Start Now|Dua Lipa", "Sugar|Maroon 5", "Thằng điên|JustaTee & Phương Ly", "Valerie|Amy Winehouse"],
  },
  a3: {
    photo: P("dj-1"), gallery: [P("dj-3"), P("dj-5"), P("event-party")], servesCities: [], fee: fee(1500),
    repertoire: ["Vinahouse Night Mix|DJ Kairo|*", "Levels|Avicii|*", "Titanium|David Guetta", "One More Time|Daft Punk", "Bùa yêu (remix)|Bích Phương"],
  },
  a4: {
    photo: P("acoustic-3"), gallery: [P("acoustic-2"), P("acoustic-6"), P("venue-restaurant-1")], servesCities: ["hp"], fee: fee(1200),
    repertoire: ["Ngày chưa giông bão|Bùi Lan Hương|*", "Phố không mùa|Bùi Anh Tuấn|*", "Hà Nội mùa vắng những cơn mưa|Trương Quý Hải|*", "Cát bụi|Trịnh Công Sơn", "Mình yêu nhau đi|Bích Phương", "Riptide|Vance Joy"],
  },
  a5: {
    photo: P("band-6"), gallery: [P("sax-2"), P("venue-bar-4"), P("band-1")], servesCities: ["hp"], fee: fee(1100),
    repertoire: ["Fly Me to the Moon|Frank Sinatra|*", "The Girl from Ipanema|Antônio Carlos Jobim|*", "Autumn Leaves|Joseph Kosma|*", "Take Five|Dave Brubeck", "Misty|Erroll Garner", "Corcovado|Antônio Carlos Jobim"],
  },
  a6: {
    photo: P("singer-f7"), gallery: [P("singer-f8"), P("event-wedding"), P("venue-restaurant-4")], servesCities: [], fee: fee(1300),
    repertoire: ["Duyên phận|Thái Thịnh|*", "Đắp mộ cuộc tình|Vinh Sử|*", "Thành phố buồn|Lam Phương", "Hoa nở về đêm|Mạnh Phát", "Chuyện tình Lan và Điệp|Mạc Phong Linh & Mai Thiết Lĩnh"],
  },
  a7: {
    photo: P("sax-1"), gallery: [P("sax-2"), P("venue-restaurant-3"), P("trumpet-1")], servesCities: ["nt"], fee: fee(1200),
    repertoire: ["Careless Whisper|George Michael|*", "Em gái mưa|Mr. Siro|*", "The Lady in Red|Chris de Burgh", "Perfect|Ed Sheeran", "My Way|Frank Sinatra", "Hạ trắng|Trịnh Công Sơn"],
  },
  a8: {
    photo: P("magic-1"), gallery: [P("magic-2"), P("event-party")], servesCities: [], fee: fee(1500, 300_000),
    repertoire: ["Lá bài biến mất|Close-up|*", "Đọc suy nghĩ khán giả|Mentalism|*", "Nhẫn xuyên dây|Close-up", "Chiếc hộp bay|Sân khấu"],
  },
  a9: {
    photo: P("singer-m3"), gallery: [P("comedy-2")], servesCities: ["hp"], fee: fee(1500),
    repertoire: ["Chuyện công sở|Stand-up 15 phút|*", "MC hài tiệc cưới|MC|*", "Đố vui khán giả|Tương tác"],
  },
  a10: {
    photo: P("dance-2"), gallery: [P("dance-1"), P("dance-3")], servesCities: ["dn"], fee: fee(1000),
    repertoire: ["Múa Sen|Múa đương đại|*", "Dance cover K-pop|Dance cover|*", "Múa quạt|Múa dân gian"],
  },
  a11: {
    photo: P("band-1"), gallery: [P("sax-2"), P("venue-bar-6"), P("band-4")], servesCities: ["mis"], fee: fee(1200),
    repertoire: ["Feeling Good|Nina Simone|*", "At Last|Etta James|*", "Summertime|George Gershwin", "Ain't No Sunshine|Bill Withers", "Georgia on My Mind|Ray Charles", "Moon River|Henry Mancini"],
    travel: [{ from: "2026-11-26", to: "2026-11-29", city: "ott", note: { vi: "Lưu diễn Ottawa – còn trống 2 tối", en: "Ottawa run – two nights still open" } }],
  },
  a12: {
    photo: P("singer-f2"), gallery: [P("singer-f9"), P("venue-restaurant-2"), P("event-toast")], servesCities: [], fee: fee(1400),
    repertoire: ["Golden Hour|JVKE|*", "Halo|Beyoncé|*", "Rolling in the Deep|Adele", "Thinking Out Loud|Ed Sheeran", "Valerie|Amy Winehouse", "Lovely Day|Bill Withers"],
    travel: [{ from: "2026-12-18", to: "2026-12-22", city: "tor", note: { vi: "Về Toronto dịp lễ – nhận tiệc công ty", en: "Toronto over the holidays – taking corporate parties" } }],
  },
  a13: {
    photo: P("dj-2"), gallery: [P("dj-5"), P("venue-bar-1")], servesCities: ["ott"], fee: fee(1500),
    repertoire: ["Midnight City (edit)|M83|*", "Get Lucky|Daft Punk|*", "Blinding Lights|The Weeknd", "Don't Stop Me Now (disco edit)|Queen"],
  },
  a14: {
    photo: P("acoustic-5"), gallery: [P("acoustic-1"), P("venue-restaurant-2")], servesCities: [], fee: fee(1200),
    repertoire: ["Ho Hey|The Lumineers|*", "Home|Edward Sharpe & the Magnetic Zeros|*", "Skinny Love|Bon Iver", "The Night We Met|Lord Huron", "Big Yellow Taxi|Joni Mitchell"],
  },
  a15: {
    photo: P("comedy-1"), gallery: [P("magic-2"), P("event-party")], servesCities: ["mis"], fee: fee(1500, 7_500),
    repertoire: ["Floating card|Stage|*", "Mind reading|Mentalism|*", "Ring through rope|Close-up"],
  },
  a16: {
    photo: P("comedy-2"), gallery: [P("venue-bar-3")], servesCities: [], fee: fee(1500),
    repertoire: ["Immigrant Dad Stories|Stand-up set|*", "Wedding MC|MC|*", "Crowd work|Interactive"],
  },
};

type NewArtist = {
  id: string; region: RegionId; name: string; kind: Localized; category: CategoryId; genres: string[];
  homeCity: CityId; servesCities: CityId[]; travelArea: TravelArea; rating: number; reviewsCount: number; bookingsCount: number;
  verified: boolean; top: boolean; priceMin: number; priceMax: number; bio: Localized; eventTypes: EventTypeId[];
  photo: string; gallery: string[]; repertoire: string[]; travel?: DemoTravel[]; joined: number; hue: number;
  phone: string; email: string; payout: string; blocked?: string[]; fee: { bps: number; minimum: number };
  packages: DemoArtist["packages"];
};

const vnd = (millions: number) => Math.round(millions * 1_000_000);
const cad = (dollars: number) => dollars * 100;

export const NEW_ARTISTS: NewArtist[] = [
  {
    id: "a17", region: "ca", name: "Aria Benoit", kind: { vi: "Solo · Soul", en: "Solo · Soul" }, category: "singer", genres: ["Soul", "R&B", "Jazz"],
    homeCity: "tor", servesCities: ["mis"], travelArea: "region", rating: 4.9, reviewsCount: 31, bookingsCount: 74, verified: true, top: true,
    priceMin: cad(450), priceMax: cad(1800), joined: 2022, hue: 20,
    bio: { vi: "Giọng soul ấm, hát cùng pianist hoặc band 4 người. Hay nhận tiệc cưới và dinner show ở Toronto.", en: "Warm soul voice with a pianist or a four-piece band. Weddings and dinner shows across Toronto." },
    eventTypes: ["wedding", "restaurant", "corporate"], photo: P("singer-f4"), gallery: [P("singer-f10"), P("event-wedding"), P("venue-restaurant-5")],
    repertoire: ["A Change Is Gonna Come|Sam Cooke|*", "Ain't Nobody|Chaka Khan|*", "At Last|Etta James|*", "All of Me|John Legend", "Rehab|Amy Winehouse", "Perfect|Ed Sheeran", "Thinking Out Loud|Ed Sheeran"],
    travel: [{ from: "2026-12-10", to: "2026-12-15", city: "ham", note: { vi: "Từ Toronto xuống Hamilton – mở nhận booking", en: "Toronto to Hamilton – open for bookings" } }],
    phone: "+1 416 555 0142", email: "aria@demo.com", payout: "Stripe · acct_…4417", fee: fee(1300),
    packages: [
      { name: { vi: "Dinner set", en: "Dinner set" }, dur: { vi: "2 × 45 phút, với pianist", en: "2 × 45 min with pianist" }, from: cad(450) },
      { name: { vi: "Tiệc cưới", en: "Wedding" }, dur: { vi: "Lễ + tiệc, 4 giờ, band 4 người", en: "Ceremony + reception, 4 hrs, four-piece" }, from: cad(1600) },
    ],
  },
  {
    id: "a18", region: "ca", name: "Daniel Kwan", kind: { vi: "Violin", en: "Violin" }, category: "instrument", genres: ["Classical", "Pop covers"],
    homeCity: "ham", servesCities: ["tor", "mis"], travelArea: "region", rating: 4.8, reviewsCount: 19, bookingsCount: 41, verified: true, top: false,
    priceMin: cad(300), priceMax: cad(900), joined: 2023, hue: 210,
    bio: { vi: "Nghệ sĩ violin ở Hamilton. Nhạc cổ điển cho lễ cưới, pop cover cho tiệc cocktail.", en: "Hamilton-based violinist. Classical for ceremonies, pop covers for cocktail hours." },
    eventTypes: ["wedding", "corporate", "restaurant"], photo: P("violin-3"), gallery: [P("violin-1"), P("event-toast")],
    repertoire: ["Canon in D|Johann Pachelbel|*", "A Thousand Years|Christina Perri|*", "Viva la Vida|Coldplay", "Clair de Lune|Claude Debussy", "Perfect|Ed Sheeran"],
    phone: "+1 905 555 0177", email: "daniel@demo.com", payout: "Stripe · acct_…9021", fee: fee(1200),
    packages: [
      { name: { vi: "Lễ cưới", en: "Ceremony" }, dur: { vi: "45 phút", en: "45 min" }, from: cad(300) },
      { name: { vi: "Cocktail", en: "Cocktail hour" }, dur: { vi: "90 phút", en: "90 min" }, from: cad(450) },
    ],
  },
  {
    id: "a19", region: "ca", name: "Capital Brass Quintet", kind: { vi: "Nhóm kèn 5 người", en: "Brass quintet" }, category: "band", genres: ["Classical", "Funk", "Holiday"],
    homeCity: "ott", servesCities: [], travelArea: "region", rating: 4.7, reviewsCount: 14, bookingsCount: 38, verified: true, top: false,
    priceMin: cad(900), priceMax: cad(2600), joined: 2022, hue: 45,
    bio: { vi: "5 nghệ sĩ kèn đồng ở Ottawa. Lễ cưới, sự kiện công ty và chương trình mùa lễ.", en: "Five Ottawa brass players for weddings, corporate events and holiday programmes." },
    eventTypes: ["wedding", "corporate", "opening"], photo: P("trumpet-1"), gallery: [P("band-4"), P("event-toast")],
    repertoire: ["Trumpet Voluntary|Jeremiah Clarke|*", "September|Earth, Wind & Fire|*", "Canon in D|Johann Pachelbel", "Uptown Funk|Mark Ronson ft. Bruno Mars", "Ode to Joy|Ludwig van Beethoven"],
    travel: [{ from: "2026-11-20", to: "2026-11-23", city: "mtl", note: { vi: "Montréal cuối tuần 21–22/11", en: "Montréal, weekend of Nov 21–22" } }],
    phone: "+1 613 555 0109", email: "capitalbrass@demo.com", payout: "Stripe · acct_…3380", fee: fee(1100),
    packages: [{ name: { vi: "Lễ + cocktail", en: "Ceremony + cocktails" }, dur: { vi: "2 giờ", en: "2 hrs" }, from: cad(900) }],
  },
  {
    id: "a20", region: "ca", name: "Priya Nair", kind: { vi: "Hát & guitar", en: "Singer-songwriter" }, category: "acoustic", genres: ["Acoustic", "Pop", "Folk"],
    homeCity: "mis", servesCities: ["tor"], travelArea: "local", rating: 4.8, reviewsCount: 22, bookingsCount: 57, verified: false, top: false,
    priceMin: cad(250), priceMax: cad(700), joined: 2024, hue: 300,
    bio: { vi: "Hát và đệm guitar, phù hợp tiệc sinh nhật, brunch và quán cafe.", en: "Voice and guitar for birthdays, brunches and cafés." },
    eventTypes: ["birthday", "restaurant", "bar"], photo: P("acoustic-4"), gallery: [P("acoustic-5"), P("venue-restaurant-1")],
    repertoire: ["Yellow|Coldplay|*", "Riptide|Vance Joy|*", "Fast Car|Tracy Chapman", "Dreams|Fleetwood Mac", "Banana Pancakes|Jack Johnson"],
    phone: "+1 647 555 0133", email: "priya@demo.com", payout: "Stripe · acct_…7712", fee: fee(1500),
    packages: [{ name: { vi: "Tiệc nhỏ", en: "House party" }, dur: { vi: "2 × 45 phút", en: "2 × 45 min" }, from: cad(250) }],
  },
  {
    id: "a21", region: "ca", name: "DJ Sol", kind: { vi: "DJ tiệc cưới", en: "Wedding DJ" }, category: "dj", genres: ["Top 40", "Afrobeats", "Throwbacks"],
    homeCity: "tor", servesCities: ["mis"], travelArea: "region", rating: 4.9, reviewsCount: 40, bookingsCount: 112, verified: true, top: true,
    priceMin: cad(500), priceMax: cad(1600), joined: 2021, hue: 340,
    bio: { vi: "DJ kiêm MC cho tiệc cưới và sinh nhật. Mang theo loa, ánh sáng và micro không dây.", en: "DJ and MC for weddings and birthdays. Brings speakers, lights and wireless mics." },
    eventTypes: ["wedding", "birthday", "corporate"], photo: P("dj-4"), gallery: [P("dj-3"), P("event-party")],
    repertoire: ["Wedding Night Mix|DJ Sol|*", "Calm Down|Rema|*", "Shut Up and Dance|Walk the Moon", "I Wanna Dance with Somebody|Whitney Houston"],
    phone: "+1 416 555 0190", email: "djsol@demo.com", payout: "Stripe · acct_…5530", fee: fee(1400),
    packages: [{ name: { vi: "Tiệc 4 giờ", en: "4-hour party" }, dur: { vi: "Kèm loa và ánh sáng", en: "Sound and lights included" }, from: cad(500) }],
  },
  {
    id: "a22", region: "ca", name: "Leo Park", kind: { vi: "Piano", en: "Piano" }, category: "instrument", genres: ["Classical", "Jazz", "Pop"],
    homeCity: "van", servesCities: [], travelArea: "intl", rating: 4.9, reviewsCount: 26, bookingsCount: 63, verified: true, top: false,
    priceMin: cad(350), priceMax: cad(1200), joined: 2022, hue: 190,
    bio: { vi: "Pianist cho khách sạn, gala và tiệc cưới. Có đàn điện riêng khi venue không có piano.", en: "Pianist for hotels, galas and weddings. Brings a stage piano if the venue has none." },
    eventTypes: ["wedding", "corporate", "restaurant"], photo: P("piano-2"), gallery: [P("venue-restaurant-5"), P("venue-bar-5")],
    repertoire: ["River Flows in You|Yiruma|*", "Clair de Lune|Claude Debussy|*", "Gymnopédie No. 1|Erik Satie", "Your Song|Elton John", "Piano Man|Billy Joel"],
    travel: [{ from: "2026-12-01", to: "2026-12-04", city: "cal", note: { vi: "Calgary đầu tháng 12", en: "Calgary, early December" } }],
    phone: "+1 604 555 0158", email: "leo@demo.com", payout: "Stripe · acct_…2264", fee: fee(1200),
    packages: [{ name: { vi: "Piano tiệc tối", en: "Dinner piano" }, dur: { vi: "3 giờ", en: "3 hrs" }, from: cad(350) }],
  },
  {
    id: "a23", region: "vn", name: "Trần Minh Thư", kind: { vi: "Solo", en: "Solo" }, category: "singer", genres: ["Pop", "Ballad"],
    homeCity: "hn", servesCities: [], travelArea: "region", rating: 4.8, reviewsCount: 35, bookingsCount: 90, verified: true, top: false,
    priceMin: vnd(2.5), priceMax: vnd(7), joined: 2023, hue: 330,
    bio: { vi: "Hát pop, ballad V-pop cho nhà hàng, tiệc công ty và tiệc cưới ở Hà Nội.", en: "V-pop and ballads for restaurants, company parties and weddings in Hanoi." },
    eventTypes: ["restaurant", "wedding", "corporate"], photo: P("singer-f5"), gallery: [P("singer-f3"), P("venue-restaurant-3")],
    repertoire: ["Chúng ta của hiện tại|Sơn Tùng M-TP|*", "Nàng thơ|Hoàng Dũng|*", "Có hẹn với thanh xuân|MONSTAR", "Tháng tư là lời nói dối của em|Hà Anh Tuấn", "See tình|Hoàng Thùy Linh"],
    travel: [{ from: "2026-11-20", to: "2026-11-22", city: "hp", note: { vi: "Hải Phòng 20–22/11 – còn nhận tiệc", en: "Hai Phong Nov 20–22 – taking events" } }],
    phone: "0912 448 220", email: "minhthu@demo.com", payout: "Techcombank · 1903 5521 0091", fee: fee(1200),
    packages: [{ name: { vi: "Set nhà hàng", en: "Restaurant set" }, dur: { vi: "2 × 45 phút", en: "2 × 45 min" }, from: vnd(2.5) }],
  },
  {
    id: "a24", region: "vn", name: "Violin Ngọc Hân", kind: { vi: "Violin", en: "Violin" }, category: "instrument", genres: ["Cổ điển", "Nhạc Việt", "Pop"],
    homeCity: "hcm", servesCities: ["dl"], travelArea: "region", rating: 4.9, reviewsCount: 28, bookingsCount: 66, verified: true, top: false,
    priceMin: vnd(2), priceMax: vnd(6), joined: 2022, hue: 280,
    bio: { vi: "Violin cho lễ cưới, khai trương và tiệc tối. Chơi solo hoặc cùng piano.", en: "Violin for weddings, openings and dinners. Solo or with piano." },
    eventTypes: ["wedding", "opening", "restaurant"], photo: P("violin-2"), gallery: [P("violin-1"), P("event-wedding")],
    repertoire: ["Canon in D|Johann Pachelbel|*", "Hạ trắng|Trịnh Công Sơn|*", "A Thousand Years|Christina Perri", "Csárdás|Vittorio Monti", "Nơi này có anh|Sơn Tùng M-TP"],
    phone: "0937 102 556", email: "ngochan@demo.com", payout: "ACB · 2214 8890", fee: fee(1200),
    packages: [{ name: { vi: "Lễ cưới", en: "Ceremony" }, dur: { vi: "60 phút", en: "60 min" }, from: vnd(2) }],
  },
  {
    id: "a25", region: "vn", name: "The Coastline", kind: { vi: "Ban nhạc 5 người", en: "Five-piece band" }, category: "band", genres: ["Pop rock", "Cover"],
    homeCity: "dn", servesCities: [], travelArea: "region", rating: 4.7, reviewsCount: 21, bookingsCount: 58, verified: true, top: false,
    priceMin: vnd(7), priceMax: vnd(18), joined: 2023, hue: 200,
    bio: { vi: "Ban nhạc cover ở Đà Nẵng, quen diễn beach club và resort.", en: "Da Nang cover band, at home in beach clubs and resorts." },
    eventTypes: ["bar", "corporate", "wedding"], photo: P("band-7"), gallery: [P("band-2"), P("venue-restaurant-3")],
    repertoire: ["Mặt trời của em|Phương Ly ft. JustaTee|*", "Shape of You|Ed Sheeran|*", "Hotel California|Eagles", "Sugar|Maroon 5", "Nối vòng tay lớn|Trịnh Công Sơn"],
    travel: [{ from: "2026-12-05", to: "2026-12-08", city: "nt", note: { vi: "Nha Trang 5–8/12", en: "Nha Trang, Dec 5–8" } }],
    phone: "0905 663 118", email: "coastline@demo.com", payout: "Vietinbank · 1088 2201 7765", fee: fee(1000),
    packages: [{ name: { vi: "Đêm nhạc 2 set", en: "Two-set night" }, dur: { vi: "2 × 60 phút", en: "2 × 60 min" }, from: vnd(7) }],
  },
  {
    id: "a26", region: "vn", name: "Quốc Thịnh", kind: { vi: "Solo · Bolero", en: "Solo · Bolero" }, category: "singer", genres: ["Bolero", "Trữ tình"],
    homeCity: "hcm", servesCities: [], travelArea: "region", rating: 4.6, reviewsCount: 18, bookingsCount: 47, verified: false, top: false,
    priceMin: vnd(2), priceMax: vnd(5), joined: 2024, hue: 15,
    bio: { vi: "Giọng nam trữ tình, hát bolero cho nhà hàng sân vườn và tiệc gia đình.", en: "Lyrical male voice singing bolero for garden restaurants and family parties." },
    eventTypes: ["restaurant", "wedding", "birthday"], photo: P("singer-m2"), gallery: [P("singer-m6"), P("venue-restaurant-4")],
    repertoire: ["Thành phố buồn|Lam Phương|*", "Hoa nở về đêm|Mạnh Phát|*", "Chuyện tình Lan và Điệp|Mạc Phong Linh & Mai Thiết Lĩnh", "Duyên phận|Thái Thịnh"],
    travel: [{ from: "2026-12-24", to: "2026-12-26", city: "dl", note: { vi: "Đà Lạt dịp Noel", en: "Da Lat over Christmas" } }],
    phone: "0908 770 314", email: "quocthinh@demo.com", payout: "Sacombank · 0601 2234 118", fee: fee(1300),
    packages: [{ name: { vi: "Set nhà hàng", en: "Restaurant set" }, dur: { vi: "90 phút", en: "90 min" }, from: vnd(2) }],
  },
  {
    id: "a27", region: "vn", name: "Gió Lạt Acoustic", kind: { vi: "Duo acoustic", en: "Acoustic duo" }, category: "acoustic", genres: ["Indie", "Acoustic"],
    homeCity: "dl", servesCities: [], travelArea: "region", rating: 4.8, reviewsCount: 24, bookingsCount: 52, verified: true, top: false,
    priceMin: vnd(1.8), priceMax: vnd(4.5), joined: 2023, hue: 150,
    bio: { vi: "Duo guitar và hát ở Đà Lạt, chơi ở quán cafe, homestay và tiệc ngoài trời.", en: "Da Lat guitar-and-vocals duo for cafés, homestays and outdoor parties." },
    eventTypes: ["restaurant", "birthday", "wedding"], photo: P("acoustic-1"), gallery: [P("acoustic-6"), P("venue-restaurant-1")],
    repertoire: ["Tình yêu màu nắng|Đoàn Thúy Trang & BigDaddy|*", "Từ chối nhẹ nhàng thôi|Bích Phương & Phúc Du|*", "Ngày chưa giông bão|Bùi Lan Hương", "Phố không mùa|Bùi Anh Tuấn"],
    travel: [{ from: "2026-11-13", to: "2026-11-16", city: "hcm", note: { vi: "Xuống Sài Gòn 13–16/11", en: "In Saigon Nov 13–16" } }],
    phone: "0263 555 1204", email: "giolat@demo.com", payout: "BIDV · 6301 0000 4412", fee: fee(1200),
    packages: [{ name: { vi: "Set cafe", en: "Café set" }, dur: { vi: "2 giờ", en: "2 hrs" }, from: vnd(1.8) }],
  },
  {
    id: "a28", region: "vn", name: "Hoàng Lan Piano", kind: { vi: "Piano", en: "Piano" }, category: "instrument", genres: ["Cổ điển", "Nhạc Việt"],
    homeCity: "hn", servesCities: ["hp"], travelArea: "region", rating: 4.9, reviewsCount: 30, bookingsCount: 81, verified: true, top: true,
    priceMin: vnd(2.5), priceMax: vnd(8), joined: 2021, hue: 260,
    bio: { vi: "Piano cho khách sạn, nhà hàng fine dining và lễ cưới ở Hà Nội.", en: "Piano for hotels, fine dining and weddings in Hanoi." },
    eventTypes: ["restaurant", "wedding", "corporate"], photo: P("piano-1"), gallery: [P("venue-restaurant-5"), P("event-wedding")],
    repertoire: ["River Flows in You|Yiruma|*", "Diễm xưa|Trịnh Công Sơn|*", "Kiss the Rain|Yiruma", "Comptine d'un autre été|Yann Tiersen", "Für Elise|Ludwig van Beethoven"],
    phone: "0983 221 650", email: "hoanglan@demo.com", payout: "Vietcombank · 0451 0003 3321", fee: fee(1100),
    packages: [{ name: { vi: "Piano tiệc tối", en: "Dinner piano" }, dur: { vi: "3 giờ", en: "3 hrs" }, from: vnd(2.5) }],
  },
];

export const VENUE_PHOTOS: Record<string, string> = {
  v1: P("venue-bar-5"), v2: P("venue-restaurant-1"), v3: P("venue-restaurant-4"), v4: P("event-toast"), v5: P("venue-bar-6"),
  v6: P("venue-restaurant-2"), v7: P("venue-bar-4"), v8: P("venue-restaurant-3"), v9: P("venue-bar-1"), v10: P("venue-bar-3"),
};

export const NEW_VENUES: DemoVenue[] = [
  {
    id: "v11", region: "ca", name: "The Harbour Room", type: "restaurant", contact: "Megan Doyle", city: "ham",
    address: "125 James St N, Hamilton, ON", photo: P("venue-restaurant-5"), hue: 210,
    private: { phone: "+1 905 555 0123", email: "harbour@demo.com", payout: "Stripe · acct_…6650" },
  },
];

export const CLIENTS: DemoClient[] = [
  { id: "c1", region: "vn", name: "Nguyễn Thu Hà", city: "hcm", hue: 330, private: { phone: "0903 456 789", email: "thuha@demo.com" } },
  { id: "c2", region: "vn", name: "Phạm Đức Anh", city: "hn", hue: 200, private: { phone: "0977 120 884", email: "ducanh@demo.com" } },
  { id: "c3", region: "ca", name: "Sarah Mitchell", city: "tor", hue: 30, private: { phone: "+1 416 555 0166", email: "sarah@demo.com" } },
  { id: "c4", region: "ca", name: "Emily & Jason Tran", city: "ham", hue: 120, private: { phone: "+1 905 555 0188", email: "emilyjason@demo.com" } },
  { id: "c5", region: "ca", name: "Olivia Park", city: "tor", hue: 260, private: { phone: "416-555-0123", email: "olivia@demo.com" } },
];

export const NEW_REVIEWS: DemoReview[] = [
  { id: "r101", artistId: "a17", author: "Megan D. · The Harbour Room", rating: 5, text: "Aria kept the room quiet in the best way. Guests asked for her name at every table.", date: "2026-10-03", eventType: "restaurant" },
  { id: "r102", artistId: "a17", author: "Priya S.", rating: 5, text: "Sang our first dance and the whole family cried. On time, easy to work with.", date: "2026-09-19", eventType: "wedding" },
  { id: "r103", artistId: "a18", author: "Liam K.", rating: 5, text: "Ceremony timing was perfect. He adjusted when the bride was late.", date: "2026-09-27", eventType: "wedding" },
  { id: "r104", artistId: "a21", author: "Hannah O.", rating: 5, text: "Packed dance floor from the first song. Great with requests from our parents too.", date: "2026-10-10", eventType: "wedding" },
  { id: "r105", artistId: "a23", author: "Hoàng Yến · Hoa Sen Events", rating: 5, text: "Minh Thư hát ổn định, chủ động hỏi trước danh sách bài. Khách công ty rất thích.", date: "2026-10-12", eventType: "corporate" },
  { id: "r106", artistId: "a28", author: "Khách sạn Thăng Long", rating: 5, text: "Chơi đúng không khí bữa tối, không lấn tiếng nói chuyện. Sẽ mời lại.", date: "2026-10-05", eventType: "restaurant" },
  { id: "r107", artistId: "a24", author: "Lan Anh", rating: 5, text: "Đoạn Canon lúc cô dâu bước vào quá đẹp. Ngọc Hân đến sớm để test âm thanh.", date: "2026-10-18", eventType: "wedding" },
  { id: "r108", artistId: "a22", author: "Fairmont events team", rating: 5, text: "Exactly the background we wanted for the gala dinner.", date: "2026-10-01", eventType: "corporate" },
];

/** Bookings that show the meeting requirements. Message and contract times are ISO strings. */
export const NEW_BOOKINGS: Omit<DemoBooking, "region">[] = [
  // R1 + R6 + R7: individual client books a wedding singer, setlist and song requests, contract awaiting the client.
  {
    id: "w1", source: "request", groupId: null, buyerKind: "client", buyerId: "c1", artistId: "a1", category: "singer",
    title: "Tiệc cưới Thu Hà & Minh Quân", eventType: "wedding", date: "2026-12-19", start: "18:00", duration: 4, city: "hcm",
    address: "Riverside Palace, 360D Bến Vân Đồn, Quận 4", guests: 220, budget: 3, fee: 0, equipment: ["stage", "lights"],
    notes: "Lễ vào 18:30. Cần 1 bài lúc cô dâu chú rể vào và 1 bài lúc cắt bánh.", status: "quoted", flagged: false, isPublic: false,
    ticketing: null,
    quote: { price: 9_000_000, dur: { vi: "3 giờ, kèm ban nhạc 3 người", en: "3 hrs with a three-piece band" }, equip: "Nhà hàng có sẵn sân khấu và loa", travel: 0, overtime: 1_000_000, depositPct: 30, cancel: 1, terms: "Bài ngoài danh sách cần báo trước 7 ngày.", at: "2026-10-28T09:10" },
    setlist: ["a1-s2", "a1-s4", "a1-s5", "a1-s1", "a1-s6"],
    songRequests: [
      { id: "w1-q1", title: "Perfect", originalArtist: "Ed Sheeran", status: "accepted", extraFee: 500_000, note: "Bài lúc cô dâu chú rể vào" },
      { id: "w1-q2", title: "Có em chờ", originalArtist: "MIN", status: "pending", extraFee: 0, note: "Lúc cắt bánh" },
    ],
    contract: { version: 1, createdAt: "2026-10-28T09:10", buyerAcceptedAt: null, artistAcceptedAt: "2026-10-28T09:12",
      terms: { price: 9_000_000, depositPct: 30, cancelPolicy: 1, setlist: ["a1-s2", "a1-s4", "a1-s5", "a1-s1", "a1-s6"], extraSongs: [{ title: "Perfect", originalArtist: "Ed Sheeran", extraFee: 500_000 }], licenceHolder: "venue", notes: "Bài ngoài danh sách cần báo trước 7 ngày." } },
    payment: null,
    messages: [
      { id: "w1-m1", from: "buyer", text: "Chào chị, em muốn thêm bài Perfect lúc tụi em vào. Chị gọi em số 0903 456 789 cho nhanh nha.", at: "2026-10-27T20:15" },
      { id: "w1-m2", from: "artist", text: "Chào em, chị nhận Perfect, phí thêm 500.000đ vì phải soạn lại cho ban nhạc. Mình trao đổi ở đây để Olive giữ lịch sử giúp hai bên nha.", at: "2026-10-28T09:05" },
      { id: "w1-m3", from: "admin", text: "Olive: số điện thoại sẽ hiện cho hai bên sau khi đặt cọc.", at: "2026-10-28T09:20" },
    ],
    history: [
      { at: "2026-10-27T20:10", text: { vi: "Khách gửi yêu cầu", en: "Client sent a request" } },
      { at: "2026-10-28T09:10", text: { vi: "Nghệ sĩ gửi báo giá và hợp đồng v1", en: "Artist sent a quote and contract v1" } },
    ],
    review: null, createdAt: "2026-10-27",
  },
  // R1 + R3 + R4: Hamilton wedding during Aria's Toronto → Hamilton trip, paid through Olive (Stripe), contract signed.
  {
    id: "w2", source: "request", groupId: null, buyerKind: "client", buyerId: "c4", artistId: "a17", category: "singer",
    title: "Emily & Jason's wedding", eventType: "wedding", date: "2026-12-12", start: "17:30", duration: 4, city: "ham",
    address: "The Cotton Factory, 270 Sherman Ave N, Hamilton", guests: 120, budget: 3, fee: 0, equipment: ["speakers", "mic"],
    notes: "Ceremony 5:30, first dance around 8:00.", status: "confirmed", flagged: false, isPublic: false, ticketing: null,
    quote: { price: cad(1600), dur: { vi: "Lễ + tiệc, 4 giờ", en: "Ceremony + reception, 4 hrs" }, equip: "Venue provides power and a 3×2 m riser", travel: cad(150), overtime: cad(200), depositPct: 30, cancel: 1, terms: "", at: "2026-10-15T14:00" },
    setlist: ["a17-s3", "a17-s4", "a17-s1", "a17-s2", "a17-s6"],
    songRequests: [{ id: "w2-q1", title: "Can't Help Falling in Love", originalArtist: "Elvis Presley", status: "accepted", extraFee: 0, note: "First dance" }],
    contract: { version: 2, createdAt: "2026-10-16T10:00", buyerAcceptedAt: "2026-10-16T12:30", artistAcceptedAt: "2026-10-16T10:05",
      terms: { price: cad(1750), depositPct: 30, cancelPolicy: 1, setlist: ["a17-s3", "a17-s4", "a17-s1", "a17-s2", "a17-s6"], extraSongs: [{ title: "Can't Help Falling in Love", originalArtist: "Elvis Presley", extraFee: 0 }], licenceHolder: "venue", notes: "Travel fee included." } },
    payment: { provider: "stripe", method: "card", depositPct: 30, deposit: cad(525), paidAt: "2026-10-16T12:32", remainingPaid: false },
    messages: [
      { id: "w2-m1", from: "buyer", text: "We saw you're in Hamilton that week. Could you do our ceremony and first dance?", at: "2026-10-14T19:02" },
      { id: "w2-m2", from: "artist", text: "Yes! I'm there Dec 10–15. Sent you a quote with the travel fee. Elvis for the first dance is no problem.", at: "2026-10-15T14:02" },
      { id: "w2-m3", from: "buyer", text: "Deposit paid. My number is +1 905 555 0188 for the day-of.", at: "2026-10-16T12:35" },
    ],
    history: [
      { at: "2026-10-14T19:00", text: { vi: "Khách gửi yêu cầu", en: "Client sent a request" } },
      { at: "2026-10-15T14:00", text: { vi: "Nghệ sĩ gửi báo giá", en: "Artist sent a quote" } },
      { at: "2026-10-16T10:00", text: { vi: "Hợp đồng v2 (thêm phí di chuyển)", en: "Contract v2 (travel fee added)" } },
      { at: "2026-10-16T12:32", text: { vi: "Khách đặt cọc 30% qua Stripe – đã chốt", en: "Client paid 30% deposit via Stripe – confirmed" } },
    ],
    review: null, createdAt: "2026-10-14",
  },
  // R3: public ticketed show in Hamilton during the same trip.
  {
    id: "h1", source: "slot", groupId: null, buyerKind: "venue", buyerId: "v11", artistId: "a17", category: "singer",
    title: "Aria Benoit – Soul Night", eventType: "restaurant", date: "2026-12-11", start: "20:00", duration: 2, city: "ham",
    address: "125 James St N, Hamilton", guests: 60, budget: 2, fee: cad(650), equipment: ["speakers", "mic", "piano"],
    notes: "", status: "confirmed", flagged: false, isPublic: true, ticketing: { price: cad(25), capacity: 60 },
    quote: null, setlist: [], songRequests: [], contract: null, payment: null, messages: [],
    history: [{ at: "2026-10-20T11:00", text: { vi: "Nhà hàng mở slot, nghệ sĩ nhận show", en: "Venue opened a slot, artist accepted" } }],
    review: null, createdAt: "2026-10-20",
  },
  // Open Hamilton slot that matches artists visiting that week.
  {
    id: "h2", source: "slot", groupId: null, buyerKind: "venue", buyerId: "v11", artistId: null, category: "singer",
    title: "Sunday jazz brunch", eventType: "restaurant", date: "2026-12-13", start: "11:30", duration: 2, city: "ham",
    address: "125 James St N, Hamilton", guests: 50, budget: 1, fee: cad(400), equipment: ["speakers", "mic", "piano"],
    notes: "", status: "open", flagged: false, isPublic: true, ticketing: null,
    quote: null, setlist: [], songRequests: [], contract: null, payment: null, messages: [],
    history: [{ at: "2026-10-26T09:00", text: { vi: "Nhà hàng mở slot", en: "Venue opened a slot" } }],
    review: null, createdAt: "2026-10-26",
  },
  // R1: client Quick Free Quote for a birthday in Toronto (budget $300–600).
  ...([["a20", "quoted", cad(450)], ["a21", "quoted", cad(550)], ["a11", "new", 0]] as const).map(([artistId, status, price], i): Omit<DemoBooking, "region"> => ({
    id: `q${i + 1}`, source: "quick", groupId: "gq1", buyerKind: "client", buyerId: "c3", artistId, category: artistId === "a21" ? "dj" : artistId === "a11" ? "band" : "acoustic",
    title: "Sarah's 30th birthday", eventType: "birthday", date: "2026-11-21", start: "19:00", duration: 3, city: "tor",
    address: "Private home, Leslieville, Toronto", guests: 40, budget: 1, fee: 0, equipment: [],
    notes: "Backyard tent, chill music for dinner then some dancing.", status, flagged: false, isPublic: false, ticketing: null,
    quote: status === "quoted" ? { price, dur: { vi: "3 giờ", en: "3 hrs" }, equip: artistId === "a21" ? "DJ brings speakers and lights" : "Needs one power outlet", travel: 0, overtime: cad(100), depositPct: 30, cancel: 0, terms: "", at: "2026-10-29T10:00" } : null,
    setlist: [], songRequests: [], contract: null, payment: null,
    messages: [],
    history: [{ at: "2026-10-28T21:00", text: { vi: "Khách gửi Quick Free Quote", en: "Client sent a Quick Free Quote" } }],
    review: null, createdAt: "2026-10-28",
  })),
  // R1 + R6: Hanoi birthday request with a song outside the repertoire, waiting for the artist.
  {
    id: "w3", source: "request", groupId: null, buyerKind: "client", buyerId: "c2", artistId: "a4", category: "acoustic",
    title: "Sinh nhật 40 tuổi của bố", eventType: "birthday", date: "2026-11-29", start: "19:30", duration: 2, city: "hn",
    address: "Ngõ 12 Láng Hạ, Đống Đa", guests: 30, budget: 0, fee: 0, equipment: [],
    notes: "Tiệc gia đình trên sân thượng. Bố thích nhạc Trịnh.", status: "new", flagged: false, isPublic: false, ticketing: null,
    quote: null, setlist: ["a4-s4", "a4-s3", "a4-s1"],
    songRequests: [{ id: "w3-q1", title: "Nối vòng tay lớn", originalArtist: "Trịnh Công Sơn", status: "pending", extraFee: 0, note: "Cả nhà cùng hát lúc kết" }],
    contract: null, payment: null,
    messages: [{ id: "w3-m1", from: "buyer", text: "Anh ơi, nhà em muốn hát chung bài Nối vòng tay lớn lúc cuối, anh xem được không ạ?", at: "2026-10-29T21:40" }],
    history: [{ at: "2026-10-29T21:35", text: { vi: "Khách gửi yêu cầu", en: "Client sent a request" } }],
    review: null, createdAt: "2026-10-29",
  },
  // Canadian walkthrough of R1 + R3 + R6 + R7: a Toronto wedding with Maya Chen, who is in Toronto Dec 18–22.
  {
    id: "w4", source: "request", groupId: null, buyerKind: "client", buyerId: "c5", artistId: "a12", category: "singer",
    title: "Olivia & Ryan's wedding", eventType: "wedding", date: "2026-12-19", start: "17:00", duration: 4, city: "tor",
    address: "Casa Loma, 1 Austin Terrace, Toronto", guests: 150, budget: 3, fee: 0, equipment: ["speakers", "mic"],
    notes: "Ceremony at 5:00 in the conservatory, dinner at 6:30, first dance around 8:00.", status: "quoted", flagged: false, isPublic: false,
    ticketing: null,
    quote: { price: cad(1400), dur: { vi: "Lễ + tiệc, 4 giờ, kèm pianist", en: "Ceremony + reception, 4 hrs with pianist" }, equip: "Venue provides power and a small riser", travel: 0, overtime: cad(150), depositPct: 30, cancel: 1, terms: "Songs outside the list need 7 days' notice.", at: "2026-10-29T11:00" },
    setlist: ["a12-s1", "a12-s4", "a12-s2", "a12-s6", "a12-s5"],
    songRequests: [
      { id: "w4-q1", title: "Perfect", originalArtist: "Ed Sheeran", status: "accepted", extraFee: cad(100), note: "First dance" },
      { id: "w4-q2", title: "Can't Help Falling in Love", originalArtist: "Elvis Presley", status: "pending", extraFee: 0, note: "Walking down the aisle" },
    ],
    contract: { version: 1, createdAt: "2026-10-29T11:00", buyerAcceptedAt: null, artistAcceptedAt: "2026-10-29T11:02",
      terms: { price: cad(1400), depositPct: 30, cancelPolicy: 1, setlist: ["a12-s1", "a12-s4", "a12-s2", "a12-s6", "a12-s5"], extraSongs: [{ title: "Perfect", originalArtist: "Ed Sheeran", extraFee: cad(100) }], licenceHolder: "client", notes: "Songs outside the list need 7 days' notice." } },
    payment: null,
    messages: [
      { id: "w4-m1", from: "buyer", text: "Hi Maya! We saw you're in Toronto that week. Could you sing Perfect for our first dance? Easier to chat by phone – I'm at 416-555-0123.", at: "2026-10-28T20:40" },
      { id: "w4-m2", from: "artist", text: "Congratulations! Perfect is no problem – I added it to the quote. Let's keep talking here so Olive has the whole history.", at: "2026-10-29T11:03" },
      { id: "w4-m3", from: "admin", text: "Olive: phone numbers are shared with both sides once the deposit is paid.", at: "2026-10-29T11:10" },
    ],
    history: [
      { at: "2026-10-28T20:35", text: { vi: "Khách gửi yêu cầu", en: "Client sent a request" } },
      { at: "2026-10-29T11:00", text: { vi: "Nghệ sĩ gửi báo giá và hợp đồng v1", en: "Artist sent a quote and contract v1" } },
    ],
    review: null, createdAt: "2026-10-28",
  },
];
