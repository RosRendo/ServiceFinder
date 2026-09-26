'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { installCookieCredentials } from '@/lib/http'

// Auth model: the backend sets httpOnly `token` + `refreshToken` cookies on
// login. We never store the JWT in localStorage or a JS-readable cookie —
// both are XSS-stealable. The cookie is attached automatically by the browser
// on every request (credentials: 'include', patched globally below).

const clearToken = () => {
  // Clear any legacy JS-visible token cookie from previous versions.
  document.cookie = 'token=; path=/; max-age=0; SameSite=None; Secure'
  document.cookie = 'token=; path=/; max-age=0'
}


type AuthResult =
  | { success: true; user: User }
  | { success: false; error: string }
  | { success: false; requires2FA: true; userId: string; email: string };


interface User {
  id: string
  fullName: string
  email: string
  phone: string
  avatar?: string
  role: 'customer' | 'company_admin' | 'staff' | 'admin'
  status: string
  ownedCompanies?: any[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  verify2FA: (userId: string, code: string) => Promise<AuthResult>
  googleLogin: (token: string, role?: string) => Promise<AuthResult>
  facebookLogin: (token: string, role?: string) => Promise<AuthResult>
  register: (userData: any) => Promise<AuthResult>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check auth on mount
  useEffect(() => {
    // Ensure every fetch carries the httpOnly session cookie.
    installCookieCredentials()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        // /api/auth/me returns { success, data: { user } } — handle both shapes.
        setUser(data.user ?? data.data?.user ?? null)
      } else {
        clearToken()
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.requires2FA) {
          return { success: false, requires2FA: true, userId: data.userId, email: data.email }
        }
        // Session cookie (httpOnly) is set by the backend — nothing to store client-side.
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const verify2FA = async (userId: string, code: string): Promise<AuthResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Session cookie (httpOnly) is set by the backend — nothing to store client-side.
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || 'Invalid 2FA code' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const register = async (userData: any): Promise<AuthResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Session cookie (httpOnly) is set by the backend — nothing to store client-side.
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const googleLogin = async (token: string, role: string = 'customer'): Promise<AuthResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Session cookie (httpOnly) is set by the backend — nothing to store client-side.
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || 'Google login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const facebookLogin = async (token: string, role: string = 'customer'): Promise<AuthResult> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, role }),
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        // Session cookie (httpOnly) is set by the backend — nothing to store client-side.
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || 'Facebook login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    // Clear local state immediately so UI responds instantly
    clearToken()
    setUser(null)

    try {
      // Tell the backend to clear its httpOnly cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      // Ignore network errors — local token already cleared above
    }

    // Hard redirect (not router.push) to fully reset React state
    // This prevents the auth context from re-checking and redirecting back
    window.location.href = '/auth/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      login,
      verify2FA,
      googleLogin,
      facebookLogin,
      register,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
