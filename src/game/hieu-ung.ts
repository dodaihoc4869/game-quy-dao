// GAME QUỸ ĐẠO — HẠT BẮN VÀ RUNG MÀN.
//
// ĐÂY LÀ TỆP DUY NHẤT TRONG src/game/ ĐƯỢC PHÉP DÙNG Math.random.
// Ngẫu nhiên ở đây chỉ làm hạt bay tản ra và màn rung lệch vài pixel — không
// một dòng nào ở đây quyết định trúng hay trượt. Người chơi thua phải luôn là
// lỗi của chính mình (GAME-QUY-DAO.md mục 9).
import { G } from './cau-hinh'

export interface Hat { x: number; y: number; vx: number; vy: number; doi: number }

export const DOI_HAT = 0.45

export function banHat(x: number, y: number, soHat: number): Hat[] {
  const ra: Hat[] = []
  for (let i = 0; i < soHat; i++) {
    const goc = (i / soHat) * Math.PI * 2 + Math.random() * 0.3
    const toc = 22 + Math.random() * 26
    ra.push({ x, y, vx: Math.cos(goc) * toc, vy: Math.sin(goc) * toc, doi: DOI_HAT })
  }
  return ra
}

export function nhichHat(hat: Hat[], dt: number): Hat[] {
  for (const h of hat) { h.x += h.vx * dt; h.y += h.vy * dt; h.doi -= dt; h.vx *= 0.94; h.vy *= 0.94 }
  return hat.filter((h) => h.doi > 0)
}

/** Độ lệch rung màn. Biên độ giảm dần theo thời gian còn lại, trần đã chốt. */
export function lechRung(conLaiMs: number): { x: number; y: number } {
  if (conLaiMs <= 0) return { x: 0, y: 0 }
  const bien = Math.min(conLaiMs, G.RUNG_MAN_TOI_DA_MS) / 30
  return { x: (Math.random() - 0.5) * bien, y: (Math.random() - 0.5) * bien }
}
