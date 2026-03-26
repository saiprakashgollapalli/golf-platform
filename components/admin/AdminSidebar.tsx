'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, HeartHandshake, Dices, Trophy, LogOut, Heart, Menu, X, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/charities', label: 'Charities', icon: HeartHandshake },
  { href: '/admin/draws', label: 'Draws', icon: Dices },
  { href: '/admin/winners', label: 'Winners', icon: Trophy },
]

export default function AdminSidebar({ profile }: { profile: { full_name: string | null; email: string } }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  const Content = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/5">
        <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
          <Heart size={12} className="text-gold-400" fill="currentColor" />
        </div>
        <div>
          <div className="font-display text-base font-semibold text-white">GreenHeart</div>
          <div className="text-gold-400 text-xs">Admin</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all',
                active
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-white/30 hover:text-white hover:bg-white/5 transition-all mt-2">
          <BarChart3 size={16} />
          User Dashboard
        </Link>
      </nav>

      <div className="px-3 pb-5">
        <div className="glass rounded-2xl p-3 mb-3 text-xs">
          <div className="text-white/60 font-medium truncate">{profile.full_name || 'Admin'}</div>
          <div className="text-white/30 truncate">{profile.email}</div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-white/5 z-40">
        <Content />
      </aside>
      <button onClick={() => setMobileOpen(true)} className="lg:hidden fixed top-3.5 left-4 z-50 w-8 h-8 glass rounded-xl flex items-center justify-center text-white/60">
        <Menu size={15} />
      </button>
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-white/5 z-50">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 w-7 h-7 glass rounded-lg flex items-center justify-center text-white/40">
              <X size={13} />
            </button>
            <Content />
          </aside>
        </>
      )}
    </>
  )
}
