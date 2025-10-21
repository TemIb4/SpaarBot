/**
 * Tier Context - Free/Premium
 */
import { createContext, useContext, useState, ReactNode } from 'react'

type Tier = 'free' | 'premium'

interface TierContextType {
  tier: Tier
  setTier: (tier: Tier) => void
  isPremium: boolean
  isFree: boolean
  togglePremium: () => void
}

const TierContext = createContext<TierContextType | undefined>(undefined)

export const TierProvider = ({ children }: { children: ReactNode }) => {
  const [tier, setTierState] = useState<Tier>(() => {
    const saved = localStorage.getItem('spaarbot_tier')
    return (saved as Tier) || 'free'
  })

  const setTier = (newTier: Tier) => {
    setTierState(newTier)
    localStorage.setItem('spaarbot_tier', newTier)
  }

  const togglePremium = () => {
    setTier(tier === 'free' ? 'premium' : 'free')
  }

  return (
    <TierContext.Provider
      value={{
        tier,
        setTier,
        isPremium: tier === 'premium',
        isFree: tier === 'free',
        togglePremium
      }}
    >
      {children}
    </TierContext.Provider>
  )
}

export const useTier = () => {
  const context = useContext(TierContext)
  if (!context) throw new Error('useTier must be used within TierProvider')
  return context
}