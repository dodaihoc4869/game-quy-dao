import { describe, it, expect } from 'vitest'
import { G } from '../src/game/cau-hinh'
import { banGhiTrong, khoaTuan, apDungTuan, ghiNhanVan, chuanHoaBietDanh, docBanGhiTho } from '../src/game/luu-tru'

const T = '2026-W37'

describe('khoá tuần theo giờ Việt Nam', () => {
  it('thứ Hai 00:00 giờ VN đã là tuần mới', () => {
    // 07-09-2026 là thứ Hai. 00:00 VN = 17:00 UTC ngày 06-09.
    const chuNhat = khoaTuan(new Date('2026-09-06T16:59:00Z'))
    const thuHai = khoaTuan(new Date('2026-09-06T17:00:00Z'))
    expect(thuHai).not.toBe(chuNhat)
  })
  it('cùng một tuần thì mọi ngày ra cùng khoá', () => {
    const a = khoaTuan(new Date('2026-09-07T02:00:00Z'))
    const b = khoaTuan(new Date('2026-09-11T15:00:00Z'))
    expect(a).toBe(b)
    expect(a).toMatch(/^\d{4}-W\d{2}$/)
  })
})

describe('kỷ lục chơi thử phải mang theo được', () => {
  it('chơi 3 ván chưa đăng nhập rồi đặt biệt danh: kỷ lục KHÔNG về 0', () => {
    let b = banGhiTrong(T)
    for (const d of [12, 42, 7]) b = ghiNhanVan(b, d, T).banGhi
    const truoc = b.kyLucTuan
    expect(truoc).toBe(42)
    // đặt biệt danh = chỉ gắn thêm tên, không đụng tới kỷ lục
    b = { ...b, bietDanh: chuanHoaBietDanh('Cường 12A2') }
    expect(b.kyLucTuan).toBe(truoc)
    expect(b.kyLucMoiThoi).toBe(42)
  })

  it('sang tuần mới: kỷ lục tuần về 0, BIỆT DANH và kỷ lục mọi thời còn nguyên', () => {
    let b = banGhiTrong(T)
    b = ghiNhanVan(b, 42, T).banGhi
    b = { ...b, bietDanh: 'cuong' }
    const sau = apDungTuan(b, '2026-W38')
    expect(sau.kyLucTuan).toBe(0)
    expect(sau.bietDanh).toBe('cuong')
    expect(sau.kyLucMoiThoi).toBe(42)
    expect(sau.tuan).toBe('2026-W38')
  })
})

describe('lời mời đặt biệt danh', () => {
  it('mời sau ván thứ 3 nếu chưa phá kỷ lục lần nào', () => {
    let b = banGhiTrong(T)
    const r1 = ghiNhanVan(b, 5, T); b = r1.banGhi
    const r2 = ghiNhanVan(b, 3, T); b = r2.banGhi
    const r3 = ghiNhanVan(b, 4, T); b = r3.banGhi
    expect([r1.moiBietDanh, r2.moiBietDanh, r3.moiBietDanh]).toEqual([false, false, true])
  })

  it('mời NGAY khi phá kỷ lục lần đầu, dù mới ván thứ 2', () => {
    let b = banGhiTrong(T)
    b = ghiNhanVan(b, 5, T).banGhi
    const r = ghiNhanVan(b, 9, T)
    expect(r.phaKyLuc).toBe(true)
    expect(r.moiBietDanh).toBe(true)
  })

  it('em bỏ qua thì im, đúng 10 ván sau mới hỏi lại', () => {
    let b = banGhiTrong(T)
    for (let i = 0; i < G.VAN_TRUOC_KHI_MOI_BIET_DANH; i++) b = ghiNhanVan(b, 1, T).banGhi
    expect(b.daMoi).toBe(true)
    const moiLai: number[] = []
    for (let i = 0; i < 12; i++) {
      const r = ghiNhanVan(b, 1, T); b = r.banGhi
      if (r.moiBietDanh) moiLai.push(b.soVanDaChoi)
    }
    expect(moiLai).toEqual([13])
  })

  it('đã có biệt danh rồi thì không mời nữa', () => {
    let b = { ...banGhiTrong(T), bietDanh: 'cuong' }
    for (let i = 0; i < 30; i++) {
      const r = ghiNhanVan(b, i, T); b = r.banGhi
      expect(r.moiBietDanh).toBe(false)
    }
  })
})

describe('chỉ gửi máy chủ khi phá kỷ lục tuần', () => {
  it('ván thua kỷ lục thì không gửi', () => {
    let b = { ...banGhiTrong(T), bietDanh: 'cuong' }
    b = ghiNhanVan(b, 20, T).banGhi
    expect(ghiNhanVan(b, 19, T).canGui).toBeNull()
    expect(ghiNhanVan(b, 21, T).canGui).toBe(21)
  })
  it('chưa có biệt danh thì chưa gửi gì lên máy chủ', () => {
    const b = banGhiTrong(T)
    expect(ghiNhanVan(b, 50, T).canGui).toBeNull()
  })
})

describe('biệt danh', () => {
  it('cắt đúng 12 ký tự và gọn khoảng trắng', () => {
    expect(chuanHoaBietDanh('  Nguyen   Van Cuong 12A2  ')).toBe('Nguyen Van C')
    expect(chuanHoaBietDanh('abc').length).toBe(3)
  })
})

describe('đọc bản ghi hỏng thì vẫn chơi được', () => {
  it('chuỗi rác trả về bản ghi trống, không ném lỗi', () => {
    expect(docBanGhiTho(() => '{{{ hỏng', T)).toEqual(banGhiTrong(T))
    expect(docBanGhiTho(() => null, T).kyLucTuan).toBe(0)
  })
  it('bản ghi của tuần cũ được đưa về tuần hiện tại ngay lúc đọc', () => {
    const cu = JSON.stringify({ ...banGhiTrong('2026-W30'), kyLucTuan: 99, kyLucMoiThoi: 99, bietDanh: 'cuong' })
    const b = docBanGhiTho(() => cu, T)
    expect(b.kyLucTuan).toBe(0)
    expect(b.kyLucMoiThoi).toBe(99)
    expect(b.bietDanh).toBe('cuong')
  })
})
