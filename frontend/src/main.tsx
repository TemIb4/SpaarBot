import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// МИНИМАЛЬНАЯ инициализация без сложной логики
try {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand()
    console.log('✅ Telegram initialized')
  }
} catch (e) {
  console.error('Telegram init error:', e)
}

// Простой рендер БЕЗ дополнительных проверок
const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}