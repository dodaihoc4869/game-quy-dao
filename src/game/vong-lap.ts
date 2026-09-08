// GAME QUỸ ĐẠO — VÒNG LẶP (GAME-QUY-DAO.md mục 2 và 4).
//
// TypeScript thuần, KHÔNG import React. Vòng lặp chạy bằng requestAnimationFrame
// trên một thẻ <canvas> duy nhất và CẤM gọi setState — nó chỉ bắn CustomEvent ở
// ba mốc: chết, phá kỷ lục, mời đặt biệt danh.
import { G, mucDo, gocVongKeTiep, chieuQuay, type MucDo } from './cau-hinh'
import { AmThanh } from './am-thanh'

type Pha = 'quay' | 'bay' | 'chet'
interface Hat { x: number; y: number; vx: number; vy: number; doi: number }

const MAU_NEN = '#0b0f1a'
const MAU_VONG = '#2c3a55'
const MAU_DICH = '#6ee7ff'
const MAU_XAM = '#4a5568'
const MAU_CHAM = '#ffffff'

/** Bay thêm bấy nhiêu u sau điểm gần nhất rồi mới chết. Tốc độ bay tối đa
 * 110 u/s nên 20 u luôn ≥ 180 ms — dài hơn 5 khung hình, đúng luật báo trước. */
const BAY_THEM_TRUOC_KHI_CHET = 20

export interface KetThuc { diem: number; comboCaoNhat: number }

export class VongLapGame {
  private ctx: CanvasRenderingContext2D
  private am = new AmThanh()
  private raf = 0
  private lanTruoc = 0
  private dungLai = false

  private pha: Pha = 'quay'
  diem = 0
  private combo = 0
  private comboCaoNhat = 0
  private chiSo = 0

  private c0 = { x: 0, y: 0 }
  private c1 = { x: 0, y: 0 }
  private m: MucDo = mucDo(0)
  private goc = 0
  private chieu: 1 | -1 = 1

  private p = { x: 0, y: 0 }
  private v = { x: 0, y: 0 }
  private dichHong = false
  private dabayU = 0
  private nguongChet = Infinity

  private rung = 0
  private dongBang = 0
  private hat: Hat[] = []
  private cam = { x: 0, y: 0 }
  private tiLe = 1

  private canvas: HTMLCanvasElement
  private banBao: (ten: string, chiTiet?: unknown) => void

  constructor(canvas: HTMLCanvasElement, banBao: (ten: string, chiTiet?: unknown) => void) {
    this.canvas = canvas
    this.banBao = banBao
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Máy không dựng được canvas 2D')
    this.ctx = ctx
    this.datLai()
  }

  batDau(): void {
    this.lanTruoc = performance.now()
    const buoc = (t: number) => {
      if (this.dungLai) return
      const dt = Math.min(0.05, (t - this.lanTruoc) / 1000)
      this.lanTruoc = t
      this.capNhat(dt)
      this.ve()
      this.raf = requestAnimationFrame(buoc)
    }
    this.raf = requestAnimationFrame(buoc)
  }

  huy(): void { this.dungLai = true; cancelAnimationFrame(this.raf) }

  /** MỘT CHẠM: đang quay thì nhả, đã chết thì vào ván mới ngay — không màn trung gian. */
  cham(): void {
    this.am.moKhoa()
    if (this.pha === 'chet') { this.datLai(); return }
    if (this.pha !== 'quay') return
    this.nha()
  }

  private datLai(): void {
    this.pha = 'quay'; this.diem = 0; this.combo = 0; this.comboCaoNhat = 0; this.chiSo = 0
    this.m = mucDo(0)
    this.c0 = { x: 0, y: 0 }
    this.datVongKeTiep()
    this.goc = gocVongKeTiep(0) + Math.PI    // bắt đầu ở phía xa vòng đích
    this.chieu = chieuQuay(0)
    this.hat = []; this.rung = 0; this.dongBang = 0
    this.cam = { x: 0, y: 0 }
  }

  private datVongKeTiep(): void {
    const g = gocVongKeTiep(this.chiSo)
    this.c1 = { x: this.c0.x + this.m.khoangCach * Math.cos(g), y: this.c0.y + this.m.khoangCach * Math.sin(g) }
  }

  private nha(): void {
    // Hướng tiếp tuyến tại vị trí hiện tại, theo chiều đang quay.
    const tx = -Math.sin(this.goc) * this.chieu
    const ty = Math.cos(this.goc) * this.chieu
    this.p = { x: this.c0.x + this.m.banKinh * Math.cos(this.goc), y: this.c0.y + this.m.banKinh * Math.sin(this.goc) }
    this.v = { x: tx * this.m.tocDoBay, y: ty * this.m.tocDoBay }

    // Khoảng cách vuông góc từ tâm vòng đích tới đường bay.
    const dx = this.c1.x - this.p.x, dy = this.c1.y - this.p.y
    const doc = dx * tx + dy * ty                     // chiếu lên hướng bay
    const lech = Math.abs(dx * ty - dy * tx)          // khoảng cách vuông góc
    const trung = doc > 0 && lech <= this.m.banKinh

    this.dichHong = !trung
    this.dabayU = 0
    // Chết ở điểm gần nhất cộng thêm một đoạn, để cú thua luôn thấy trước.
    this.nguongChet = trung ? Infinity : Math.max(0, doc) + BAY_THEM_TRUOC_KHI_CHET
    this.pha = 'bay'
    if (trung) this.lechToiUu = lech
  }

  private lechToiUu = 0

  private capNhat(dt: number): void {
    if (this.dongBang > 0) { this.dongBang -= dt * 1000; return }
    if (this.rung > 0) this.rung = Math.max(0, this.rung - dt * 1000)
    for (const h of this.hat) { h.x += h.vx * dt; h.y += h.vy * dt; h.doi -= dt; h.vx *= 0.94; h.vy *= 0.94 }
    this.hat = this.hat.filter((h) => h.doi > 0)

    if (this.pha === 'quay') {
      this.goc += this.m.tocDoQuay * this.chieu * dt
      this.p = { x: this.c0.x + this.m.banKinh * Math.cos(this.goc), y: this.c0.y + this.m.banKinh * Math.sin(this.goc) }
    } else if (this.pha === 'bay') {
      this.p.x += this.v.x * dt; this.p.y += this.v.y * dt
      this.dabayU += this.m.tocDoBay * dt
      const d = Math.hypot(this.p.x - this.c1.x, this.p.y - this.c1.y)
      if (!this.dichHong && d <= this.m.banKinh) this.batVao()
      else if (this.dabayU >= this.nguongChet) this.chet()
    }
    this.cam.x += (this.p.x - this.cam.x) * Math.min(1, dt * 6)
    this.cam.y += (this.p.y - this.cam.y) * Math.min(1, dt * 6)
  }

  private batVao(): void {
    // HOÀN HẢO tính bằng THỜI GIAN quanh thời điểm tối ưu, đổi từ khoảng lệch:
    // d(lệch)/dθ = D·|sin(θ−φ)| nên Δt ≈ lệch / (D·|sin|·ω).
    const g = gocVongKeTiep(this.chiSo)
    const s = Math.abs(Math.sin(this.goc - g)) || 1
    const lechMs = (this.lechToiUu / (this.m.khoangCach * s * this.m.tocDoQuay)) * 1000
    const hoanHao = lechMs <= this.m.cuaSoHoanHaoMs / 2

    this.diem += hoanHao ? 2 : 1
    this.combo += 1
    this.comboCaoNhat = Math.max(this.comboCaoNhat, this.combo)
    this.am.trung(this.combo, hoanHao)
    this.rung = Math.min(G.RUNG_MAN_TOI_DA_MS, hoanHao ? 120 : 70)
    this.dongBang = G.DONG_BANG_MS
    this.banHat(hoanHao ? 18 : 10)

    this.chiSo += 1
    this.m = mucDo(this.diem)
    this.c0 = { ...this.c1 }
    this.datVongKeTiep()
    this.goc = Math.atan2(this.p.y - this.c0.y, this.p.x - this.c0.x)
    this.chieu = chieuQuay(this.chiSo)
    this.pha = 'quay'
  }

  private banHat(n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3   // chỉ ảnh hưởng hạt, không ảnh hưởng thắng thua
      const t = 22 + Math.random() * 26
      this.hat.push({ x: this.p.x, y: this.p.y, vx: Math.cos(a) * t, vy: Math.sin(a) * t, doi: 0.45 })
    }
  }

  private chet(): void {
    this.pha = 'chet'
    this.combo = 0
    this.am.chet()
    this.rung = G.RUNG_MAN_TOI_DA_MS
    const kq: KetThuc = { diem: this.diem, comboCaoNhat: this.comboCaoNhat }
    this.banBao('game:chet', kq)
  }

  private ve(): void {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height
    this.tiLe = w / G.BE_RONG_LOGIC
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.fillStyle = MAU_NEN
    c.fillRect(0, 0, w, h)

    const rx = this.rung > 0 ? (Math.random() - 0.5) * (this.rung / 30) : 0
    const ry = this.rung > 0 ? (Math.random() - 0.5) * (this.rung / 30) : 0
    c.setTransform(this.tiLe, 0, 0, this.tiLe, w / 2 - this.cam.x * this.tiLe + rx, h * 0.62 - this.cam.y * this.tiLe + ry)

    const vong = (cx: number, cy: number, r: number, mau: string, day: number) => {
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2)
      c.strokeStyle = mau; c.lineWidth = day; c.stroke()
    }
    vong(this.c0.x, this.c0.y, this.m.banKinh, MAU_VONG, 1.6)
    vong(this.c1.x, this.c1.y, this.m.banKinh, this.dichHong && this.pha !== 'quay' ? MAU_XAM : MAU_DICH, 2.2)

    for (const hat of this.hat) {
      c.globalAlpha = Math.max(0, hat.doi / 0.45)
      c.fillStyle = MAU_DICH
      c.fillRect(hat.x - 0.7, hat.y - 0.7, 1.4, 1.4)
    }
    c.globalAlpha = 1

    c.beginPath(); c.arc(this.p.x, this.p.y, 2.6, 0, Math.PI * 2)
    c.fillStyle = MAU_CHAM; c.fill()

    c.setTransform(1, 0, 0, 1, 0, 0)
    c.fillStyle = '#ffffff'
    c.font = `600 ${Math.round(w * 0.11)}px system-ui, sans-serif`
    c.textAlign = 'center'
    c.fillText(String(this.diem), w / 2, h * 0.16)
    if (this.combo >= 3) {
      c.font = `500 ${Math.round(w * 0.04)}px system-ui, sans-serif`
      c.fillStyle = MAU_DICH
      c.fillText(`×${this.combo}`, w / 2, h * 0.21)
    }
  }
}
