# Ôn tập Mạng máy tính

Trang tĩnh cho sinh viên làm 484 câu `chosen` trong `DPO_inputs/compnet_dpo_input_result_v2.json`.

```powershell
npm run check
```

Lệnh trên tạo `public/questions.json`; chỉ chứa nội dung `chosen`, không chứa `rejected` hay `context`.

## Nhận báo lỗi

Sửa `public/config.js`, đặt `reportEmail` thành email của người nhận, rồi deploy lại. Khi sinh viên báo lỗi, trang mở thư soạn sẵn và sao chép nội dung báo lỗi vào clipboard.

## Deploy Vercel

Import thư mục này vào Vercel. Framework preset chọn **Other**, Build Command là `npm run build`, Output Directory là `public`.
