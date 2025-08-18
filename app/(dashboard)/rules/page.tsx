'use client'

export default function RulesPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'white', borderColor: '#cad5e2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold" style={{ color: '#0f172b' }}>Rules</h1>
              <span className="text-sm" style={{ color: '#45556c' }}>
                Manage email automation rules
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#0f172b' }}>
            Rules Engine Coming Soon
          </h2>
          <p className="text-lg mb-6" style={{ color: '#45556c' }}>
            Set up powerful automation rules to manage your inbox like a pro
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-8 text-left max-w-3xl mx-auto">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1" style={{ color: '#0f172b' }}>Smart Filters</h3>
              <p className="text-sm" style={{ color: '#45556c' }}>
                Create rules based on sender, subject, keywords, and more
              </p>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1" style={{ color: '#0f172b' }}>Auto Actions</h3>
              <p className="text-sm" style={{ color: '#45556c' }}>
                Automatically delete, archive, or categorize emails
              </p>
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f1f5f9' }}>
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold mb-1" style={{ color: '#0f172b' }}>AI-Powered</h3>
              <p className="text-sm" style={{ color: '#45556c' }}>
                Let AI understand context and apply intelligent rules
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg inline-block" style={{ backgroundColor: '#fef3c7' }}>
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>
              🚀 This feature is under active development
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}