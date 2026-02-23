/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'

const LoadingContext = createContext()

export const LoadingProvider = ({ children }) => {
  const [loadingSources, setLoadingSources] = useState(new Set())

  const setIsLoading = useCallback((loading, source) => {
    setLoadingSources((prev) => {
      const next = new Set(prev)
      if (loading) {
        next.add(source)
      } else {
        next.delete(source)
      }
      return next
    })
  }, [])

  const isLoading = loadingSources.size > 0

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

