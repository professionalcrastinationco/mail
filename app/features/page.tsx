import Link from 'next/link'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold">My App</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/features" className="text-blue-600 font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
              <Link href="/faq" className="text-gray-700 hover:text-gray-900">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">Features</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Authentication</h3>
            <p className="text-gray-600 mb-4">Secure user authentication with Supabase Auth, supporting email/password and Google OAuth.</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Email/password authentication</li>
              <li>Google OAuth integration</li>
              <li>Protected routes</li>
              <li>Session management</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Database</h3>
            <p className="text-gray-600 mb-4">PostgreSQL database powered by Supabase with real-time capabilities.</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>PostgreSQL database</li>
              <li>Real-time subscriptions</li>
              <li>Row level security</li>
              <li>Database migrations</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Modern Stack</h3>
            <p className="text-gray-600 mb-4">Built with the latest web technologies for optimal performance.</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Next.js 15 App Router</li>
              <li>TypeScript for type safety</li>
              <li>Tailwind CSS for styling</li>
              <li>Server components</li>
            </ul>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">Developer Experience</h3>
            <p className="text-gray-600 mb-4">Excellent developer experience with modern tooling.</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Hot module replacement</li>
              <li>TypeScript support</li>
              <li>ESLint configuration</li>
              <li>Modular architecture</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}