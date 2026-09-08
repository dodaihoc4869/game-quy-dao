/**
 * GAME QUỸ ĐẠO — BẢNG XẾP HẠNG CHUNG.
 *
 * Apps Script RIÊNG của game. KHÔNG dán vào project Apps Script của app thi:
 * game viết riêng, không đấu vào app, không đọc và không ghi một ô nào của
 * BangDiem, dulieu.json, TienDoHS, QidDaLam hay bất kỳ dữ liệu học tập nào.
 *
 * Máy chủ chỉ biết BIỆT DANH và ĐIỂM. Không có họ tên thật, không có số báo danh.
 *
 * CÁCH DÙNG
 *   1. Tạo một Google Sheet mới, đặt tên tuỳ ý.
 *   2. Tiện ích mở rộng → Apps Script, dán trọn file này vào.
 *   3. Triển khai → Ứng dụng web → Thực thi với tư cách: Tôi ·
 *      Ai có quyền truy cập: Bất kỳ ai. Chép link /exec.
 *   4. Dán link đó vào public/cau-hinh-may-chu.json rồi push.
 */

var TEN_SHEET = 'GameDiem';
var TRAN_DIEM_HOP_LE = 400;
var TOI_DA_BIET_DANH = 12;
var GIAY_GIUA_HAI_LAN_GHI = 20;
var SO_TOP = 10;
var SO_LAN_CAN = 7;

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) { return tra({ ok: false }); }
  if (d.action === 'gameGuiDiem') return tra(guiDiem(d));
  if (d.action === 'gameBangXepHang') return tra(bangXepHang(d));
  return tra({ ok: false });
}

function doGet() { return tra({ ok: true, ten: 'game-quy-dao' }); }

function tra(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TEN_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TEN_SHEET);
    sh.appendRow(['Ma', 'Tuan', 'MaMay', 'BietDanh', 'Diem', 'CapNhatLuc']);
  }
  return sh;
}

/** Tuần bắt đầu 00:00 thứ Hai, giờ Việt Nam. Dạng 2026-W37. */
function khoaTuan() {
  var now = new Date();
  var vn = new Date(now.getTime() + 7 * 3600000);
  var t = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  var thu = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - thu + 3);
  var nam = t.getUTCFullYear();
  var tn1 = new Date(Date.UTC(nam, 0, 4));
  tn1.setUTCDate(tn1.getUTCDate() - ((tn1.getUTCDay() + 6) % 7) + 3);
  var so = 1 + Math.round((t.getTime() - tn1.getTime()) / (7 * 86400000));
  return nam + '-W' + (so < 10 ? '0' + so : so);
}

/**
 * NĂM KHOÁ — lệnh này là lệnh ghi công khai, nên bó chặt:
 *   1. maMay phải là chuỗi 16–64 ký tự chữ và số. Máy khách không tự khai được ai.
 *   2. diem phải nguyên, 0 < diem <= TRAN_DIEM_HOP_LE.
 *   3. CHỈ GHI KHI LỚN HƠN điểm đang lưu của đúng (tuần, máy).
 *   4. bietDanh cắt cứng ở MÁY CHỦ, không tin máy khách cắt hộ.
 *   5. Mỗi máy tối đa một lần ghi trong GIAY_GIUA_HAI_LAN_GHI giây.
 * Sai khoá nào cũng trả cùng một câu, không nói sai ở đâu.
 */
function guiDiem(d) {
  var maMay = String(d.maMay || '');
  if (!/^[0-9a-zA-Z]{16,64}$/.test(maMay)) return { ok: false, loi: 'Không gửi được điểm' };

  var diem = d.diem;
  if (typeof diem !== 'number' || diem !== Math.floor(diem) || diem <= 0 || diem > TRAN_DIEM_HOP_LE) {
    return { ok: false, loi: 'Không gửi được điểm' };
  }

  var bietDanh = String(d.bietDanh || '').replace(/\s+/g, ' ').trim().slice(0, TOI_DA_BIET_DANH);
  if (!bietDanh) return { ok: false, loi: 'Không gửi được điểm' };

  var cache = CacheService.getScriptCache();
  var khoaNhip = 'nhip_' + maMay;
  if (cache.get(khoaNhip)) return { ok: false, loi: 'Không gửi được điểm' };
  cache.put(khoaNhip, '1', GIAY_GIUA_HAI_LAN_GHI);

  var khoa = LockService.getScriptLock();
  try { khoa.waitLock(8000); } catch (err) { return { ok: false, loi: 'Không gửi được điểm' }; }
  try {
    var sh = sheet();
    var tuan = khoaTuan();
    var ma = tuan + '|' + maMay;
    var v = sh.getDataRange().getValues();
    for (var i = 1; i < v.length; i++) {
      if (String(v[i][0]) === ma) {
        if (Number(v[i][4]) >= diem) return { ok: true, ghiDe: false };
        sh.getRange(i + 1, 4, 1, 3).setValues([[bietDanh, diem, new Date()]]);
        return { ok: true, ghiDe: true };
      }
    }
    sh.appendRow([ma, tuan, maMay, bietDanh, diem, new Date()]);
    return { ok: true, ghiDe: false };
  } finally {
    khoa.releaseLock();
  }
}

/** Trả TOP 10 và cửa sổ 7 dòng quanh hạng của chính máy đang gọi.
 * KHÔNG trả maMay của người khác ra ngoài. */
function bangXepHang(d) {
  var maMay = String(d.maMay || '');
  var tuan = khoaTuan();
  var v = sheet().getDataRange().getValues();
  var ds = [];
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][1]) !== tuan) continue;
    ds.push({ bietDanh: String(v[i][3]), diem: Number(v[i][4]), laToi: String(v[i][2]) === maMay });
  }
  ds.sort(function (a, b) { return b.diem - a.diem || (a.bietDanh < b.bietDanh ? -1 : 1); });

  var iToi = -1;
  for (var j = 0; j < ds.length; j++) if (ds[j].laToi) { iToi = j; break; }

  var ra = ds.slice(0, SO_TOP);
  if (iToi >= SO_TOP) {
    var dau = Math.max(SO_TOP, iToi - Math.floor(SO_LAN_CAN / 2));
    var cuoi = Math.min(ds.length, dau + SO_LAN_CAN);
    dau = Math.max(SO_TOP, cuoi - SO_LAN_CAN);
    ra = ra.concat(ds.slice(dau, cuoi));
  }
  return { ok: true, tuan: tuan, tong: ds.length, danhSach: ra };
}
