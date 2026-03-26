import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Users, Trophy, HeartHandshake, Dices, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = createClient()

  const [usersRes, subsRes, winnersRes, drawsRes, paymentsRes] = await Promise.all([
    supabase.from('profiles').select('id, role', { count: 'exact' }),
    supabase.from('subscriptions').select('id, plan, status', { count: 'exact' }).eq('status', 'active'),
    supabase.from('winners').select('id, payment_status, prize_amount', { count: 'exact' }),
    supabase.from('draws').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('payments').select('amount, charity_amount, prize_pool_amount'),
  ])

  const totalUsers = usersRes.count || 0
  const activeSubscribers = subsRes.count || 0
  const pendingWinners = (winnersRes.data || []).filter(w => w.payment_status === 'pending').length
  const totalRevenue = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0)
  const totalCharity = (paymentsRes.data || []).reduce((s, p) => s + Number(p.charity_amount), 0)
  const totalPrizePool = (paymentsRes.data || []).reduce((s, p) => s + Number(p.prize_pool_amount), 0)
  const recentDraws = drawsRes.data || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">Admin Overview</h1>
        <p className="text-white/50 text-sm">Platform statistics and quick actions.</p>
      </div>

      {/* Alert for pending winners */}
      {pendingWinners > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gold-500/10 border border-gold-500/20">
          <AlertCircle size={18} className="text-gold-400 shrink-0" />
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{pendingWinners} winner{pendingWinners > 1 ? 's' : ''} awaiting verification</p>
          </div>
          <Link href="/admin/winners" className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">Review →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, icon: <Users size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Active Subscribers', value: activeSubscribers, icon: <TrendingUp size={18} />, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: <Trophy size={18} />, color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
          { label: 'Charity Raised', value: formatCurrency(totalCharity), icon: <HeartHandshake size={18} />, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl p-5 border ${stat.bg}`}>
            <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
            <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-white/40 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-white/5 text-center">
          <div className="font-display text-2xl font-bold text-white mb-1">{formatCurrency(totalRevenue)}</div>
          <div className="text-white/40 text-sm">Total Revenue</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5 text-center">
          <div className="font-display text-2xl font-bold gradient-text mb-1">{formatCurrency(totalCharity)}</div>
          <div className="text-white/40 text-sm">To Charities</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5 text-center">
          <div className="font-display text-2xl font-bold text-gold-400 mb-1">{formatCurrency(totalPrizePool)}</div>
          <div className="text-white/40 text-sm">Prize Pool</div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/admin/users', label: 'Manage Users', icon: <Users size={16} />, desc: `${totalUsers} total users` },
            { href: '/admin/draws', label: 'Run Draw', icon: <Dices size={16} />, desc: 'Configure & publish' },
            { href: '/admin/winners', label: 'Verify Winners', icon: <Trophy size={16} />, desc: `${pendingWinners} pending` },
            { href: '/admin/charities', label: 'Manage Charities', icon: <HeartHandshake size={16} />, desc: 'Add & edit charities' },
          ].map(action => (
            <Link key={action.href} href={action.href} className="glass rounded-2xl p-5 border border-white/5 hover:border-gold-500/20 transition-all group">
              <div className="text-gold-400 mb-3 group-hover:scale-110 transition-transform inline-block">{action.icon}</div>
              <div className="text-white font-medium text-sm">{action.label}</div>
              <div className="text-white/40 text-xs mt-0.5">{action.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent draws */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-white">Recent Draws</h2>
          <Link href="/admin/draws" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">View all →</Link>
        </div>
        <div className="space-y-3">
          {recentDraws.length === 0 && <p className="text-white/40 text-sm">No draws yet.</p>}
          {recentDraws.map(draw => (
            <div key={draw.id} className="glass rounded-2xl p-4 border border-white/5 flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                draw.status === 'published' ? 'bg-brand-500/10 text-brand-400' :
                draw.status === 'simulated' ? 'bg-gold-500/10 text-gold-400' :
                'bg-white/5 text-white/40'
              }`}>{draw.status}</div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">
                  {['January','February','March','April','May','June','July','August','September','October','November','December'][draw.month - 1]} {draw.year}
                </div>
                <div className="text-white/40 text-xs">{draw.participant_count} participants · Pool: {formatCurrency(draw.prize_pool_total)}</div>
              </div>
              {draw.winning_numbers?.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {draw.winning_numbers.map((n: number) => (
                    <div key={n} className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-mono">{n}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
