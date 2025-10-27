import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TierProvider } from './contexts/TierContext'
import { UIModeProvider } from './contexts/UIModeContext'
import Layout from './components/layout/Layout'

// Pages
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Stats from './pages/Stats'
import Subscriptions from './pages/Subscriptions'
import AIChat from './pages/AIChat'
import Profile from './pages/Profile'
import Upgrade from './pages/Upgrade'

function App() {
  console.log('🚀 SpaarBot App initialized')

  return (
    <BrowserRouter basename="/app">
      <ThemeProvider>
        <LanguageProvider>
          <TierProvider>
            <UIModeProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="subscriptions" element={<Subscriptions />} />
                  <Route path="ai" element={<AIChat />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="upgrade" element={<Upgrade />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </UIModeProvider>
          </TierProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App