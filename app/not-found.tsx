import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <span className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            404
          </span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Well, this is awkward...
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          This page must have gotten lost in your inbox. Maybe it went to spam?
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/" 
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Go Back Home
          </Link>
          <Link 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
        
        <p className="mt-12 text-sm text-gray-500">
          Error Code: 404 | Page Not Found
        </p>
      </div>
    </div>
  )
}
