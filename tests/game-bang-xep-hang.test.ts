import { describe, it, expect } from 'vitest'
import { dungBang, xepHang, type NguoiChoi } from '../src/game/bang-xep-hang'

/** 300 người chơi giả, điểm giảm dần đều nên hạng đoán trước được. */
function ba_tram(hangCuaToi: number): NguoiChoi[] {
  return Array.from({ length: 300 }, (_, i) => ({
    bietDanh: `em${String(i + 1).padStart(3, '0')}`,
    diem: 400 - i,
    laToi: i + 1 === hangCuaToi,
  }))
}

describe('bảng xếp hạng chung + cửa sổ lân cận', () => {
  it('em hạng 187 thấy TOP 10 và thấy đúng các hạng 184–190', () => {
    const b = dungBang(ba_tram(187))
    expect(b.tongNguoi).toBe(300)
    expect(b.hangToi).toBe(187)
    expect(b.top.map((d) => d.hang)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(b.lanCan.map((d) => d.hang)).toEqual([184, 185, 186, 187, 188, 189, 190])
    expect(b.lanCan.filter((d) => d.laToi).map((d) => d.hang)).toEqual([187])
  })

  it('em hạng 300 (cuối bảng) vẫn thấy đủ 7 dòng và thấy hạng mình', () => {
    const b = dungBang(ba_tram(300))
    expect(b.hangToi).toBe(300)
    expect(b.lanCan).toHaveLength(7)
    expect(b.lanCan[b.lanCan.length - 1].hang).toBe(300)
  })

  it('em hạng 11, ngay dưới top, không bị lấn vào phần top', () => {
    const b = dungBang(ba_tram(11))
    expect(b.hangToi).toBe(11)
    expect(Math.min(...b.lanCan.map((d) => d.hang))).toBeGreaterThan(10)
  })

  it('em trong top 10 thì không in lại ở phần lân cận', () => {
    const b = dungBang(ba_tram(4))
    expect(b.hangToi).toBe(4)
    expect(b.lanCan).toEqual([])
    expect(b.top.filter((d) => d.laToi).map((d) => d.hang)).toEqual([4])
  })

  it('chưa đăng nhập thì vẫn xem được TOP 10, hạng của mình là null', () => {
    const ds = ba_tram(0)
    const b = dungBang(ds)
    expect(b.hangToi).toBeNull()
    expect(b.top).toHaveLength(10)
  })

  it('thứ tự ổn định khi trùng điểm — mở lại bảng không đảo lung tung', () => {
    const ds: NguoiChoi[] = [
      { bietDanh: 'cuong', diem: 10 }, { bietDanh: 'an', diem: 10 }, { bietDanh: 'binh', diem: 10 },
    ]
    expect(xepHang(ds).map((d) => d.bietDanh)).toEqual(xepHang([...ds].reverse()).map((d) => d.bietDanh))
  })

  it('bảng ít hơn 10 người vẫn chạy', () => {
    const b = dungBang([{ bietDanh: 'a', diem: 5, laToi: true }])
    expect(b.top).toHaveLength(1)
    expect(b.hangToi).toBe(1)
  })
})
