import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Layouts
import Layout from './components/layout/Layout'

// Pages
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import AIChat from './pages/AIChat'
import Subscriptions from './pages/Subscriptions'
import ConnectedAccounts from './pages/ConnectedAccounts'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Security from './pages/Security'
import Notifications from './pages/Notifications'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Проверяем наличие объекта Telegram
    if (window.Telegram?.WebApp) {
      // Используем 'as any', чтобы обойти строгую типизацию в vite-env.d.ts,
      // так как там могут отсутствовать новые методы (requestFullscreen, BackButton и т.д.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tg = window.Telegram.WebApp as any;

      tg.ready();

      try {
        tg.expand();
        // Проверка на существование метода перед вызовом (безопасность)
        if (tg.requestFullscreen) {
            tg.requestFullscreen();
        }
      } catch (e) {
        console.log('Fullscreen/Expand error:', e);
      }

      // Настройка цветов (проверка на существование методов)
      if (tg.setHeaderColor) tg.setHeaderColor('#000000');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#000000');

      // Обработка нативной кнопки "Назад"
      if (tg.BackButton) {
        // Отвязываем старые обработчики во избежание дублирования
        tg.BackButton.offClick();
        tg.BackButton.onClick(() => {
          navigate(-1);
        });
      }
    }
  }, [navigate]);

  // Управление видимостью кнопки "Назад"
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tg = window.Telegram.WebApp as any;

      if (tg.BackButton) {
        if (location.pathname === '/' || location.pathname === '/app') {
          tg.BackButton.hide();
        } else {
          tg.BackButton.show();
        }
      }
    }
  }, [location]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Оборачиваем все в наш новый умный Layout */}
        <Route element={<Layout />}>
          {/* Главная */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/app" element={<Dashboard />} />

          {/* Основные разделы */}
          <Route path="/stats" element={<Stats />} />
          <Route path="/ai-chat" element={<AIChat />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/accounts" element={<ConnectedAccounts />} />
          <Route path="/profile" element={<Profile />} />

          {/* Второстепенные страницы */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/security" element={<Security />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Страница добавления (пока редирект на дашборд или отдельная страница) */}
          <Route path="/add" element={<Dashboard />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

export default App