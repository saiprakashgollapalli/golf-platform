import { Bell } from 'lucide-react'
import { Profile } from '@/lib/types'
import { format } from 'date-fns'

interface Props { profile: Profile }

export default function DashboardHeader({ profile }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-8 bg-dark-950/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="hidden lg:block">
        <p className="text-white/40 text-xs">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        <p className="text-white text-sm font-medium">{greeting}, {profile.full_name?.split(' ')[0] || 'there'} 👋</p>
      </div>
      <div className="lg:hidden" /> {/* spacer for mobile menu button */}
      <div className="flex items-center gap-3 ml-auto">
        <button className="relative w-9 h-9 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <div className="w-9 h-9 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-sm">
          {(profile.full_name || profile.email).charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
