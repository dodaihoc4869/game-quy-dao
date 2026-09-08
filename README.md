# Quỹ đạo

Game một chạm cho học sinh trung tâm Đỗ Đại Học. Viết riêng, **không đấu vào app thi** —
repo riêng, đường Pages riêng, Apps Script riêng, không đọc và không ghi một ô nào của dữ liệu
học tập.

Chơi: **https://dodaihoc4869.github.io/game-quy-dao/**

Cách chơi: chạm để nhả, trúng vòng sau thì được điểm. Không có hướng dẫn, ván đầu chính là
hướng dẫn.

## Bật bảng xếp hạng chung

Mặc định bảng xếp hạng chỉ có mình em, vì chưa có máy chủ. Muốn bảng chung cả trung tâm:

1. Tạo một Google Sheet mới.
2. Tiện ích mở rộng → Apps Script, dán trọn `docs/apps-script-game.gs`.
3. Triển khai → Ứng dụng web → *Thực thi với tư cách: Tôi* · *Ai có quyền truy cập: Bất kỳ ai*.
4. Chép link `/exec`, dán vào `public/cau-hinh-may-chu.json`, rồi push.

Máy chủ chỉ giữ **biệt danh và điểm**. Không họ tên thật, không số báo danh.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | chạy thử tại máy |
| `npm test` | 30 phép kiểm |
| `GITHUB_PAGES=true npm run build` | dựng bản lên Pages |

Đặc tả đầy đủ nằm trong project MASTER DO DAI HOC: `claude/GAME-QUY-DAO.md`.
