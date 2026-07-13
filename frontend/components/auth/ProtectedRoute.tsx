'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/contexts/AuthContext'
import { LoadingCard } from '@/components/common/LoadingCard'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Array<'customer' | 'company_admin' | 'staff' | 'admin'>
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // Not authenticated -> redirect to login
      if (!isAuthenticated) {
        router.push('/auth/login')
        return
      }

      // Authenticated but wrong role -> redirect to their dashboard
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        switch (user.role) {
          case 'customer':
            router.push('/customer/dashboard')
            break
          case 'company_admin':
            router.push('/company/dashboard')
            break
          case 'staff':
            router.push('/staff/dashboard')
            break
          case 'admin':
            router.push('/admin/dashboard')
            break
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router])

  // Show loading while checking auth
  if (loading) {
    return <LoadingCard message="Verifying access..." />
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Wrong role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  // All good, show content
  return <>{children}</>
}