// GAME QUỸ ĐẠO — KỶ LỤC TRONG MÁY (GAME-QUY-DAO.md mục 4).
//
// Kỷ lục ghi THEO MÁY, không theo tài khoản. Nhờ vậy em chơi thử chưa đăng nhập
// vẫn có kỷ lục, và khi đăng nhập thì mang nguyên con số đó theo — CẤM gán lại 0
// ở bất kỳ nhánh nào.
//
// Mọi hàm quyết định đều THUẦN để test được mà không cần IndexedDB.

import { G } from './cau-hinh'

export interface BanGhiGame {
  tuan: string
  kyLucTuan: number
  kyLucMoiThoi: number
  bietDanh: string
  soVanDaChoi: number
  /** đã mời đặt biệt danh lần nào chưa */
  daMoi: boolean
  /** số ván tại thời điểm mời gần nhất, để 10 ván sau mới hỏi lại */
  vanLucMoi: number
  /** điểm chờ gửi khi mất mạng */
  hangDoi: { tuan: string; diem: number }[]
}

export function banGhiTrong(tuan: string): BanGhiGame {
  return { tuan, kyLucTuan: 0, kyLucMoiThoi: 0, bietDanh: '', soVanDaChoi: 0, daMoi: false, vanLucMoi: -1, hangDoi: [] }
}

/** KHOÁ TUẦN theo giờ Việt Nam, tuần bắt đầu 00:00 thứ Hai. Dạng `2026-W37`.
 *
 * Không dùng giờ máy: em chỉnh đồng hồ máy hay đi nước khác vẫn phải cùng một
 * mốc tuần với cả trung tâm. */
export function khoaTuan(luc: Date = new Date()): string {
  const vn = new Date(luc.getTime() + 7 * 3600_000)
  const y = vn.getUTCFullYear(), m = vn.getUTCMonth(), d = vn.getUTCDate()
  const t = new Date(Date.UTC(y, m, d))
  // ISO: thứ Năm cùng tuần quyết định năm và số tuần
  const thu = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - thu + 3)
  const namISO = t.getUTCFullYear()
  const thuNam1 = new Date(Date.UTC(namISO, 0, 4))
  const lech = (thuNam1.getUTCDay() + 6) % 7
  thuNam1.setUTCDate(thuNam1.getUTCDate() - lech + 3)
  const soTuan = 1 + Math.round((t.getTime() - thuNam1.getTime()) / (7 * 86400_000))
  return `${namISO}-W${String(soTuan).padStart(2, '0')}`
}

/** SANG TUẦN MỚI: kỷ lục tuần về 0, BIỆT DANH GIỮ NGUYÊN, kỷ lục mọi thời giữ. */
export function apDungTuan(b: BanGhiGame, tuanHienTai: string): BanGhiGame {
  if (b.tuan === tuanHienTai) return b
  return { ...b, tuan: tuanHienTai, kyLucTuan: 0 }
}

export interface KetQuaVan {
  banGhi: BanGhiGame
  phaKyLuc: boolean
  moiBietDanh: boolean
  /** điểm cần gửi lên máy chủ, null nghĩa là không gửi */
  canGui: number | null
}

/** GHI NHẬN MỘT VÁN VỪA XONG. Hàm thuần. */
export function ghiNhanVan(b0: BanGhiGame, diem: number, tuanHienTai: string): KetQuaVan {
  const b = apDungTuan(b0, tuanHienTai)
  const soVan = b.soVanDaChoi + 1
  const phaKyLuc = diem > b.kyLucTuan
  const kyLucTuan = Math.max(b.kyLucTuan, diem)
  const kyLucMoiThoi = Math.max(b.kyLucMoiThoi, diem)

  // Mời đặt biệt danh: sau ván thứ 3, HOẶC ngay lần đầu phá kỷ lục — cái nào
  // đến trước. Em bỏ qua thì HOI_LAI_SAU_VAN ván sau mới hỏi lại.
  const chuaCoTen = !b.bietDanh
  const denHan = !b.daMoi
    ? soVan >= G.VAN_TRUOC_KHI_MOI_BIET_DANH || (phaKyLuc && b.kyLucTuan > 0)
    : soVan - b.vanLucMoi >= G.HOI_LAI_SAU_VAN
  const moiBietDanh = chuaCoTen && denHan

  return {
    banGhi: {
      ...b,
      soVanDaChoi: soVan,
      kyLucTuan,
      kyLucMoiThoi,
      daMoi: b.daMoi || moiBietDanh,
      vanLucMoi: moiBietDanh ? soVan : b.vanLucMoi,
    },
    phaKyLuc,
    moiBietDanh,
    // Chỉ gửi khi phá kỷ lục TUẦN và em đã có biệt danh. Không gửi mỗi ván.
    canGui: phaKyLuc && b.bietDanh ? diem : null,
  }
}

/** Cắt biệt danh đúng luật ở máy khách; máy chủ vẫn cắt lại, không tin máy khách. */
export function chuanHoaBietDanh(s: string): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, G.TOI_DA_BIET_DANH)
}

/* ---------- cất giữ, bọc try/catch, hỏng thì vẫn chơi được ---------- */

const KHOA = 'ddh_game_quy_dao_v1'

export function docBanGhiTho(doc: () => string | null, tuan: string): BanGhiGame {
  try {
    const raw = doc()
    if (!raw) return banGhiTrong(tuan)
    return apDungTuan({ ...banGhiTrong(tuan), ...JSON.parse(raw) }, tuan)
  } catch {
    return banGhiTrong(tuan)
  }
}

export function docBanGhi(tuan = khoaTuan()): BanGhiGame {
  return docBanGhiTho(() => localStorage.getItem(KHOA), tuan)
}

export function ghiBanGhi(b: BanGhiGame): void {
  try { localStorage.setItem(KHOA, JSON.stringify(b)) } catch { /* máy chặn lưu: vẫn chơi được */ }
}
