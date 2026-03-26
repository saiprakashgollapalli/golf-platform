import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, isSubscriptionActive } from '@/lib/utils'
import Link from 'next/link'
import { ArrowRight, Target, Trophy, HeartHandshake, AlertCircle, TrendingUp, Calendar } from 'lucide-react'
import { MONTH_NAMES } from '@/lib/draw-engine'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, subRes, scoresRes, winsRes, drawRes] = await Promise.all([
    supabase.from('profiles').select('*, charities(name, description)').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }),
    supabase.from('winners').select('*, draws(month, year)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('draws').select('*').eq('status', 'published').order('year', { ascending: false }).order('month', { ascending: false }).limit(1).single(),
  ])

  let profile = profileRes.data

  if (!profile && profileRes.error) {
    profile = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || 'Member',
      role: user.user_metadata?.role || (user.email === 'admin@demo.com' ? 'admin' : 'subscriber'),
      charity_contribution_pct: 10,
      charities: null
    }
  }

  const subscription = subRes.data
  const scores = scoresRes.data || []
  const wins = winsRes.data || []
  const latestDraw = drawRes.data

  const totalWon = wins.reduce((s, w) => s + (w.prize_amount || 0), 0)
  const hasActiveSubscription = subscription && isSubscriptionActive(subscription.current_period_end)
  const avgScore = scores.length ? Math.round(scores.reduce((s, sc) => s + sc.score, 0) / scores.length) : 0

  return (
    <div className="space-y-8">
      {/* Subscription alert */}
      {!hasActiveSubscription && (
        <div className="glass-green rounded-2xl p-4 flex items-center gap-4 border border-brand-500/20">
          <AlertCircle size={20} className="text-brand-400 shrink-0" />
          <div className="flex-1">
            <p className="text-white font-medium text-sm">No active subscription</p>
            <p className="text-white/50 text-xs">Subscribe to enter monthly draws and support charities.</p>
          </div>
          <Link href="/auth/signup" className="bg-brand-500 text-white text-xs font-medium px-4 py-2 rounded-xl whitespace-nowrap">
            Subscribe Now
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Subscription',
            value: hasActiveSubscription ? subscription!.plan.charAt(0).toUpperCase() + subscription!.plan.slice(1) : 'Inactive',
            sub: hasActiveSubscription ? `Renews ${formatDate(subscription!.current_period_end)}` : 'No active plan',
            icon: <Calendar size={18} />,
            color: hasActiveSubscription ? 'text-brand-400' : 'text-white/40',
            bg: hasActiveSubscription ? 'bg-brand-500/10 border-brand-500/20' : 'bg-white/5 border-white/10',
          },
          {
            label: 'Scores Logged',
            value: `${scores.length}/5`,
            sub: scores.length > 0 ? `Latest: ${scores[0]?.score} pts` : 'No scores yet',
            icon: <Target size={18} />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
          },
          {
            label: 'Total Winnings',
            value: formatCurrency(totalWon),
            sub: `${wins.length} prize${wins.length !== 1 ? 's' : ''} won`,
            icon: <Trophy size={18} />,
            color: 'text-gold-400',
            bg: 'bg-gold-500/10 border-gold-500/20',
          },
          {
            label: 'Avg Score',
            value: avgScore > 0 ? `${avgScore} pts` : '—',
            sub: 'Stableford average',
            icon: <TrendingUp size={18} />,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 border ${stat.bg}`}>
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div className="text-white font-display text-2xl font-bold mb-0.5">{stat.value}</div>
            <div className="text-white/40 text-xs">{stat.label}</div>
            <div className="text-white/30 text-xs mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Scores preview */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">My Draw Numbers</h2>
              <p className="text-white/40 text-sm mt-0.5">Your last 5 Stableford scores</p>
            </div>
            <Link href="/dashboard/scores" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
              Manage <ArrowRight size={14} />
            </Link>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-10">
              <Target size={40} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No scores yet</p>
              <Link href="/dashboard/scores" className="text-brand-400 text-sm hover:text-brand-300 mt-2 inline-block">
                Add your first score →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score, idx) => (
                <div key={score.id} className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'glass-green border border-brand-500/20' : 'glass border border-white/5'}`}>
                  <div className="number-ball shrink-0">{score.score}</div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{score.course_name || 'Golf Round'}</div>
                    <div className="text-white/40 text-xs">{formatDate(score.played_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className="score-bar" style={{ width: `${(score.score / 45) * 100}%` }} />
                    </div>
                    <div className="text-white/30 text-xs mt-1">{score.score}/45</div>
                  </div>
                  {idx === 0 && <div className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">Latest</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Charity */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-white">My Charity</h2>
              <Link href="/dashboard/charity" className="text-brand-400 hover:text-brand-300 text-sm">Change</Link>
            </div>
            {profile?.charity_id ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    <HeartHandshake size={18} className="text-brand-400" />
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{(profile as any).charities?.name || 'Unspecified'}</div>
                    <div className="text-white/40 text-xs">{profile.charity_contribution_pct}% contribution</div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all" style={{ width: `${profile.charity_contribution_pct * 2}%` }} />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <HeartHandshake size={32} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/40 text-xs">No charity selected</p>
                <Link href="/dashboard/charity" className="text-brand-400 text-xs mt-1 inline-block">Select a charity →</Link>
              </div>
            )}
          </div>

          {/* Latest Draw */}
          <div className="glass rounded-3xl p-6 border border-white/5">
            <h2 className="font-display text-lg font-semibold text-white mb-4">Latest Draw</h2>
            {latestDraw ? (
              <>
                <div className="text-brand-400 text-sm font-medium mb-3">
                  {MONTH_NAMES[latestDraw.month - 1]} {latestDraw.year}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {latestDraw.winning_numbers.map((n: number) => (
                    <div key={n} className="number-ball text-xs w-9 h-9">{n}</div>
                  ))}
                </div>
                <div className="text-white/40 text-xs">
                  Jackpot: {formatCurrency(latestDraw.jackpot_amount)}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Trophy size={32} className="text-white/10 mx-auto mb-2" />
                <p className="text-white/40 text-xs">No draws published yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
