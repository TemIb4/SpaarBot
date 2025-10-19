/**
 * Main App Component with Lazy Loading
 */
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { BottomNav } from './components/layout/BottomNav'

// ✅ Lazy loading страниц
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Stats = lazy(() => import('./pages/Stats').then(m => ({ default: m.Stats })))
const AIChat = lazy(() => import('./pages/AIChat').then(m => ({ default: m.AIChat })))
const Subscriptions = lazy(() => import('./pages/Subscriptions').then(m => ({ default: m.Subscriptions })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
})

// ✅ Loading компонент
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div
      className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: 'var(--color-accent)' }}
    />
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/app">
          <div className="min-h-screen transition-colors">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/ai" element={<AIChat />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <BottomNav />
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App