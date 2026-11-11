# Kế hoạch MVP (duyệt 2026-10-30)

Stack: xem hướng dẫn dự án, mục 4. File này giữ schema đề xuất, cấu trúc thư mục, lộ trình và các điểm lệch giữa demo và docs cần nhớ khi làm thật.

## 1. Demo giả lập → bản thật phải làm
| Phần | Demo | Bản thật |
|---|---|---|
| Lưu trữ | localStorage / DB artifact, ghi đè cả document | PostgreSQL; transaction cho bán vé và nhận slot |
| Auth | mật khẩu `123`, session ở localStorage | Supabase Auth, xác minh email, quên mật khẩu, session phía server |
| Phân quyền | chỉ ẩn ở UI, client có toàn bộ dữ liệu | service phía server kiểm tra quyền + chuyển trạng thái hợp lệ; serializer theo vai trò |
| Thanh toán | `setTimeout` | adapter `manual` → PayOS / Stripe + webhook, bảng `payments`, hoàn tiền; giữ chỗ tiền mặt hết hạn 30 phút trước giờ diễn |
| Email | đẩy vào mảng `notis` | Resend: vé + QR, báo giá, xác nhận; thông báo trong app |
| Hoàn tất show | nút "Demo: giả lập show đã diễn ra" | cron tự chuyển `confirmed → completed` sau giờ kết thúc |
| Tra cứu vé | nhập email bất kỳ là xem được vé | gửi magic link về email; QR chứa token ký |
| Check-in | gõ mã | gõ mã + quét QR bằng camera |
| Media | metadata giả | upload ảnh (avatar/bìa); video/audio nhúng link |
| Rating, số booking | cộng dồn tay | tính lại từ reviews / bookings |
| Lịch sử | chuỗi "dd/mm hh:mm" | timestamp ISO + múi giờ thành phố (CA có ET/MT/PT) |
| Admin | role trong session | tạo bằng seed/script, không tự đăng ký; nhật ký thao tác |

## 2. Lệch giữa demo và docs (cần nhớ)
- `clientReview` trong demo = **nghệ sĩ đánh giá nhà hàng**, không phải khán giả đánh giá show.
- Tin nhắn admin: code dùng `from: 'olive'`, `data-model.md` ghi `admin` → bản thật dùng `sender_role = 'admin'`, hiển thị "Olive Support".
- Demo có **thương lượng giá** (tin nhắn kèm `offer`) và **đổi lịch** (đổi ngay, không cần bên kia đồng ý) – chưa có trong `features.md`.
- Luồng slot tự tạo báo giá `depositPct: 0` → không có cọc.
- Demo lưu CAD theo đô chẵn → bản thật lưu cent.
- Demo giới hạn tối đa 10 vé / đơn, so sánh tối đa 3 nghệ sĩ.

## 3. Schema đề xuất
```
profiles          user_id PK→auth.users, role(venue|artist|admin), locale, created_at
artists           id, user_id, region, slug, name, kind{vi,en}, category, genres[], city, travel_area,
                  hue, bio{vi,en}, usp{vi,en}, event_types[], response_time, price_min, price_max,
                  social jsonb, status(pending|active|suspended), verified, top_performer,
                  rating_avg, reviews_count, bookings_count
artist_private    artist_id PK, phone, email, payout_account, internal_note
artist_packages   id, artist_id, name{vi,en}, duration_label{vi,en}, price_from, sort
artist_media      id, artist_id, kind(photo|video|audio), url, title, sort
artist_busy_dates artist_id, date (PK kép)
venues            id, user_id, region, business_name, type, contact_name, city, address, hue
venue_private     venue_id PK, phone, email, payout_info
quote_groups      id, venue_id, criteria jsonb, created_at
bookings          id, ref_code, region, currency, source, group_id?, venue_id, artist_id?,
                  category, title, event_type, date, start_time, duration_h, timezone, city, address,
                  guests, budget_tier, fee, equipment[], notes, status, flagged,
                  ticketing_on, ticket_price, ticket_capacity, cancelled_by, created_at, updated_at
                  (partial unique index: 1 nghệ sĩ / 1 ngày với status pending_payment|confirmed|completed)
quotes            id, booking_id, version, price, travel_fee, overtime_fee, duration_label,
                  venue_equipment, deposit_pct, cancel_policy, terms, created_at
ticket_orders     id, booking_id, code UNIQUE, access_token, buyer_name, buyer_email, qty, unit_price,
                  total, currency, method, status(pending|paid|reserved|cancelled|refunded),
                  reserved_until, checked_in_at, created_at
payments          id, region, currency, purpose(deposit|balance|ticket|refund), booking_id?,
                  ticket_order_id?, provider, provider_ref, amount, status, raw jsonb, paid_at
messages          id, booking_id, sender_role, sender_user_id, body, offer_amount?, created_at
booking_events    id, booking_id, actor_user_id, type, data jsonb, created_at   (history + audit)
reviews           id, booking_id, direction(venue_to_artist|artist_to_venue), rating, text, created_at
                  UNIQUE(booking_id, direction)
notifications     id, user_id, type, data jsonb, channels[], read_at, emailed_at, created_at
```
Danh mục cố định (khu vực, thành phố, loại nghệ sĩ, loại sự kiện, thiết bị, chính sách huỷ, mức ngân sách) nằm trong `src/lib/catalog.ts` với nhãn vi/en.

## 4. Cấu trúc thư mục
```
src/
  app/
    [locale]/(public)/      trang chủ, artists/, artists/[slug]/, shows/, tickets/
    [locale]/(auth)/        login, register, reset
    [locale]/dashboard/     venue/, artist/, admin/ (layout guard theo vai trò)
    api/                    webhooks/{payos,stripe}, cron/
  server/
    db/                     schema.ts, migrations/, seed.ts (import docs/demo/seed.json)
    domain/                 booking-machine.ts, matching.ts, privacy.ts, pricing.ts (thuần, có test)
    services/               bookings, tickets, quotes, artists, venues, admin
    payments/               adapter.ts, manual.ts, payos.ts, stripe.ts
    email/                  templates/ (vi + en)
  components/               ui/, artist/, booking/, calendar/, ticket/
  lib/                      catalog.ts, money.ts, dates.ts, regions.ts
  messages/                 vi.json, en.json
tests/                      unit/, e2e/
```

## 5. Lộ trình (mỗi giai đoạn chạy thử được, một branch)
> 2026-10-30: giao diện của giai đoạn 2–5 đã làm trước trên dữ liệu demo (`feat/redesign`, xem hướng dẫn dự án §2) kèm yêu cầu họp R1–R7. Các giai đoạn dưới đây giờ chủ yếu là nối DB thật, Auth, email và Stripe vào các trang đã có. Bổ sung schema: bảng `clients`, `artist_travel` (from, to, city, note), `artist_songs` (title, original, signature), cột `setlist`, `song_requests`, `contract_versions` (terms jsonb, buyer/artist_accepted_at), `artist_private.fee_bps` + `fee_min`.
| # | Giai đoạn | Chạy thử được |
|---|---|---|
| 0 ✅ | Nền tảng: Next.js, Tailwind + token, vi/en, chọn khu vực, Header/Footer, hero sân khấu, lint/test, deploy preview | Trang chủ song ngữ, đổi VN/CA, light/dark |
| 1 🟡 | Auth & tài khoản: đăng ký venue/artist, đăng nhập, quên mật khẩu, guard vai trò, seed từ `seed.json` (có admin) | Đăng nhập 3 vai trò, vào đúng dashboard |
| 2 | Hồ sơ & tìm nghệ sĩ: sửa hồ sơ (gói, media, trường riêng tư), trang công khai, tìm/lọc, so sánh, lịch rảnh, admin duyệt | Nghệ sĩ mới chờ duyệt → hiện ở tìm kiếm |
| 3 | Slot & bán vé: mở slot, cơ hội đang chờ, nhận 1-click, mời/chốt, Lịch diễn, mua vé (manual / tiền mặt giữ chỗ), email vé + QR, magic link tra cứu, check-in QR, cron hoàn tất, đánh giá | Luồng 1 end-to-end |
| 4 | Báo giá & đặt cọc: form yêu cầu, Quick Quote (≤5), báo giá, so sánh, Book Now, cọc, đóng nhóm, chat, đổi lịch, huỷ theo chính sách, thông báo app + email | Luồng 2 & 3 end-to-end |
| 5 | Admin: lọc khu vực, booking theo trạng thái / flag, ghi chú hỗ trợ, vé/nghệ sĩ/nhà hàng, cấp huy hiệu, đánh dấu đã thu / đã hoàn | Olive vận hành hằng ngày |
| 6 | Cổng thật & ra mắt: PayOS/Stripe + webhook + hoàn tiền, điều khoản & bảo mật, rate limit, giám sát, SEO, backup | Thanh toán thật trên staging |
