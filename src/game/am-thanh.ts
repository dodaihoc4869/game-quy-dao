// GAME QUỸ ĐẠO — ÂM THANH (GAME-QUY-DAO.md mục 2).
// Không một tệp âm thanh nào. Tất cả tổng hợp bằng Web Audio ngay trong trình duyệt.
import { G } from './cau-hinh'

export class AmThanh {
  private ctx: AudioContext | null = null

  /** Trình duyệt chỉ cho mở AudioContext sau một thao tác thật của người dùng,
   * nên gọi hàm này ở cú chạm đầu tiên. */
  moKhoa(): void {
    if (this.ctx) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
    } catch { this.ctx = null }
  }

  private keu(tanSo: number, daiGiay: number, dang: OscillatorType, to: number): void {
    const c = this.ctx
    if (!c) return
    try {
      const o = c.createOscillator(), g = c.createGain()
      o.type = dang
      o.frequency.setValueAtTime(tanSo, c.currentTime)
      g.gain.setValueAtTime(0, c.currentTime)
      g.gain.linearRampToValueAtTime(to, c.currentTime + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + daiGiay)
      o.connect(g); g.connect(c.destination)
      o.start(); o.stop(c.currentTime + daiGiay + 0.02)
    } catch { /* máy chặn âm: game vẫn chơi được */ }
  }

  /** CAO ĐỘ TĂNG DẦN THEO CHUỖI COMBO rồi reset khi đứt chuỗi — nửa cung mỗi nấc. */
  trung(combo: number, hoanHao: boolean): void {
    const nac = Math.min(combo, G.COMBO_TRAN_CAO_DO)
    this.keu(392 * Math.pow(2, nac / 12), hoanHao ? 0.16 : 0.10, hoanHao ? 'triangle' : 'sine', hoanHao ? 0.20 : 0.14)
    if (hoanHao) this.keu(392 * Math.pow(2, (nac + 7) / 12), 0.12, 'sine', 0.08)
  }

  chet(): void { this.keu(120, 0.30, 'sawtooth', 0.12) }
}
