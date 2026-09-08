import { describe, it, expect } from 'vitest'
import { G, mucDo, gocVongKeTiep, chieuQuay, diemCuaCuTrung, GOC_MOC } from '../src/game/cau-hinh'

describe('cửa sổ trúng — công thức hình học', () => {
  it('thời điểm tối ưu LUÔN nằm trong cửa sổ trúng, mọi mức điểm 0..60', () => {
    for (let d = 0; d <= 60; d++) {
      const m = mucDo(d)
      expect(m.uToiUu).toBeGreaterThanOrEqual(m.uThap - 1e-9)
      expect(m.uToiUu).toBeLessThanOrEqual(m.uCao + 1e-9)
    }
  })

  it('hai vòng không bao giờ chồng lên nhau', () => {
    for (let d = 0; d <= 60; d++) {
      const m = mucDo(d)
      expect(m.khoangCach - 2 * m.banKinh).toBeGreaterThan(4)
    }
  })

  it('ván đầu dễ: cửa sổ trúng trên 350 ms', () => {
    expect(mucDo(0).cuaSoTrungMs).toBeGreaterThan(350)
  })

  it('điểm 20 đã khó: cửa sổ trúng dưới 120 ms', () => {
    expect(mucDo(20).cuaSoTrungMs).toBeLessThan(120)
  })

  it('độ khó tăng đơn điệu: cửa sổ trúng không bao giờ rộng ra', () => {
    for (let d = 1; d <= 60; d++) {
      expect(mucDo(d).cuaSoTrungMs).toBeLessThanOrEqual(mucDo(d - 1).cuaSoTrungMs + 1e-9)
    }
  })

  it('HOÀN HẢO không bao giờ nuốt trọn cửa sổ trúng', () => {
    for (let d = 0; d <= 60; d++) {
      const m = mucDo(d)
      expect(m.cuaSoHoanHaoMs).toBeLessThanOrEqual(G.TI_LE_TRAN_HOAN_HAO * m.cuaSoTrungMs + 1e-9)
      expect(m.cuaSoHoanHaoMs).toBeLessThanOrEqual(G.CUA_SO_HOAN_HAO_MS)
    }
  })

  it('mọi hằng số đều bị chặn bởi trần đã khai', () => {
    const m = mucDo(9999)
    expect(m.banKinh).toBe(G.BAN_KINH_TOI_THIEU)
    expect(m.khoangCach).toBe(G.KHOANG_CACH_TOI_DA)
    expect(m.tocDoQuay).toBe(G.TOC_DO_QUAY_TOI_DA)
    expect(m.tocDoBay).toBe(G.TOC_DO_BAY_TOI_DA)
  })

  it('HOÀN HẢO chỉ tính khi lệch trong nửa cửa sổ', () => {
    const m = mucDo(0)
    expect(diemCuaCuTrung(m, 0)).toBe(2)
    expect(diemCuaCuTrung(m, m.cuaSoHoanHaoMs / 2 - 1)).toBe(2)
    expect(diemCuaCuTrung(m, m.cuaSoHoanHaoMs / 2 + 1)).toBe(1)
  })
})

describe('cấm ngẫu nhiên trong lối chơi', () => {
  it('vị trí vòng kế tiếp là hàm thuần, gọi lại vẫn ra đúng giá trị đó', () => {
    for (let i = 0; i < 50; i++) expect(gocVongKeTiep(i)).toBe(gocVongKeTiep(i))
    expect(gocVongKeTiep(0)).toBe(gocVongKeTiep(GOC_MOC.length))
  })
  it('chiều quay đảo mỗi vòng', () => {
    expect(chieuQuay(0)).toBe(1)
    expect(chieuQuay(1)).toBe(-1)
    expect(chieuQuay(2)).toBe(1)
  })
})
