# Design system (cập nhật 2026-11-11, lần 3)

Tinh thần: **sàn đặt nghệ sĩ và bán vé đáng tin, gọn, dễ đọc** – như một sản phẩm thương mại thật, không phải mẫu dựng sẵn. Nội dung thật (lịch diễn, nghệ sĩ, giá) là thứ làm nên trang; trang trí ở mức tối thiểu.

## Nguyên tắc
- **Một màu thương hiệu**: evergreen cho nút chính và trạng thái tốt. Không gradient, không glow, không kính mờ.
- **Lịch diễn dẫn đầu**: trang chủ mở bằng dải xanh sân khấu (`bg-stage`), bên trong là ô tìm kiếm và bảng "Trên sân khấu tuần này" in trên nền giấy vàng (`bg-gold`) kèm ảnh show. Đây là mảng màu lớn duy nhất của trang; các phần dưới giữ nền sáng. Mọi danh sách show bắt đầu bằng ngày.
- **Ít khung**: nội dung xếp theo hàng có đường kẻ; chỉ dùng khung viền khi cần gom nhóm (form, bảng). Không đổ bóng, trừ ô tìm kiếm và popover.
- **Ảnh thật** của nghệ sĩ và địa điểm, tỉ lệ 4:5 (nghệ sĩ) và 4:3 (show).
- **Chữ**: tiêu đề vừa phải, sentence case, không viết hoa toàn bộ, không tô màu riêng một cụm từ. Không emoji, không mũi tên sau link, không dấu "·" nối chữ.
- Câu chữ nói đúng việc: nút ghi rõ hành động ("Thanh toán $63.59"), lỗi nói cách sửa.
- Mobile-first; không cuộn ngang ở 375px và 768px. Menu ngang chỉ hiện từ 1024px, nhỏ hơn dùng hàng cuộn.
- Sáng mặc định, có giao diện tối: bộ token `[data-theme="dark"]` trong `globals.css`. Dùng token (`bg-surface`, `text-ink`, `text-bg`, `text-onaccent`), không dùng `bg-white` / `text-white` trên nền đổi theo giao diện.
- Chữ nhỏ: `text-xs` = 13px, `text-sm` = 15px (đã nâng so với mặc định Tailwind).

## Màu (`src/app/globals.css`)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg` / `--surface` | #FFFFFF | nền |
| `--surface2` | #F1F3F2 | mảng phụ, hàng đang chọn |
| `--line` | #DADFDC | đường kẻ, viền |
| `--ink` / `--muted` | #14171A / #5B6462 | chữ |
| `--accent` / `--accent-ink` / `--accent-soft` | #0F5B45 / #0B4735 / #E3EFE9 | nút chính, link, "chắc chắn diễn" |
| `--navy` (dải tối) | #0A2E24 | "Sắp đến thành phố của bạn", footer, thanh demo |
| `--gold` (đồng nhạt) | #F1DEA2 | ô ngày, nhãn Top, thông báo đổi nghệ sĩ |
| `--ok`, `--warn`, `--bad`, `--info` (+ `-soft`) | | trạng thái |

Tên token `navy*`, `gold*` giữ từ bảng màu cũ để không phải đổi tên trong các trang.

## Chữ
- **Hanken Grotesk** (400/500/600/700) cho toàn bộ, có đủ dấu tiếng Việt.
- **Big Shoulders** chỉ cho ngày diễn (`datetype`): "Nov 21".
- **JetBrains Mono** cho mã vé.
- Cỡ tiêu đề chỉ dùng 4 lớp: `h-hero` (34–54px), `h-page` (28–40px), `h-sec` (23–29px), `h-sub` (20px). Tên và con số nổi bật: `display` + cỡ chữ.

## Thành phần
- Nút `buttonClass(variant, size)`: `primary` (evergreen), `ghost` (viền), `dark`, `soft`, `light` (trắng, trên dải tối), `danger`, `ok`. Góc 6px.
- Link chữ: `link-mark` (gạch chân evergreen).
- Logo: chấm evergreen + "LiveStage".
- Thẻ nghệ sĩ: ảnh 4:5, tên, loại hình, đánh giá, giá "From …", nhãn chuyến lưu diễn.
- Thẻ show: ô ngày trắng trên ảnh, tên, địa điểm, giá, thanh vé đã bán có vạch 50%.
- Dashboard: tiêu đề + tab gạch chân; danh sách dạng hàng.
