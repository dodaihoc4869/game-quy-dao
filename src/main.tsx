import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GameScreen from './GameScreen'
import './index.css'

createRoot(document.getElementById('goc')!).render(
  <StrictMode>
    <GameScreen />
  </StrictMode>,
)

// Offline sau lần tải đầu. Đăng ký sau khi trang đã vẽ xong để không làm chậm
// cú chạm đầu tiên — tiêu chí "mở link tới lúc chạm được ≤ 2 giây".
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
