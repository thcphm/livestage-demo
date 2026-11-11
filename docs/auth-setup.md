# Cài đặt Supabase & Auth

Áp dụng cho project **dev** (`livestage-dev`). Project production làm tương tự, khác ở các mục ghi chú.

## 1. Tạo project
1. supabase.com → **New project** · Name `livestage-dev` · Region **Southeast Asia (Singapore)** · Plan Free.
2. Lưu mật khẩu database vào trình quản lý mật khẩu.

## 2. Điền `.env.local`
Sao chép `.env.example` → `.env.local`, điền:
| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings → API Keys → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Project Settings → API Keys → secret key (`sb_secret_…`) – **chỉ dùng phía server** |
| `DATABASE_URL` | Nút **Connect** → Transaction pooler (cổng 6543), thay `[YOUR-PASSWORD]` |
| `SEED_PASSWORD` | Tự đặt (≥ 8 ký tự) – mật khẩu cho mọi tài khoản demo khi seed |

Không dán key vào chat / issue / commit.

## 3. Cài đặt Auth (Dashboard → Authentication)
- **Sign In / Providers → Email**: bật. Dev: **tắt "Confirm email"** (để đăng ký thử & chạy e2e). Production: **bật**.
- **URL Configuration**: Site URL `http://localhost:3000` (production: domain thật). Redirect URLs: `http://localhost:3000/**` (production: `https://<domain>/**`).
- **Passwords**: độ dài tối thiểu 8 (khớp form).

## 4. Tạo bảng & dữ liệu
```bash
pnpm db:migrate
pnpm db:seed
```
- `db:migrate` chạy các file trong `src/server/db/migrations/` (mọi bảng bật RLS, không policy → API công khai của Supabase không đọc được).
- `db:seed` tạo 27 tài khoản demo (vd. `jazz@demo.com`, `thaovy@demo.com`, `admin@demo.com`) với mật khẩu `SEED_PASSWORD`. **Chỉ chạy trên project dev.**
- Admin thật: `pnpm admin:create ten@olive.vn` → in ra link một lần để admin tự đặt mật khẩu.

## 5. Mẫu email (Authentication → Emails)
Mẫu mặc định dùng link `?code=` (PKCE) – chỉ mở được trên **cùng trình duyệt** đã đăng ký. Thay bằng link `token_hash` để mở được ở bất kỳ đâu. `{{ .RedirectTo }}` là URL app truyền vào (đã chứa `/api/auth/callback?next=/<locale>/...`).

**Confirm signup** – Subject: `Xác nhận tài khoản LiveStage · Confirm your LiveStage account`
```html
<p>Chào bạn, bấm vào link dưới đây để kích hoạt tài khoản LiveStage.</p>
<p>Hi, click the link below to activate your LiveStage account.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Kích hoạt tài khoản · Activate account</a></p>
<p>Nếu bạn không đăng ký, hãy bỏ qua email này. · If you didn’t sign up, ignore this email.</p>
```

**Magic Link** – Subject: `Link đăng nhập LiveStage · Your LiveStage login link`
```html
<p>Bấm để đăng nhập LiveStage. Link chỉ dùng được một lần.</p>
<p>Click to log in to LiveStage. The link works once.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Đăng nhập · Log in</a></p>
```

**Reset Password** – Subject: `Đặt lại mật khẩu LiveStage · Reset your LiveStage password`
```html
<p>Bấm để đặt mật khẩu mới cho tài khoản LiveStage.</p>
<p>Click to choose a new password for your LiveStage account.</p>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery">Đặt lại mật khẩu · Reset password</a></p>
<p>Nếu bạn không yêu cầu, hãy bỏ qua email này. · If you didn’t ask for this, ignore this email.</p>
```

## 6. Giới hạn cần biết
- SMTP mặc định của Supabase chỉ gửi **vài email/giờ** và chỉ tới địa chỉ thành viên team ở một số gói. Trước khi ra mắt: Authentication → SMTP Settings → dùng Resend (giai đoạn 4/6).
- Gói Free tạm dừng project sau ~1 tuần không có truy cập; vào Dashboard bấm Restore.
