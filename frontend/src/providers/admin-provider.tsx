'use client'

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '@/lib/api'

// Admin state comes from the httpOnly session cookie (GET /api/admin/session). The key is typed once on
// /admin and never stored in the browser. Legacy ?admin= links are stripped without being used.
interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  login: (key: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    localStorage.removeItem('ff_admin_key') // old scheme
    const url = new URL(window.location.href)
    if (url.searchParams.has('admin')) {
      url.searchParams.delete('admin')
      window.history.replaceState({}, '', url.pathname + url.search)
    }
    api.adminSession().then(r => setIsAdmin(r.admin)).catch(() => setIsAdmin(false)).finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (key: string) => {
    const r = await api.adminLogin(key)
    setIsAdmin(r.admin)
  }, [])
  const logout = useCallback(async () => {
    await api.adminLogout()
    setIsAdmin(false)
  }, [])

  return <AdminContext.Provider value={{ isAdmin, isLoading, login, logout }}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) throw new Error('useAdmin must be used within an AdminProvider')
  return context
}
