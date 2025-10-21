import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>
  )
}