# Mô hình dữ liệu (rút từ `docs/demo/seed.json`)

Demo dùng 7 collection. Đây là gợi ý điểm xuất phát cho schema thật – có thể chuẩn hoá lại (bảng packages, media, messages tách riêng…) nhưng phải giữ đủ thông tin.

Quy ước chung trong demo:
- Chuỗi hiển thị song ngữ lưu dạng `{ "vi": "...", "en": "..." }`.
- `region`: `vn` | `ca`. Tiền lưu số nguyên theo tiền tệ khu vực (VND hoặc CAD).
- `city`: `hcm` `hn` `dn` (VN) · `tor` `van` `mtl` `cal` (CA).
- `hue`: số 0–360 để sinh màu avatar/bìa khi chưa có ảnh.
- Ngày dạng `YYYY-MM-DD`; một số mốc thời gian trong demo là chuỗi hiển thị "dd/mm hh:mm" – bản thật nên dùng timestamp ISO.

## artists
`id, region, name, kind{vi,en}, category, genres[], city, area(local|region|intl), hue, rating, reviewsCount, bookings, top, verified, response{vi,en}, priceMin, priceMax, fee, joined, bio{vi,en}, usp{vi,en}, services[eventType], packages[{name{vi,en}, dur{vi,en}, from}], media[{k: video|audio|photo, t, len}], social{fb,ig,tt,yt}, busy[date]`
Riêng tư: `phone, email, payAccount, internalNote`.

## venues
`id, region, business, type(restaurant|bar|cafe|corporate|hotel), rep, city, address, hue`
Riêng tư: `phone, email, pay`.

## bookings (trung tâm hệ thống)
```json
{
  "id": "e1", "region": "vn", "source": "slot|request|quick", "groupId": null,
  "venueId": "v1", "artistId": "a1", "category": "singer",
  "title": "Đêm nhạc Lam Thảo Vy", "eventType": "bar",
  "date": "2026-11-06", "start": "20:00", "duration": 3,
  "city": "hcm", "address": "12 Lê Thánh Tôn, Quận 1",
  "guests": 80, "budget": 2, "fee": 3500000, "equipment": ["speakers","mic"], "notes": "",
  "status": "confirmed",
  "ticketing": { "on": true, "price": 200000, "capacity": 80 },
  "quote": { "price": 3500000, "dur": {"vi":"3 giờ","en":"3 hrs"}, "equip": "", "travel": 0, "overtime": 0,
             "depositPct": 30, "cancel": 0, "terms": "", "at": "..." },
  "payment": { "depositPct": 30, "deposit": 4650000, "method": "bank", "paidAt": "...", "remainingPaid": false },
  "messages": [{ "from": "venue|artist|admin", "text": "...", "at": "..." }],
  "history":  [{ "at": "...", "text": {"vi":"...","en":"..."} }],
  "review": { "rating": 5, "text": "...", "at": "..." },
  "clientReview": null, "flagged": false, "createdAt": "2026-10-20"
}
```
- `artistId` rỗng khi slot còn `open`.
- `budget` là **chỉ số** vào danh sách mức ngân sách của khu vực (VN: <3tr, 3–5tr, 5–10tr, 10–20tr, >20tr; CA: <$300 … >$2,500).
- `quote.cancel` là chỉ số chính sách huỷ: 0 Linh hoạt, 1 Tiêu chuẩn, 2 Nghiêm ngặt.
- Tổng báo giá = `price + travel`.

## tickets
`id, bookingId, code, name, email, qty, total, method, at, checkedIn`

## reviews
`id, artistId, author, rating, text, at, event`

## notis (thông báo)
`id, to ("venue:v1" | "artist:a1" | ...), text{vi,en}, ch ("App"|"Email"), at, read`

## accounts
`id, email, role (artist|venue|admin), refId` – trỏ tới artists/venues. Demo không lưu mật khẩu thật (mọi tài khoản demo dùng `123`) → bản thật phải có auth đúng chuẩn.

## Phương thức thanh toán theo khu vực
- VN: `card`, `momo` (MoMo/VNPay), `bank` (chuyển khoản QR), `cash`
- CA: `card`, `paypal`, `interac`, `cash`
