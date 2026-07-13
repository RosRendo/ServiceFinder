import { useState, useEffect } from 'react'
import { Review } from '@/types/review.types'

interface UseReviewsOptions {
  autoFetch?: boolean
  companyId?: string
  customerId?: string
  staffId?: string
  page?: number
  limit?: number
}

export function useReviews(options: UseReviewsOptions = {}) {
  const { autoFetch = true, companyId, customerId, staffId, page = 1, limit = 10 } = options
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  })

  useEffect(() => {
    if (autoFetch) {
      fetchMyReviews();
    }
  }, [autoFetch]);

  const fetchMyReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/my`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      setReviews(data.reviews || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (companyId) params.append('companyId', companyId)
      if (customerId) params.append('customerId', customerId)
      if (staffId) params.append('staffId', staffId)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setPagination(data.pagination)
      } else {
        setError('Failed to fetch reviews')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create review with separate company and staff ratings
   */
  const createReview = async (reviewData: {
    bookingId: string
    companyRating: number
    companyComment?: string
    staffRating?: number
    staffComment?: string
  }) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reviewData)
      })

      if (response.ok) {
        const data = await response.json()
        fetchMyReviews()
        return { success: true, review: data.review }
      }
      const error = await response.json()
      return { success: false, error: error.error }
    } catch (err) {
      return { success: false, error: 'Failed to create review' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update review with separate company and staff ratings
   */
  const updateReview = async (id: string, reviewData: {
    companyRating?: number
    companyComment?: string
    staffRating?: number
    staffComment?: string
  }) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      })

      if (response.ok) {
        fetchMyReviews()
        return { success: true }
      }
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to update review' }
    } catch (err) {
      return { success: false, error: 'An error occurred' }
    } finally {
      setLoading(false)
    }
  }

  const deleteReview = async (id: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchMyReviews()
        return { success: true }
      }
      return { success: false, error: 'Failed to delete review' }
    } catch (err) {
      return { success: false, error: 'An error occurred' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch reviews for a specific company
   */
  const fetchReviewsByCompany = async (compId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/company/${compId}?page=${page}&limit=${limit}`
      )

      if (!response.ok) {
        setError('Failed to fetch reviews')
        return
      }

      const data = await response.json()
      setReviews(data.reviews || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch reviews for a specific staff member (NEW)
   */
  const fetchReviewsByStaff = async (staffMemberId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/staff/${staffMemberId}?page=${page}&limit=${limit}`
      )

      if (!response.ok) {
        setError('Failed to fetch staff reviews')
        return
      }

      const data = await response.json()
      setReviews(data.reviews || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
      return { success: true, ratingSummary: data.ratingSummary }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    reviews,
    loading,
    error,
    pagination,
    fetchMyReviews,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    fetchReviewsByCompany,
    fetchReviewsByStaff, // NEW
  }
}