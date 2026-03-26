import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile && profileError) {
    profile = {
      role: user.user_metadata?.role || (user.email === 'admin@demo.com' ? 'admin' : 'subscriber'),
      full_name: user.user_metadata?.full_name || 'Member',
      email: user.email!,
    } as any
  }

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-dark-950 flex">
      <AdminSidebar profile={profile} />
      <div className="flex-1 lg:ml-64 min-h-screen">
        <header className="h-14 border-b border-white/5 flex items-center px-6 bg-dark-950/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 ml-10 lg:ml-0">
            <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-widest">Admin Panel</span>
          </div>
          <div className="ml-auto text-white/40 text-xs">{profile.full_name || profile.email}</div>
        </header>
        <main className="p-4 lg:p-8 max-w-7xl w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
