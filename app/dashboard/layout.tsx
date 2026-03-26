import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // MOCK PROFILE IF RLS FAILS (eg. infinite recursion bug in Postgres)
  if (!profile && profileError) {
    profile = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || 'Member',
      role: user.user_metadata?.role || (user.email === 'admin@demo.com' ? 'admin' : 'subscriber'),
      charity_contribution_pct: 10,
      avatar_url: null,
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
        <h1 className="font-display text-white text-3xl mb-3 font-bold">Profile Not Found</h1>
        <p className="text-white/60 mb-2 max-w-sm text-center">
          We could not find a profile linked to this account. Contact support or click below to log out and start over.
        </p>
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 max-w-lg w-full text-xs font-mono break-all text-left space-y-2">
          <p><strong>Database/RLS Error:</strong> {profileError?.message || 'No rows returned.'}</p>
          <p><strong>Your Auth ID:</strong> {user.id}</p>
          <p><strong>Your Auth Email:</strong> {user.email}</p>
          <p><em>Check Supabase: Does your "profiles" table row have exactly this ID?</em></p>
        </div>
        <form action={async () => {
          'use server'
          const mSupabase = createClient()
          await mSupabase.auth.signOut()
          redirect('/auth/login')
        }}>
          <button className="bg-brand-500 hover:bg-brand-400 text-white font-semibold px-6 py-3 rounded-xl transition-all glow-green">
            Log Out
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <DashboardSidebar profile={profile} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <DashboardHeader profile={profile} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
