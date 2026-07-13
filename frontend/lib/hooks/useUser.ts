import { useState, useCallback, useEffect } from 'react'
import { useAuthContext } from '@/lib/contexts/AuthContext'

interface UpdateUserData {
  fullName?: string
  email?: string
  phone?: string
  password?: string
}

export function useUser() {
  const { user } = useAuthContext()
  const [currentUser, setCurrentUser] = useState(user)
  const [loading, setLoading] = useState(false)

  // Keep local state in sync when auth context user changes
  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  const updateUser = useCallback(async (data: UpdateUserData) => {
    if (!currentUser) throw new Error('No user logged in')
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update user')
      }

      const json = await res.json()
      setCurrentUser(json.user) // only updates this hook's state
      return json.user
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  return { user: currentUser, updateUser, loading }
}
