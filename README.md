# LiveStage

Booking platform where restaurants, bars, event companies and private clients find and book live performers (singers, bands, DJs), sell tickets to their shows and take table reservations. Operated by Olive, for Canada (CAD) and Vietnam (VND), with an English / Vietnamese interface.

> Nền tảng đặt ca sĩ, ban nhạc, DJ cho nhà hàng, tiệc cưới và sự kiện, kèm bán vé show và đặt bàn. Giao diện song ngữ Anh – Việt.

**Live site: https://livestage-demo.onrender.com** — log in with a sample account (see below) or sign up. The free host sleeps when idle, so the first load can take about a minute, and all testers share one data set.

**This build runs on sample data.** Data and accounts are held in memory, payments are simulated, and no email is sent. Restarting the server resets everything.

## Chạy demo trên máy (Windows)

1. Cài [Node.js 22 trở lên](https://nodejs.org) và [Git](https://git-scm.com).
2. Tải mã nguồn: `git clone https://github.com/thcphm/livestage-demo.git`
3. Mở thư mục `livestage-demo`, nhấp đúp **start-demo.cmd**. Lần đầu mất vài phút để cài thư viện và dựng bản demo.
4. Trình duyệt tự mở `http://localhost:3000/en`. Bấm **Log in** và dùng một tài khoản mẫu ở bảng bên dưới, hoặc đăng ký tài khoản mới.
5. Đóng cửa sổ đen để tắt. Super admin đặt lại dữ liệu mẫu ở Dashboard, tab **Team**.

## Run the demo (any OS)

```bash
corepack enable
pnpm install
pnpm build
pnpm start        # http://localhost:3000
```

Without Supabase settings the app runs in **demo mode**: the bundled sample data, with email and password sign-in against the sample accounts.

## Sample accounts

Log in at `/en/login` (or `/vi/login`). Every sample account uses the password **`livestage2026`** (change it with the `DEMO_PASSWORD` environment variable). New accounts can be created on the sign-up page; they last until the server restarts or a super admin resets the sample data (Dashboard, Team tab).

| Role | Email |
|---|---|
| Olive super admin | `admin@demo.com` |
| Olive support (Vietnam / Canada) | `support1@demo.com` / `support2@demo.com` |
| Recruitment manager (Canada / Vietnam) | `recruit.ca@demo.com` / `recruit.vn@demo.com` |
| Artist manager (Canada / Vietnam) | `northline@demo.com` / `saigontalent@demo.com` |
| Venue | `maple@demo.com` (Canada), `jazz@demo.com` (Vietnam) |
| Artist | `aria@demo.com`, `maya@demo.com` (Canada), `thaovy@demo.com` (Vietnam) |
| Individual client | `sarah@demo.com`, `olivia@demo.com` (Canada), `thuha@demo.com` (Vietnam) |

Ticket buyers and table reservations need no account.

## Host the demo online

The demo keeps its data in the memory of one Node process, so it needs a host that runs a single long-lived server (for example Render or Railway). Serverless hosts are not suitable.

`render.yaml` describes a Render web service: connect this repository in Render as a Blueprint and deploy. On a free plan the service sleeps when idle; the first request after that is slow and the demo data is back to its initial state.

## Features

- Search artists by type, city and date, including artists on tour in your city
- Artist profiles, quick-view cards, public and private calendars
- Quote requests to one artist or up to five, setlists with off-list song requests, versioned contracts, deposits
- Group orders: several artists for one event, one deposit payment
- Ticket sales: show-only and dinner + show combo tickets, service fee, credit card surcharge, QR tickets and check-in
- 50% rule: a show is guaranteed once half the seats are sold; artist substitution, cancellation and refunds
- Table reservations through a widget the venue embeds in its own website
- Messaging with contact details hidden until the deposit is paid
- Olive admin: platform rates, per-artist fees, income by source, operating roles, artist recruitment pipeline
- English and Vietnamese, light and dark mode, mobile layout

All percentages, deadlines and limits in the demo are placeholder values, not business decisions.

## Tech stack

| Layer | Tools |
|---|---|
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, next-intl (vi / en) |
| Data (not connected in the demo) | PostgreSQL on Supabase, Drizzle ORM, Supabase Auth |
| Tests | Vitest (unit), Playwright (e2e) |

Other commands: `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm typecheck`.

## Project structure

```
src/app/        routes (/[locale]/...)
src/components/ UI components
src/server/     database, auth, business rules (server only)
src/demo/       demo-mode data and actions
src/messages/   vi / en UI strings
docs/           requirements, flows, data model, design system, decisions
tests/          unit and e2e tests
```

## Status

All user flows work on sample data, with sign-in and sign-up against in-memory accounts. Database, real authentication, email and payments are not connected; not production-ready.
