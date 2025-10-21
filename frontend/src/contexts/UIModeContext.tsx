import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface UIModeContextType {
  uiMode: 'pro' | 'lite'
  setUIMode: (mode: 'pro' | 'lite') => void
}

const UIModeContext = createContext<UIModeContextType | undefined>(undefined)

export const UIModeProvider = ({ children }: { children: ReactNode }) => {
  const [uiMode, setUIModeState] = useState<'pro' | 'lite'>(() => {
    return (localStorage.getItem('spaarbot-ui-mode') as 'pro' | 'lite') || 'pro'
  })

  const setUIMode = (mode: 'pro' | 'lite') => {
    setUIModeState(mode)
    localStorage.setItem('spaarbot-ui-mode', mode)
  }

  useEffect(() => {
    // Apply UI mode class to body
    document.body.classList.remove('ui-pro', 'ui-lite')
    document.body.classList.add(`ui-${uiMode}`)
  }, [uiMode])

  return (
    <UIModeContext.Provider value={{ uiMode, setUIMode }}>
      {children}
    </UIModeContext.Provider>
  )
}

export const useUIMode = () => {
  const context = useContext(UIModeContext)
  if (!context) throw new Error('useUIMode must be used within UIModeProvider')
  return context
}