/**
 * Hook to track if page was already visited in this session
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export const usePageVisited = () => {
  const location = useLocation()
  const [isFirstVisit, setIsFirstVisit] = useState(true)

  useEffect(() => {
    const visitedPages = sessionStorage.getItem('visitedPages')
    const pages = visitedPages ? JSON.parse(visitedPages) : []

    if (pages.includes(location.pathname)) {
      setIsFirstVisit(false)
    } else {
      pages.push(location.pathname)
      sessionStorage.setItem('visitedPages', JSON.stringify(pages))
      setIsFirstVisit(true)
    }
  }, [location.pathname])

  return { isFirstVisit, shouldAnimate: isFirstVisit }
}