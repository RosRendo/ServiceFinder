export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full">
        
        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {children}
        </div>
        
        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          © 2024 CleanService. All rights reserved.
        </p>
      </div>
    </div>
  )
}
