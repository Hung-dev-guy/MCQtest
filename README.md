# Ôn tập Mạng máy tính

Trang tĩnh cho sinh viên làm 484 câu `chosen` trong `DPO_inputs/compnet_dpo_input_result_v2.json`.

```powershell
npm run check
```

Lệnh trên tạo `public/questions.json`; chỉ chứa nội dung `chosen`, không chứa `rejected` hay `context`.

## Nhận và rà soát báo lỗi

Trên Vercel, vào **Storage → Marketplace → Neon**, cài integration và kết nối với project. Integration tự thêm `DATABASE_URL`. API tự tạo bảng `mcq_reports` khi có báo lỗi đầu tiên.

Để đọc danh sách báo lỗi, thêm biến môi trường `REPORTS_ADMIN_KEY` (một chuỗi bí mật tự đặt). Gọi API bằng:

```powershell
curl.exe -H "Authorization: Bearer <REPORTS_ADMIN_KEY>" https://<ten-project>.vercel.app/api/reports
```

Không chia sẻ khóa này với sinh viên. Tại `reports.html`, bạn có thể lọc báo lỗi, mở lại câu bị báo và đánh dấu đã xử lý.

Hoặc vào `https://<ten-project>.vercel.app/reports.html`, nhập khóa để xem, lọc và mở lại từng câu cần rà soát.

## Deploy Vercel

Import thư mục này vào Vercel. Framework preset chọn **Other**, để trống Build Command, Output Directory là `public`.
