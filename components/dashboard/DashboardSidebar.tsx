'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, LayoutDashboard, Target, HeartHandshake, Trophy, LogOut, X, Menu, Settings } from 'lucide-react'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/scores', label: 'My Scores', icon: Target },
  { href: '/dashboard/charity', label: 'My Charity', icon: HeartHandshake },
  { href: '/dashboard/wins', label: 'Winnings', icon: Trophy },
]

interface Props { profile: Profile }

export default function DashboardSidebar({ profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6 border-b border-white/5">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
          <Heart size={14} fill="white" className="text-white" />
        </div>
        <span className="font-display text-xl font-semibold text-white">GreenHeart</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 bg-brand-400 rounded-full" />}
            </Link>
          )
        })}

        {profile.role === 'admin' && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gold-400/70 hover:text-gold-400 hover:bg-gold-500/5 transition-all duration-200 mt-4 border border-gold-500/10"
          >
            <Settings size={18} />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* User card */}
      <div className="px-3 pb-6">
        <div className="glass rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm shrink-0">
              {(profile.full_name || profile.email).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-medium truncate">{profile.full_name || 'Member'}</div>
              <div className="text-white/40 text-xs truncate">{profile.email}</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-dark-900 border-r border-white/5 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass rounded-xl flex items-center justify-center text-white/60"
      >
        <Menu size={18} />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-white/5 z-50">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 glass rounded-xl flex items-center justify-center text-white/60"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
