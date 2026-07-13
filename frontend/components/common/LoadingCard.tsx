import { Loader2 } from 'lucide-react'

interface LoadingCardProps {
  message?: string
}

export function LoadingCard({ message = "Loading..." }: LoadingCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}