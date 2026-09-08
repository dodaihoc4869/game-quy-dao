// GAME QUỸ ĐẠO — BẢNG XẾP HẠNG CHUNG (máy chủ riêng của game).
//
// Game này VIẾT RIÊNG, không đấu vào app thi: nó có Apps Script và Google Sheet
// riêng, không đọc và không ghi bất kỳ dữ liệu học tập nào. Máy chủ chỉ biết
// BIỆT DANH và ĐIỂM — không có họ tên thật, không có số báo danh.
//
// Chưa dán link Apps Script thì game vẫn chơi đủ, bảng xếp hạng chỉ có mình em.
import { G } from './cau-hinh'
import type { NguoiChoi } from './bang-xep-hang'

const HAN_GIAY = 8

export interface CauHinhMayChu { scriptUrl: string }

let daDoc: CauHinhMayChu | null = null

export async function docCauHinh(goc = '/'): Promise<CauHinhMayChu> {
  if (daDoc) return daDoc
  try {
    const r = await fetch(`${goc}cau-hinh-may-chu.json`, { cache: 'no-store' })
    const j = (await r.json()) as CauHinhMayChu
    daDoc = { scriptUrl: (j.scriptUrl || '').trim() }
  } catch {
    daDoc = { scriptUrl: '' }
  }
  return daDoc
}

/** Chỉ để test đặt lại trạng thái đã đọc. */
export function quenCauHinh(): void { daDoc = null }

async function goi(url: string, than: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_GIAY * 1000)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(than),
      signal: bo.signal,
    })
    return (await r.json()) as Record<string, unknown>
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** Gửi điểm. Trả về true nếu máy chủ nhận. Mất mạng thì trả false, KHÔNG ném lỗi
 * và KHÔNG chặn chơi — điểm nằm lại hàng đợi trong máy, gửi lại lần mở sau. */
export async function guiDiem(url: string, maMay: string, bietDanh: string, diem: number): Promise<boolean> {
  if (!url || !bietDanh) return false
  if (!Number.isInteger(diem) || diem <= 0 || diem > G.TRAN_DIEM_HOP_LE) return false
  const kq = await goi(url, { action: 'gameGuiDiem', maMay, bietDanh, diem })
  return !!kq && kq.ok === true
}

export async function layBang(url: string, maMay: string): Promise<NguoiChoi[] | null> {
  if (!url) return null
  const kq = await goi(url, { action: 'gameBangXepHang', maMay })
  if (!kq || kq.ok !== true || !Array.isArray(kq.danhSach)) return null
  return (kq.danhSach as { bietDanh?: unknown; diem?: unknown; laToi?: unknown }[])
    .filter((n) => typeof n.bietDanh === 'string' && typeof n.diem === 'number')
    .map((n) => ({ bietDanh: n.bietDanh as string, diem: n.diem as number, laToi: n.laToi === true }))
}

/** MÃ MÁY: định danh ngẫu nhiên của riêng máy này, sinh một lần rồi giữ.
 * KHÔNG phải số báo danh, không tra ngược ra em nào — máy chủ chỉ dùng nó để
 * biết "cùng một người chơi" mà giữ đúng một dòng cho mỗi máy mỗi tuần. */
export function maMay(): string {
  const K = 'ddh_game_ma_may'
  try {
    const cu = localStorage.getItem(K)
    if (cu) return cu
    // KHÔNG dùng Math.random: đây là định danh, phải lấy từ nguồn ngẫu nhiên thật.
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    const moi = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
    localStorage.setItem(K, moi)
    return moi
  } catch {
    return 'khong-luu-duoc'
  }
}
