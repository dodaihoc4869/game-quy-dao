// GAME QUỸ ĐẠO — VỎ REACT (GAME-QUY-DAO.md mục 6).
//
// React CHỈ gắn canvas một lần và dựng lớp phủ. Vòng lặp game không đi qua
// React: nó bắn CustomEvent, và màn này chỉ đặt lại trạng thái ở ba mốc —
// chết, phá kỷ lục, mời đặt biệt danh. CẤM render lại mỗi khung hình.
import { useCallback, useEffect, useRef, useState } from 'react'
import { VongLapGame, type KetThuc } from './game/vong-lap'
import { dungBang, type BangXepHang, type NguoiChoi } from './game/bang-xep-hang'
import {
  chuanHoaBietDanh, docBanGhi, ghiBanGhi, ghiNhanVan, khoaTuan, type BanGhiGame,
} from './game/luu-tru'

/** Đếm số lần React dựng lại — chỉ để phép kiểm đọc, không hiện ra màn. */
export const demRender = { so: 0 }

export default function GameScreen() {
  demRender.so += 1
  const oCanvas = useRef<HTMLCanvasElement | null>(null)
  const game = useRef<VongLapGame | null>(null)
  const banGhi = useRef<BanGhiGame>(docBanGhi())

  const [ketThuc, setKetThuc] = useState<KetThuc | null>(null)
  const [hoiTen, setHoiTen] = useState(false)
  const [ten, setTen] = useState('')
  const [bang, setBang] = useState<BangXepHang | null>(null)

  const xongVan = useCallback((kq: KetThuc) => {
    const r = ghiNhanVan(banGhi.current, kq.diem, khoaTuan())
    banGhi.current = r.banGhi
    ghiBanGhi(r.banGhi)
    // Chưa nối máy chủ: điểm cần gửi được xếp hàng, không chặn chơi.
    if (r.canGui != null) {
      banGhi.current = { ...r.banGhi, hangDoi: [...r.banGhi.hangDoi, { tuan: r.banGhi.tuan, diem: r.canGui }] }
      ghiBanGhi(banGhi.current)
    }
    setKetThuc(kq)
    if (r.moiBietDanh) setHoiTen(true)
  }, [])

  useEffect(() => {
    const el = oCanvas.current
    if (!el) return
    const chinhCo = () => {
      const tl = Math.min(window.devicePixelRatio || 1, 2)
      el.width = Math.round(el.clientWidth * tl)
      el.height = Math.round(el.clientHeight * tl)
    }
    chinhCo()
    const g = new VongLapGame(el, (ten2, chiTiet) => {
      if (ten2 === 'game:chet') xongVan(chiTiet as KetThuc)
    })
    game.current = g
    g.batDau()
    const cham = (e: Event) => { e.preventDefault(); setKetThuc(null); g.cham() }
    el.addEventListener('pointerdown', cham)
    window.addEventListener('resize', chinhCo)
    return () => { el.removeEventListener('pointerdown', cham); window.removeEventListener('resize', chinhCo); g.huy() }
  }, [xongVan])

  const luuTen = () => {
    const t = chuanHoaBietDanh(ten)
    if (!t) return
    banGhi.current = { ...banGhi.current, bietDanh: t }
    ghiBanGhi(banGhi.current)
    setHoiTen(false)
  }

  const moBang = () => {
    // Chưa nối máy chủ: dựng bảng từ đúng những gì máy này có.
    const ds: NguoiChoi[] = banGhi.current.bietDanh
      ? [{ bietDanh: banGhi.current.bietDanh, diem: banGhi.current.kyLucTuan, laToi: true }]
      : []
    setBang(dungBang(ds))
  }

  return (
    <div className="fixed inset-0 bg-[#0b0f1a] overscroll-none touch-none select-none">
      <canvas ref={oCanvas} className="w-full h-full block" />

      {ketThuc && !hoiTen && !bang && (
        <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 pointer-events-none">
          <p className="text-white/70 text-sm">Chạm để chơi lại</p>
          <button
            type="button"
            onClick={moBang}
            className="pointer-events-auto rounded-full bg-white/10 px-4 py-2 text-white text-sm"
          >
            Bảng xếp hạng
          </button>
        </div>
      )}

      {hoiTen && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 px-6">
          <div className="w-full max-w-xs rounded-2xl bg-[#141a28] p-5 text-white">
            <p className="mb-3 text-sm text-white/80">Đặt tên để lên bảng xếp hạng</p>
            <input
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              maxLength={12}
              className="mb-4 w-full rounded-lg bg-white/10 px-3 py-2 outline-none"
              placeholder="tối đa 12 ký tự"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setHoiTen(false)} className="flex-1 rounded-lg bg-white/10 py-2 text-sm">Bỏ qua</button>
              <button type="button" onClick={luuTen} className="flex-1 rounded-lg bg-cyan-500 py-2 text-sm font-semibold text-black">Xong</button>
            </div>
          </div>
        </div>
      )}

      {bang && (
        <div className="absolute inset-0 overflow-auto bg-black/85 px-5 py-8 text-white">
          <p className="mb-3 text-xs uppercase tracking-widest text-white/50">Bảng xếp hạng tuần</p>
          {bang.top.length === 0 && <p className="text-sm text-white/60">Tuần này chưa ai lên bảng.</p>}
          {bang.top.map((d) => (
            <div key={`t${d.hang}`} className={`flex gap-3 py-1.5 text-sm ${d.laToi ? 'font-bold text-cyan-300' : ''}`}>
              <span className="w-8 text-white/50">{d.hang}</span><span className="flex-1">{d.bietDanh}</span><span>{d.diem}</span>
            </div>
          ))}
          {bang.lanCan.length > 0 && <div className="my-2 border-t border-white/15" />}
          {bang.lanCan.map((d) => (
            <div key={`l${d.hang}`} className={`flex gap-3 py-1.5 text-sm ${d.laToi ? 'font-bold text-cyan-300' : ''}`}>
              <span className="w-8 text-white/50">{d.hang}</span><span className="flex-1">{d.bietDanh}</span><span>{d.diem}</span>
            </div>
          ))}
          <button type="button" onClick={() => setBang(null)} className="mt-6 w-full rounded-lg bg-white/10 py-2 text-sm">Đóng</button>
        </div>
      )}
    </div>
  )
}
