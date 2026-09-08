// GAME QUỸ ĐẠO — BẢNG XẾP HẠNG (GAME-QUY-DAO.md mục 6).
//
// Một bảng CHUNG toàn trung tâm. Vấn đề của bảng chung là 290 em ngoài top 10
// sẽ bỏ, nên bảng luôn kèm CỬA SỔ LÂN CẬN: 7 dòng quanh đúng hạng của em, để em
// nào cũng có một người ngay trên đầu để vượt.
//
// Hàm thuần, không gọi mạng — test được với 300 người chơi giả.

export interface NguoiChoi {
  /** máy chủ trả về, KHÔNG kèm họ tên thật, KHÔNG kèm SBD của người khác */
  bietDanh: string
  diem: number
  /** chỉ có ở đúng dòng của người đang gọi */
  laToi?: boolean
}

export interface DongBXH extends NguoiChoi {
  hang: number
}

export interface BangXepHang {
  top: DongBXH[]
  lanCan: DongBXH[]
  hangToi: number | null
  tongNguoi: number
}

export const SO_TOP = 10
export const SO_LAN_CAN = 7

/** Xếp hạng: điểm giảm dần, cùng điểm thì theo biệt danh để thứ tự ổn định
 * (không có yếu tố ngẫu nhiên, mở lại bảng vẫn đúng thứ tự đó). */
export function xepHang(ds: NguoiChoi[]): DongBXH[] {
  return [...ds]
    .sort((a, b) => b.diem - a.diem || a.bietDanh.localeCompare(b.bietDanh, 'vi'))
    .map((n, i) => ({ ...n, hang: i + 1 }))
}

export function dungBang(ds: NguoiChoi[], soTop = SO_TOP, soLanCan = SO_LAN_CAN): BangXepHang {
  const xep = xepHang(ds)
  const top = xep.slice(0, soTop)
  const iToi = xep.findIndex((n) => n.laToi)
  if (iToi < 0) return { top, lanCan: [], hangToi: null, tongNguoi: xep.length }

  const hangToi = iToi + 1
  // Em đã nằm trong top thì không cần cửa sổ lân cận nữa, tránh in hai lần.
  if (hangToi <= soTop) return { top, lanCan: [], hangToi, tongNguoi: xep.length }

  const nua = Math.floor(soLanCan / 2)
  let dau = iToi - nua
  if (dau < soTop) dau = soTop            // không lấn vào phần top đã in
  let cuoi = dau + soLanCan
  if (cuoi > xep.length) { cuoi = xep.length; dau = Math.max(soTop, cuoi - soLanCan) }
  return { top, lanCan: xep.slice(dau, cuoi), hangToi, tongNguoi: xep.length }
}
