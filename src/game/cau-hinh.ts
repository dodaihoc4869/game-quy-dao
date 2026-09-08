// GAME QUỸ ĐẠO — MỘT NGUỒN SỰ THẬT CẤU HÌNH (GAME-QUY-DAO.md mục 3).
//
// Mọi hằng số điều chỉnh độ khó nằm ở đây, xuất ra cho test đọc.
// CẤM hard-code số độ khó ở bất kỳ file nào khác.
//
// Toạ độ tính bằng "u": bề rộng màn = BE_RONG_LOGIC u. Không tính bằng pixel,
// nên máy màn to hay nhỏ đều cùng một độ khó.

export const G = {
  BE_RONG_LOGIC: 100,
  BAN_KINH_VONG_DAU: 14,
  BAN_KINH_GIAM_MOI_DIEM: 0.35,
  BAN_KINH_TOI_THIEU: 7,
  KHOANG_CACH_DAU: 36,
  KHOANG_CACH_TANG_MOI_DIEM: 0.6,
  KHOANG_CACH_TOI_DA: 52,
  TOC_DO_QUAY_DAU: 2.2,
  TOC_DO_QUAY_TANG_MOI_DIEM: 0.06,
  TOC_DO_QUAY_TOI_DA: 5.5,
  TOC_DO_BAY_DAU: 70,
  TOC_DO_BAY_TANG_MOI_DIEM: 1.5,
  TOC_DO_BAY_TOI_DA: 110,
  CUA_SO_HOAN_HAO_MS: 100,
  TI_LE_TRAN_HOAN_HAO: 0.45,
  VAN_TRUOC_KHI_MOI_BIET_DANH: 3,
  HOI_LAI_SAU_VAN: 10,
  TOI_DA_BIET_DANH: 12,
  RUNG_MAN_TOI_DA_MS: 120,
  DONG_BANG_MS: 40,
  COMBO_TRAN_CAO_DO: 12,
  TRAN_DIEM_HOP_LE: 400,
} as const

/** Tám hướng đặt vòng kế tiếp, quanh hướng "lên trên" (−π/2).
 *
 * CẤM NGẪU NHIÊN: vị trí vòng sau là hàm thuần của chỉ số điểm. Người chơi
 * thua phải luôn là lỗi của chính mình, không phải do máy bốc trúng thế khó. */
export const GOC_MOC: readonly number[] = [
  -Math.PI / 2,
  -Math.PI / 2 + 0.42,
  -Math.PI / 2 - 0.30,
  -Math.PI / 2 + 0.16,
  -Math.PI / 2 - 0.58,
  -Math.PI / 2 + 0.62,
  -Math.PI / 2 - 0.14,
  -Math.PI / 2 + 0.30,
]

export function gocVongKeTiep(chiSo: number): number {
  return GOC_MOC[((chiSo % GOC_MOC.length) + GOC_MOC.length) % GOC_MOC.length]
}

/** Chiều quay đảo mỗi vòng — để nhịp không thành thuộc lòng một chiều. */
export function chieuQuay(chiSo: number): 1 | -1 {
  return chiSo % 2 === 0 ? 1 : -1
}

export interface MucDo {
  banKinh: number
  khoangCach: number
  tocDoQuay: number
  tocDoBay: number
  /** góc nhả nhỏ nhất còn trúng (rad, tính từ hướng tới vòng sau) */
  uThap: number
  /** góc nhả lớn nhất còn trúng */
  uCao: number
  /** góc nhả tối ưu — đường bay xuyên đúng tâm vòng sau */
  uToiUu: number
  cuaSoTrungMs: number
  cuaSoHoanHaoMs: number
}

/**
 * CỬA SỔ TRÚNG — công thức hình học, không phải số ước lượng.
 *
 * Nhả ở góc lệch `u` so với hướng tới vòng sau thì đường tiếp tuyến cách tâm
 * vòng sau một đoạn `|D·cos u − R|`. Trúng khi đoạn đó ≤ R, tức `0 ≤ D·cos u ≤ 2R`.
 * Thời điểm tối ưu là `cos u = R/D`, LUÔN nằm trong cửa sổ vì `0 < R/D < 2R/D`.
 */
export function mucDo(diem: number): MucDo {
  const d = Math.max(0, diem)
  const banKinh = Math.max(G.BAN_KINH_TOI_THIEU, G.BAN_KINH_VONG_DAU - G.BAN_KINH_GIAM_MOI_DIEM * d)
  const khoangCach = Math.min(G.KHOANG_CACH_TOI_DA, G.KHOANG_CACH_DAU + G.KHOANG_CACH_TANG_MOI_DIEM * d)
  const tocDoQuay = Math.min(G.TOC_DO_QUAY_TOI_DA, G.TOC_DO_QUAY_DAU + G.TOC_DO_QUAY_TANG_MOI_DIEM * d)
  const tocDoBay = Math.min(G.TOC_DO_BAY_TOI_DA, G.TOC_DO_BAY_DAU + G.TOC_DO_BAY_TANG_MOI_DIEM * d)

  const uCao = Math.acos(0)
  const uThap = Math.acos(Math.min(1, (2 * banKinh) / khoangCach))
  const uToiUu = Math.acos(Math.min(1, banKinh / khoangCach))
  const cuaSoTrungMs = ((uCao - uThap) / tocDoQuay) * 1000
  const cuaSoHoanHaoMs = Math.min(G.CUA_SO_HOAN_HAO_MS, G.TI_LE_TRAN_HOAN_HAO * cuaSoTrungMs)

  return { banKinh, khoangCach, tocDoQuay, tocDoBay, uThap, uCao, uToiUu, cuaSoTrungMs, cuaSoHoanHaoMs }
}

/** Điểm cộng cho một cú trúng: 2 nếu HOÀN HẢO, 1 nếu chỉ trúng. */
export function diemCuaCuTrung(m: MucDo, lechToiUuMs: number): 1 | 2 {
  return Math.abs(lechToiUuMs) <= m.cuaSoHoanHaoMs / 2 ? 2 : 1
}
