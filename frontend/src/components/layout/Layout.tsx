import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Main Content */}
      <main className="pb-20 px-4">
        {children}
      </main>

      {/* Bottom Navigation - используем существующий компонент */}
      <BottomNav />
    </div>
  )
}