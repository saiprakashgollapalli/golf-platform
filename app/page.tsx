import Link from 'next/link'
import { ArrowRight, Heart, Trophy, Target, Star, ChevronDown, Users, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CharityCard from '@/components/CharityCard'

export default async function HomePage() {
  const supabase = createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .limit(3)

  return (
    <main className="min-h-screen bg-dark-950 overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-16 py-5 glass border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
            <Heart size={14} fill="white" className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-white">GreenHeart</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="#charities" className="hover:text-white transition-colors">Charities</Link>
          <Link href="#prizes" className="hover:text-white transition-colors">Prizes</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-200 glow-green"
          >
            Subscribe Now
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-gold-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container-app text-center py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            Play. Give. Win Every Month.
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Golf that{' '}
            <span className="gradient-text italic">changes</span>
            <br />
            the world.
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            Enter your Stableford scores. Support the charities you care about.
            Win monthly prizes. It&apos;s golf with a bigger purpose.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <Link
              href="/auth/signup"
              className="group flex items-center gap-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 glow-green text-lg w-full sm:w-auto justify-center"
            >
              Start Your Journey
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#how-it-works"
              className="flex items-center gap-2 text-white/60 hover:text-white px-6 py-4 transition-colors text-sm"
            >
              See how it works
              <ChevronDown size={16} />
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            {[
              { label: 'Raised for Charity', value: '£48,200' },
              { label: 'Active Members', value: '1,840' },
              { label: 'Monthly Jackpot', value: '£3,500+' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                <div className="font-display text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-white/40 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={20} className="text-white/30" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 relative">
        <div className="container-app">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Simple as 1-2-3</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white">
              How GreenHeart works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger">
            {[
              {
                icon: <Target size={28} />,
                step: '01',
                title: 'Subscribe & Choose',
                desc: 'Pick a monthly or yearly plan. Choose the charity you want to support. A portion of every subscription goes directly to your chosen cause.',
              },
              {
                icon: <Zap size={28} />,
                step: '02',
                title: 'Enter Your Scores',
                desc: 'Log your last 5 Stableford scores after each round. These become your draw numbers — the better you play, the better your chances.',
              },
              {
                icon: <Trophy size={28} />,
                step: '03',
                title: 'Win Monthly Prizes',
                desc: 'Every month we draw 5 winning numbers. Match 3, 4, or all 5 to win cash prizes. Jackpot rolls over if unclaimed!',
              },
            ].map((item) => (
              <div key={item.step} className="glass rounded-3xl p-8 group hover:border-brand-500/30 transition-all duration-300 border border-white/5">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl glass-green flex items-center justify-center text-brand-400">
                    {item.icon}
                  </div>
                  <span className="font-mono text-5xl font-bold text-white/5 group-hover:text-brand-500/10 transition-colors">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE POOLS */}
      <section id="prizes" className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-950/20 to-transparent pointer-events-none" />
        <div className="container-app relative">
          <div className="text-center mb-16">
            <p className="text-gold-400 text-sm font-medium uppercase tracking-widest mb-3">Monthly Draw</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
              Three ways to win
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Match your Stableford scores against the monthly draw numbers. Three tiers, real cash prizes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                match: '5 Numbers',
                label: 'Jackpot',
                pct: '40%',
                note: 'Rolls over if unclaimed',
                color: 'from-gold-500/20 to-gold-600/5',
                border: 'border-gold-500/30',
                textColor: 'text-gold-400',
                icon: '🏆',
              },
              {
                match: '4 Numbers',
                label: 'Second Prize',
                pct: '35%',
                note: 'Split among all winners',
                color: 'from-brand-500/20 to-brand-600/5',
                border: 'border-brand-500/30',
                textColor: 'text-brand-400',
                icon: '🥈',
              },
              {
                match: '3 Numbers',
                label: 'Third Prize',
                pct: '25%',
                note: 'Split among all winners',
                color: 'from-blue-500/10 to-blue-600/5',
                border: 'border-blue-500/20',
                textColor: 'text-blue-400',
                icon: '🥉',
              },
            ].map((tier) => (
              <div
                key={tier.match}
                className={`rounded-3xl p-8 bg-gradient-to-br ${tier.color} border ${tier.border} text-center`}
              >
                <div className="text-4xl mb-4">{tier.icon}</div>
                <div className={`font-mono text-5xl font-bold ${tier.textColor} mb-2`}>{tier.pct}</div>
                <div className="text-white font-semibold text-lg mb-1">{tier.label}</div>
                <div className={`${tier.textColor} text-sm font-medium mb-3`}>Match {tier.match}</div>
                <div className="text-white/40 text-xs">{tier.note}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 glass rounded-3xl p-8 text-center">
            <p className="text-white/60 text-sm mb-2">Prize pool grows with every subscriber</p>
            <p className="font-display text-2xl text-white">
              60% of all subscriptions <span className="gradient-text">flow directly into the prize pool</span>
            </p>
          </div>
        </div>
      </section>

      {/* CHARITIES */}
      <section id="charities" className="py-32">
        <div className="container-app">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-medium uppercase tracking-widest mb-3">Impact First</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
              Causes we support
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Choose your charity at signup. Every subscription contributes a minimum 10% to your chosen cause.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {charities?.map((charity) => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
            {(!charities || charities.length === 0) && (
              <div className="col-span-3 text-center text-white/40 py-16">No featured charities yet.</div>
            )}
          </div>

          <div className="text-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors font-medium">
              View all charities & subscribe <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION PLANS */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-radial from-brand-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="container-app relative">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-white/50">Cancel anytime. No hidden fees. Every penny accounted for.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                plan: 'Monthly',
                price: '£9.99',
                period: '/month',
                features: ['Enter monthly draws', 'Score tracking', 'Charity contribution', 'Full dashboard access'],
                badge: null,
                cta: 'Get Started Monthly',
              },
              {
                plan: 'Yearly',
                price: '£99.99',
                period: '/year',
                features: ['Everything in Monthly', '2 months free', 'Priority support', 'Early draw notifications'],
                badge: 'Best Value',
                cta: 'Get Started Yearly',
              },
            ].map((plan) => (
              <div
                key={plan.plan}
                className={`relative rounded-3xl p-8 border ${
                  plan.badge
                    ? 'border-brand-500/40 bg-gradient-to-br from-brand-500/10 to-transparent glow-green'
                    : 'border-white/10 glass'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-white/60 text-sm mb-2">{plan.plan}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/40">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-white/70 text-sm">
                      <Star size={14} className="text-brand-400 shrink-0" fill="currentColor" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    plan.badge
                      ? 'bg-brand-500 hover:bg-brand-400 text-white'
                      : 'glass border border-white/10 text-white hover:border-white/20'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-24">
        <div className="container-app">
          <div className="rounded-3xl glass-green p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 text-brand-400 text-sm mb-4">
                <Users size={16} />
                <span>Join 1,840+ members making a difference</span>
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to play with purpose?
              </h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Your £9.99/month funds charities, enters you in prize draws, and tracks your golf journey.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-400 text-white font-semibold px-10 py-4 rounded-full transition-all duration-300 glow-green text-lg"
              >
                Subscribe Now — from £9.99/mo
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-12">
        <div className="container-app flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
              <Heart size={12} fill="white" className="text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-white">GreenHeart</span>
          </div>
          <p className="text-white/30 text-sm text-center">
            © 2026 GreenHeart. A percentage of every subscription goes to charity. Play responsibly.
          </p>
          <div className="flex gap-6 text-white/40 text-sm">
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
