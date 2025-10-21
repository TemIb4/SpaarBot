import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { UIModeProvider } from './contexts/UIModeContext'
const AIChat = lazy(() => import('./pages/AIChat'))

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Stats = lazy(() => import('./pages/Stats'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const Settings = lazy(() => import('./pages/Settings'))
const Upgrade = lazy(() => import('./pages/Upgrade'))

// Loading component
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#0a0a0a'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(99, 102, 241, 0.1)',
      borderRadius: '50%',
      borderTopColor: '#6366f1',
      animation: 'spin 1s ease-in-out infinite'
    }} />
  </div>
)

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = (window as any).Telegram?.WebApp

    if (tg) {
      // Expand to full height
      tg.expand()

      // Set header color
      tg.setHeaderColor('#0a0a0a')

      // Enable closing confirmation
      tg.enableClosingConfirmation()

      // Ready
      tg.ready()

      console.log('✅ Telegram WebApp configured:', {
        initData: tg.initData ? 'present' : 'missing',
        user: tg.initDataUnsafe.user,
        colorScheme: tg.colorScheme,
        platform: tg.platform
      })
    } else {
      console.warn('⚠️ Running in browser mode (not in Telegram)')
    }

    // Mark as ready
    setIsReady(true)
  }, [])

  if (!isReady) {
    return <PageLoader />
  }

  return (
    <BrowserRouter basename="/app">
      <LanguageProvider>
        <ThemeProvider>
          <UIModeProvider>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/ai" element={<AIChat />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Layout>
          </UIModeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App