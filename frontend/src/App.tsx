import { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'

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
import Upgrade from './pages/Upgrade'
import UsageStats from './pages/UsageStats'
import Logs from './pages/Logs'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      try {
        tg.expand();
        if (tg.requestFullscreen) {
          tg.requestFullscreen();
        }
      } catch (e) {
        // Ignore fullscreen errors
      }

      // Настройка кнопки "Назад" в хедере Telegram
      if (tg.BackButton) {
        const handleBack = () => navigate(-1);
        tg.BackButton.onClick(handleBack);

        // Показываем кнопку везде, кроме главной
        if (location.pathname === '/' || location.pathname === '/app') {
          tg.BackButton.hide();
        } else {
          tg.BackButton.show();
        }

        return () => {
          tg.BackButton.offClick(handleBack);
        };
      }
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Главная страница */}
        <Route path="/" element={<Dashboard />} />

        {/* Основные разделы */}
        <Route path="/stats" element={<Stats />} />
        <Route path="/ai-chat" element={<AIChat />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/accounts" element={<ConnectedAccounts />} />

        {/* Дополнительные страницы */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/security" element={<Security />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/usage-stats" element={<UsageStats />} />
        <Route path="/logs" element={<Logs />} />

        {/* Обработка "хвостов" и старых ссылок */}
        <Route path="/app" element={<Dashboard />} />
        <Route path="/index.html" element={<Dashboard />} />

        {/* Любой неизвестный путь -> на главную */}
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

export default App