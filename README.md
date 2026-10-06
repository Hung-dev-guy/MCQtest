# Ôn tập Mạng máy tính

Trang tĩnh cho sinh viên làm 484 câu `chosen` trong `DPO_inputs/compnet_dpo_input_result_v2.json`.

```powershell
npm run check
```

Lệnh trên tạo `public/questions.json`; chỉ chứa nội dung `chosen`, không chứa `rejected` hay `context`.

## Nhận báo lỗi

Trên Vercel, vào **Storage → Create Database → Blob**, chọn **Private**, rồi gắn Blob Store với project này. Vercel tự thêm `BLOB_READ_WRITE_TOKEN`.

Để đọc danh sách báo lỗi, thêm biến môi trường `REPORTS_ADMIN_KEY` (một chuỗi bí mật tự đặt). Gọi API bằng:

```powershell
curl.exe -H "Authorization: Bearer <REPORTS_ADMIN_KEY>" https://<ten-project>.vercel.app/api/reports
```

Không chia sẻ khóa này với sinh viên.

Hoặc vào `https://<ten-project>.vercel.app/reports.html`, nhập khóa để xem, lọc và mở lại từng câu cần rà soát.

## Deploy Vercel

Import thư mục này vào Vercel. Framework preset chọn **Other**, để trống Build Command, Output Directory là `public`.
