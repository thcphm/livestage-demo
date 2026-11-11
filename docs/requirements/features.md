# LiveStage – Đặc tả chức năng

Rút ra từ demo `docs/demo/livestage-demo.html` (bản 2026-10-29). Đây là phạm vi đã được trình bày và thống nhất qua demo.

---

## 0. Chung
- Đa ngôn ngữ vi/en; chọn khu vực VN/CA (đổi tiền tệ, thành phố, phương thức thanh toán, mức ngân sách lọc).
- Trang công khai: Trang chủ · Tìm nghệ sĩ · Lịch diễn (Shows) · Hồ sơ nghệ sĩ.
- Trang chủ có 2 tab ở hero: **"Đi xem diễn"** (khán giả) và **"Đặt nghệ sĩ"** (nhà hàng), kèm nút **Quick Free Quote**.
- Đăng ký 2 loại: **Nghệ sĩ** (tạo hồ sơ) hoặc **Nhà hàng** (người đại diện + tên doanh nghiệp + loại hình + thành phố). Admin không tự đăng ký.
- Thông báo trong app + email (kênh `App` / `Email`).
- Có "Hướng dẫn demo" và tài khoản demo (mật khẩu `123`) – chỉ dành cho bản demo.

### Danh mục
- Loại nghệ sĩ: Ca sĩ, Ban nhạc, DJ, Acoustic, Nhạc công, Ảo thuật, Hài độc thoại, Múa.
- Loại sự kiện: Nhà hàng/Cafe, Bar/Lounge, Tiệc cưới, Sinh nhật, Event công ty, Khai trương.
- Loại hình venue: Nhà hàng, Bar/Lounge, Cafe, Công ty sự kiện, Khách sạn/Resort.
- Phạm vi di chuyển nghệ sĩ: Nội thành / Liên tỉnh / Quốc tế.
- Thiết bị: Loa, Micro, Sân khấu, Ánh sáng, Đàn piano.
- Chính sách huỷ (3 mức): Linh hoạt · Tiêu chuẩn · Nghiêm ngặt.

---

## 1. Khán giả (không cần tài khoản)
- **Lịch diễn**: danh sách show công khai đang bán vé (thẻ sự kiện: nghệ sĩ, venue, ngày giờ, giá vé, số chỗ còn).
- **Mua vé**: chọn số lượng → nhập tên + email → chọn phương thức thanh toán của khu vực → nhận **mã vé + QR** ngay; bản sao gửi email.
- **Vé của tôi**: tra cứu vé theo email.
- Thanh toán tiền mặt tại quầy: giữ chỗ tới 30 phút trước giờ diễn.

## 2. Nhà hàng (venue) – dashboard 7 tab
1. **Lịch của tôi**: lịch tháng các slot/show; **mở slot mới** (ngày, giờ bắt đầu, thời lượng, loại nghệ sĩ, ngân sách/thù lao, thiết bị có sẵn, bật bán vé: giá vé + sức chứa).
2. **Tìm ca sĩ**: danh sách nghệ sĩ kèm ngày slot trống → bấm ngày để **mời / chốt ngay**.
3. **Vé đã bán**: theo từng show: số vé, doanh thu, số người đã check-in; **check-in bằng mã vé** tại cửa.
4. **Yêu cầu & báo giá**: theo dõi yêu cầu gửi đi; **bảng so sánh báo giá** khi có nhiều nghệ sĩ báo → **Book Now** → **đặt cọc**.
5. **Đã diễn & đánh giá**: show đã xong, nhắc đánh giá nghệ sĩ.
6. **Tin nhắn**: chat theo từng booking.
7. **Hồ sơ**: thông tin venue, địa chỉ, phương thức nhận/thanh toán (trường riêng tư đánh dấu ẩn).

Ngoài dashboard: gửi **Yêu cầu báo giá** cho 1 nghệ sĩ từ hồ sơ của họ, hoặc **Quick Free Quote** (điền 1 lần → hệ thống chọn tối đa 5 nghệ sĩ phù hợp theo khu vực, loại, thành phố/phạm vi di chuyển, ngày rảnh; ưu tiên cùng thành phố rồi rating). **So sánh nghệ sĩ** (chọn nhiều thẻ → bảng so sánh).

Form yêu cầu: tiêu đề, loại sự kiện, ngày, giờ bắt đầu, thời lượng (1–5 giờ), thành phố, địa chỉ, số khách, ngân sách, thiết bị, ghi chú.

## 3. Nghệ sĩ – dashboard 6 tab
1. **Lịch diễn của tôi**: show sắp tới, hiện "Khách đã book: X vé".
2. **Cơ hội đang chờ**: slot nhà hàng đang mở khớp với mình → **Chấp nhận show 1-click** → show lên trang Lịch diễn và mở bán vé.
3. **Yêu cầu & báo giá**: yêu cầu mới → **gửi báo giá** (giá, thời lượng, thiết bị khách cần chuẩn bị, phí di chuyển, phí quá giờ, % đặt cọc, chính sách huỷ, điều khoản) hoặc từ chối.
4. **Lịch rảnh**: lịch tháng, đánh dấu ngày bận.
5. **Tin nhắn**.
6. **Hồ sơ**: tên, loại, thể loại nhạc, thành phố, phạm vi di chuyển, bio, điểm mạnh (USP), loại sự kiện phục vụ, **gói dịch vụ** (tên, thời lượng, giá từ), media (video/audio/ảnh), mạng xã hội; trường riêng tư: SĐT, email, tài khoản nhận tiền, ghi chú nội bộ.

**Hồ sơ công khai**: ảnh bìa/avatar, huy hiệu Verified / Top Performer, rating & số đánh giá & số booking, thời gian phản hồi, giá từ, gói, media, đánh giá, **lịch tháng** (ngày xanh = có show bán vé), nghệ sĩ tương tự, nút Báo giá.

## 4. Admin Olive – dashboard 4 tab (lọc theo khu vực)
1. **Booking & slot**: lọc theo trạng thái + "Cần hỗ trợ" (flagged); xem cả 2 bên và thông tin liên hệ; đánh dấu / gửi ghi chú hỗ trợ.
2. **Vé**: mã, khách, sự kiện, số vé, thanh toán, check-in.
3. **Nghệ sĩ**: khu vực, rating, liên hệ (nội bộ), ghi chú nội bộ.
4. **Nhà hàng**: danh sách venue.

## 5. Booking – 3 nguồn
| `source` | Ai khởi tạo | Mô tả |
|---|---|---|
| `slot` | Nhà hàng | Mở slot công khai → nghệ sĩ nhận 1-click (hoặc venue chốt ngay) → thường kèm bán vé |
| `request` | Nhà hàng | Yêu cầu báo giá riêng gửi 1 nghệ sĩ (sự kiện riêng) |
| `quick` | Nhà hàng | Quick Free Quote gửi tối đa 5 nghệ sĩ, cùng `groupId` |

Trạng thái: xem `docs/flows.md`.

## 6. Quyền riêng tư
- Liên hệ (SĐT/email) của bên kia chỉ hiện khi booking `confirmed`/`completed`; trước đó hiện biểu tượng khoá.
- Tài khoản nhận tiền & ghi chú nội bộ: chỉ chủ hồ sơ + admin.
- Khán giả chỉ cung cấp tên + email.

## 7. Chưa có trong demo / cần làm thật
Xác thực thật · thanh toán thật · gửi email thật · upload media thật · quản lý hoàn cọc theo chính sách huỷ · phân quyền phía server · nhật ký thao tác (demo có `history` mỗi booking).

---

## 8. Yêu cầu bổ sung – họp 2026-10-30 (bắt buộc có)
Bổ sung cho phạm vi ở trên. Câu hỏi còn mở: `docs/open-questions.md` mục "Họp 2026-10-30".

### R1. Khách cá nhân đặt nghệ sĩ
- Ngoài nhà hàng, **khách cá nhân** đặt nghệ sĩ cho party / ceremony (sinh nhật, cưới, tiệc nhà…), lọc theo **ngân sách** và **quy mô** (số khách, loại sự kiện).
- Dùng chung luồng `request` / `quick`, người tạo là khách thay vì venue.
- Đề xuất: thêm vai trò **`client`** (đăng ký nhẹ: tên + email + magic link). Khán giả mua vé vẫn không cần tài khoản.

### R2. Lịch công khai & lịch riêng của nghệ sĩ
- **Công khai**: ai cũng thấy nghệ sĩ diễn ở đâu, mấy giờ (show đã chốt).
- **Riêng tư**: chỉ nghệ sĩ (và admin) thấy ngày rảnh / bận để tự chọn nhận show.
- Đề xuất: sự kiện riêng của khách (tiệc, cưới) chỉ hiện "Sự kiện riêng · <thành phố>", không lộ tên khách / địa chỉ.

### R3. Vị trí theo thời gian (lưu diễn)
- Nghệ sĩ khai **khoảng ngày + nơi sẽ có mặt**, vd. 10–15/12 ở Hamilton (từ Toronto), "mở nhận booking".
- Tìm kiếm / Quick Quote khớp theo **thành phố + ngày**: nghệ sĩ ở thành phố gốc *hoặc* có chuyến tới thành phố đó vào ngày đó.
- Cần danh sách thành phố mở rộng (Hamilton chưa có) + vùng lân cận.

### R4. Thanh toán qua Olive bằng Stripe, phí nền tảng riêng từng nghệ sĩ
- Tiền (cọc, cát-xê, vé) **chảy về Olive**, Olive chi trả lại nghệ sĩ / venue. Cổng: **Stripe**.
- **Phí nền tảng đặt riêng cho từng nghệ sĩ** (%, có thể kèm mức tối thiểu) – không hiện với khách / venue; admin đặt.
- Đề xuất: Stripe Connect (Olive là platform, nghệ sĩ là connected account, phí = application fee).

### R5. Thẻ xem nhanh khi rê chuột vào tên nghệ sĩ
- Hiện (1) **show diễn gần đây**, (2) **ca khúc nổi bật** của nghệ sĩ.
- Trên điện thoại (không có rê chuột): chạm giữ / nút "xem nhanh" mở cùng nội dung.
- Hồ sơ nghệ sĩ cần thêm **danh sách tiết mục (repertoire)**, đánh dấu bài nổi bật.

### R6. Setlist cố định & yêu cầu bài ngoài danh sách
- Mỗi booking có **setlist đã thoả thuận** chọn từ repertoire của nghệ sĩ – ưu tiên diễn đúng setlist.
- Yêu cầu bài khác: gửi qua platform, nghệ sĩ **chấp nhận / từ chối / báo phí thêm**; ghi vào điều khoản booking.
- **Hợp đồng rõ ràng**: báo giá + setlist + điều khoản + chính sách huỷ được chốt thành bản hợp đồng (lưu phiên bản, 2 bên xác nhận).
- Bản quyền biểu diễn công cộng (VN: VCPMC; CA: SOCAN/Re:Sound) – ghi rõ bên nào chịu trách nhiệm trong hợp đồng.

### R7. Liên hệ & nhắn tin trên platform
- Mọi trao đổi đi qua tin nhắn trên platform (trước và sau khi đặt), lưu lịch sử, admin xem được khi cần hỗ trợ.
- Vì tiền đi qua Olive: **chặn / che SĐT, email, link liên hệ trong tin nhắn** cho tới khi booking `confirmed` (giữ quy tắc ẩn liên hệ ở mục 6).
- Báo cáo / chặn người dùng; thông báo tin nhắn mới qua app + email.

## 9. Bổ sung theo ghi chú họp 2026-11-07 (đã có trong demo)
| Mã | Yêu cầu | Cách làm trong demo | Xem ở đâu |
|---|---|---|---|
| N1 | Trả bằng thẻ tín dụng thì cộng % phụ thu | Khi mua vé hoặc đặt cọc, khách chọn cách trả; bảng tính hiện phí dịch vụ và phụ thu thẻ trước khi bấm thanh toán | `/shows/[id]`, trang booking |
| N2 | Đặt nhiều nghệ sĩ trong một đơn | Form báo giá có mục "Thêm nghệ sĩ vào đơn này"; mỗi nghệ sĩ một yêu cầu, chung mã đơn, trang booking hiện cả đơn và tổng | `/quote?artist=…`, booking `o1-a` |
| N3 | Khách đặt bàn ngay trên website nhà hàng | Widget nhúng bằng iframe: đặt bàn + danh sách đêm nhạc; nhà hàng xác nhận ở tab Đặt bàn | `/embed/venue/[id]`, `/embed/venue/[id]/site` |
| N4 | Bán 50% vé thì show chắc chắn diễn; đổi nghệ sĩ thay thế | Thanh tiến độ có vạch 50%; nhà hàng chọn nghệ sĩ cùng loại còn trống lịch để thay, trang show báo "Thay đổi nghệ sĩ" | `/shows/[id]`, dashboard nhà hàng tab Show bán vé |
| N5 | Admin đặt % Olive thu từ nhà hàng, nghệ sĩ, khách | Tab "Mức thu nền tảng" (chỉ super admin sửa) + thu nhập Olive theo nguồn | `/dashboard/admin?tab=rates` |
| N6 | Combo vé ăn + show và vé chỉ xem show | Nhà hàng đặt giá combo và nội dung; khách chọn loại vé; hoa hồng combo riêng | dashboard nhà hàng, `/shows/[id]` |
| N7 | Server đủ mạnh, bảo mật | Chưa phải tính năng demo – xem đề xuất ở `docs/open-questions.md` | – |
| N8 | Luồng tuyển nghệ sĩ qua cộng tác viên / agency | Vai trò quản lý tuyển nghệ sĩ: danh sách đầu mối, trạng thái, ghi chú; agency đã ký nhận một tài khoản quản lý | `/dashboard/recruiter` |
| N9 | Phân vai vận hành | Olive: super admin, hỗ trợ 1, hỗ trợ 2; quản lý tuyển nghệ sĩ; quản lý nghệ sĩ; nhà hàng; khách. Tab Đội vận hành liệt kê quyền từng vai | `/dashboard/admin?tab=team`, `/dashboard/manager` |

Quy tắc mới (có unit test trong `tests/unit/domain.test.ts`):
- Khách trả = tiền hàng + phí dịch vụ + phụ thu thẻ (chỉ khi trả bằng thẻ). `checkout()` trong `src/server/domain/fees.ts`.
- Hoa hồng vé: vé combo theo mức combo, vé thường theo mức nhà hàng. `ticketCommission()`.
- Show chắc chắn diễn khi số vé bán × 100 ≥ sức chứa × 50. `src/server/domain/shows.ts`.
- Nghệ sĩ thay thế phải khác nghệ sĩ hiện tại, cùng loại hình và còn trống lịch ngày đó.
- Quản lý nghệ sĩ chỉ thấy và thao tác booking của nghệ sĩ mình quản lý; quản lý tuyển nghệ sĩ không thấy booking và tiền.
- Show chưa đạt 50%: nhà hàng huỷ được tới 3 ngày trước ngày diễn, vé hoàn 100%. Khi đổi nghệ sĩ, khách có nút hoàn vé trên trang vé.
- Đặt bàn: trong giờ mở cửa và không vượt số khách tối đa mỗi khung giờ.
- Đơn nhóm: một lần thanh toán cho tiền cọc của mọi nghệ sĩ đã sẵn sàng.
- Giao diện sáng / tối chuyển ở header.
