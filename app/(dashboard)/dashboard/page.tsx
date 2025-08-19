import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectProgress from '@/components/dashboard/ProjectProgress'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      {/* Header */}
      <div className="shadow-sm border-b" style={{ backgroundColor: 'white', borderColor: '#cad5e2' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold" style={{ color: '#0f172b' }}>Dashboard</h1>
            <span className="text-sm" style={{ color: '#374151' }}>Welcome, {user.email}</span>
          </div>
        </div>
      </div>

      <main>
        <ProjectProgress />
      </main>
    </div>
  )
}