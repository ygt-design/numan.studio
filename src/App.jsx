import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import GridVisualization from './components/GridVisualization'
import Home from './pages/home/Home'
import ProjectDetail from './pages/individualProjectPages/ProjectDetail'
import InputPage from './pages/input/InputPage'
import Loading from './components/Loading'
import { useLoading } from './contexts/LoadingContext'

const App = () => {
  const location = useLocation()
  const isBackNavigation = useRef(false)
  const { isLoading } = useLoading()

  useEffect(() => {
    // Detect browser back/forward navigation
    const handlePopState = () => {
      isBackNavigation.current = true
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (location.pathname === '/') {
      // Restore scroll position when returning to home
      if (isBackNavigation.current) {
        const savedPosition = sessionStorage.getItem('scrollPosition')
        if (savedPosition) {
          // Wait for content to render before restoring scroll
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition, 10))
            sessionStorage.removeItem('scrollPosition')
          }, 0)
        }
        isBackNavigation.current = false
      }
    } else if (location.pathname.startsWith('/project/')) {
      // Save scroll position when navigating to project detail
      sessionStorage.setItem('scrollPosition', window.scrollY.toString())
      // Scroll to top for project detail page
      window.scrollTo(0, 0)
      isBackNavigation.current = false
    }
  }, [location.pathname])

  return (
    <>
      {isLoading && <Loading />}
      <GridVisualization />
      <Routes>
        <Route path="/" element={<main><Home /></main>} />
        <Route path="/project/:slug" element={<ProjectDetail />} />
        <Route path="/input" element={<InputPage />} />
      </Routes>
    </>
  )
}

export default App
