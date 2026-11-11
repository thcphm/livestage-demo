# Câu hỏi chưa chốt

Cập nhật khi có câu trả lời (chuyển kết luận sang `decisions.md`).

## Kỹ thuật
- [x] Tech stack → Next.js + Supabase + Vercel (xem `decisions.md` 2026-10-30).
- [ ] Hosting: có bắt buộc dùng hạ tầng sẵn có của Olive (vd. SiteGround – shared PHP, không hợp Node) không? Ngân sách production ~45–70 USD/tháng có ổn không?
- [x] Web trước, app mobile sau → web responsive + PWA nhẹ.
- [x] Đăng nhập → email + mật khẩu + magic link trong MVP; Google sau; Zalo/OTP để sau.
- [ ] Tên miền & địa chỉ email gửi đi (vd. `livestage.vn`, `no-reply@...`)?

## Thanh toán
- [x] MVP bắt đầu bằng ghi nhận thủ công (adapter `manual`), cổng thật ở giai đoạn 6.
- [ ] Ra mắt khu vực nào trước (VN hay CA)? – quyết định cổng làm trước.
- [ ] Cổng: đề xuất PayOS (VN) + Stripe (CA); VNPay/MoMo/PayPal sau; Interac đối soát thủ công. Có đồng ý?
- [ ] Olive đã có pháp nhân ở VN / CA chưa? Tiền cọc & tiền vé đi vào tài khoản Olive rồi chi trả lại, hay chuyển thẳng? (VN: giữ tiền hộ có thể vướng giấy phép trung gian thanh toán.)
- [ ] Phí nền tảng / hoa hồng của Olive là bao nhiêu, thu trên khoản nào (cát-xê, vé, phí dịch vụ cộng thêm cho người mua)?
- [ ] Hoàn cọc khi huỷ: tự động theo 3 mức chính sách hay admin duyệt từng ca? Show huỷ thì Olive hoàn vé cho khán giả (như demo)?
- [ ] Luồng slot: nghệ sĩ nhận 1-click là chốt, không cọc – cát-xê nhà hàng trả trực tiếp ngoài hệ thống? Doanh thu vé thuộc nhà hàng?
- [ ] Giá vé đã gồm thuế (VAT / GST-HST-QST) chưa?

## Nghiệp vụ
- [x] Duyệt nghệ sĩ → hồ sơ mới `pending`, admin Olive duyệt mới hiện công khai; admin cấp tay Verified / Top Performer.
- [x] Thông báo → MVP: email + trong app. Zalo OA / SMS / push sau.
- [x] Khán giả đánh giá show → không làm trong MVP. (Lưu ý: `clientReview` trong demo thực ra là **nghệ sĩ đánh giá nhà hàng**.)
- [x] Hoá đơn → MVP chỉ gửi biên nhận qua email; hoá đơn VAT/GST để sau.
- [x] Upload media → upload ảnh (avatar, bìa, vài ảnh); video/audio nhúng link YouTube/TikTok/SoundCloud.
- [ ] Đổi lịch có cần bên kia đồng ý không? Giữ tính năng thương lượng giá (counter-offer) trong MVP không?

## Họp 2026-10-30 (yêu cầu R1–R7 trong `features.md` mục 8)
- [x] Dòng tiền → qua Olive, dùng Stripe; phí nền tảng đặt riêng từng nghệ sĩ.
- [ ] Stripe **không mở tài khoản cho doanh nghiệp tại Việt Nam**. Olive có pháp nhân ở Canada (hoặc nước Stripe hỗ trợ) không? Khu vực VN thu tiền thế nào – Stripe (thẻ quốc tế, tài khoản Canada) hay giữ PayOS / chuyển khoản cho VN?
- [ ] Ra mắt Canada trước? (ví dụ Toronto → Hamilton gợi ý vậy)
- [ ] Phí nền tảng: thu trên khoản nào (cát-xê, vé, cả hai), ai trả (trừ vào nghệ sĩ hay cộng vào khách)? Nghệ sĩ có thấy mức phí của mình không? Khi nào Olive chi trả cho nghệ sĩ (sau show bao lâu)?
- [ ] Khách cá nhân cần tài khoản (đề xuất: có, đăng ký nhẹ bằng magic link) hay đặt bằng email như mua vé?
- [ ] Lịch công khai: sự kiện riêng hiện thế nào (đề xuất: "Sự kiện riêng · thành phố")?
- [ ] Danh sách thành phố: thêm những thành phố nào (Hamilton, Mississauga, Ottawa…)? Khớp theo "vùng" (vd. GTA) hay theo bán kính km?
- [ ] Hợp đồng: Olive có mẫu hợp đồng / điều khoản chuẩn không? Cần ký điện tử hay bấm "Đồng ý" là đủ?
- [ ] Bài ngoài setlist: nghệ sĩ được báo phí thêm không? Yêu cầu tại chỗ (trong show) có xử lý trên platform không, hay chỉ trước show?

## Pháp lý
- [ ] Điều khoản sử dụng & chính sách bảo mật cho 2 thị trường VN và Canada.
- [ ] Có cần tiếng Pháp cho Montréal (luật Québec) không?

## Họp 7/11 – cần chốt
- [ ] Các mức % Olive thu (nghệ sĩ, nhà hàng, khách, phụ thu thẻ, combo): con số thật là bao nhiêu? Khác nhau giữa VN và Canada không?
- [ ] Phụ thu thẻ tín dụng: ở Canada được phép nhưng phải báo trước và có trần theo quy định của mạng thẻ; ở Việt Nam cần kiểm tra quy định. Cần tư vấn pháp lý trước khi bật thật.
- [ ] Ngưỡng 50%: nếu tới hạn mà chưa đủ 50% thì ai quyết định huỷ, hạn chót là bao lâu trước giờ diễn, hoàn tiền thế nào?
- [ ] Đổi nghệ sĩ: khách có được hoàn vé khi show đổi nghệ sĩ không, trong bao lâu?
- [ ] Combo ăn tối + show: tiền phần ăn đi qua Olive hay nhà hàng thu trực tiếp? Hoa hồng tính trên cả combo hay chỉ phần show?
- [ ] Đặt bàn qua widget: có thu cọc giữ bàn không?
- [ ] Đơn nhóm: một lần đặt cọc chung hay cọc riêng từng nghệ sĩ (demo đang là riêng)?
- [ ] Tài khoản agency: một agency quản lý nhiều nghệ sĩ thì tiền trả về agency hay từng nghệ sĩ?
- [ ] Hạ tầng (server đủ mạnh cho database, lượng truy cập, bảo mật): dự kiến bao nhiêu người dùng cùng lúc? Đề xuất hiện tại: Vercel Pro + Supabase Pro (có sao lưu hằng ngày, RLS, mã hoá), Stripe giữ dữ liệu thẻ nên hệ thống không lưu số thẻ; cần thêm giới hạn tần suất, nhật ký truy cập admin, kiểm thử tải trước khi mở.
