'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  setAdminKey: (key: string) => void
  clearAdmin: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const ADMIN_KEY_STORAGE = 'ff_admin_key'

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for admin key in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const adminParam = urlParams.get('admin')
    
    if (adminParam) {
      localStorage.setItem(ADMIN_KEY_STORAGE, adminParam)
      setIsAdmin(true)
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      // Check localStorage for existing admin key
      const storedKey = localStorage.getItem(ADMIN_KEY_STORAGE)
      if (storedKey) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    }
    
    setIsLoading(false)
    console.log('AdminProvider initialized - isAdmin:', adminParam ? true : !!localStorage.getItem(ADMIN_KEY_STORAGE))
  }, [])

  const setAdminKey = (key: string) => {
    localStorage.setItem(ADMIN_KEY_STORAGE, key)
    setIsAdmin(true)
  }

  const clearAdmin = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE)
    setIsAdmin(false)
  }

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, setAdminKey, clearAdmin }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}

// Helper to get admin key for API calls
export function getAdminKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_KEY_STORAGE)
}
