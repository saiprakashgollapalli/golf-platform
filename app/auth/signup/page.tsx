'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { PLAN_PRICES, Charity } from '@/lib/types'
import { formatCurrency, getSubscriptionEndDate } from '@/lib/utils'
import Image from 'next/image'

type Step = 1 | 2 | 3

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [charities, setCharities] = useState<Charity[]>([])

  // Step 1 – account
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 2 – plan
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')

  // Step 3 – charity
  const [selectedCharity, setSelectedCharity] = useState<string>('')
  const [contributionPct, setContributionPct] = useState(10)

  async function goToStep2(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || !password) { toast.error('Please fill in all fields'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setStep(2)
  }

  async function goToStep3() {
    // Load charities for selection
    const { data } = await supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false })
    setCharities(data || [])
    setStep(3)
  }

  async function handleSignup() {
    if (!selectedCharity) { toast.error('Please select a charity'); return }
    setLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Failed to create user')

      // 2. Update profile with charity selection
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ charity_id: selectedCharity, charity_contribution_pct: contributionPct })
        .eq('id', userId)
      if (profileError) console.warn('Profile update:', profileError.message)

      // 3. Create mock subscription
      const now = new Date()
      const endDate = getSubscriptionEndDate(plan)
      const amount = PLAN_PRICES[plan]

      const { data: sub, error: subError } = await supabase.from('subscriptions').insert({
        user_id: userId,
        plan,
        status: 'active',
        amount,
        currency: 'GBP',
        stripe_subscription_id: `mock_${Date.now()}`,
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
      }).select().single()
      if (subError) console.warn('Subscription error:', subError.message)

      // 4. Create mock payment
      if (sub) {
        const charityAmt = amount * (contributionPct / 100)
        const prizeAmt = amount * 0.6
        const platformAmt = amount - charityAmt - prizeAmt

        await supabase.from('payments').insert({
          user_id: userId,
          subscription_id: sub.id,
          amount,
          currency: 'GBP',
          status: 'succeeded',
          payment_type: 'subscription',
          stripe_payment_intent_id: `mock_pi_${Date.now()}`,
          charity_amount: charityAmt,
          prize_pool_amount: prizeAmt,
          platform_amount: platformAmt,
        })

        // 5. Update charity total_raised
        const { error: rpcError } = await supabase.rpc('increment_charity_raised', {
          charity_id: selectedCharity,
          amount: charityAmt,
        })
        if (rpcError) console.warn('RPC error:', rpcError)
      }

      toast.success('Welcome to GreenHeart! 🎉')
      router.push('/dashboard')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center">
            <Heart size={16} fill="white" className="text-white" />
          </div>
          <span className="font-display text-2xl font-semibold text-white">GreenHeart</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step > s ? 'bg-brand-500 text-white' :
                step === s ? 'bg-brand-500/20 border border-brand-500 text-brand-400' :
                'bg-white/5 text-white/30'
              }`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 rounded-full transition-all ${step > s ? 'bg-brand-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Account */}
        {step === 1 && (
          <div className="glass rounded-3xl p-8 border border-white/5">
            <h1 className="font-display text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-white/50 text-sm mb-6">Step 1 of 3 — Your details</p>
            <form onSubmit={goToStep2} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm pr-12"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full bg-brand-500 hover:bg-brand-400 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 mt-2">
                Continue <ArrowRight size={16} />
              </button>
            </form>
            <p className="text-center text-white/40 text-sm mt-5">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
            </p>
          </div>
        )}

        {/* STEP 2 — Plan */}
        {step === 2 && (
          <div className="glass rounded-3xl p-8 border border-white/5">
            <h1 className="font-display text-2xl font-bold text-white mb-1">Choose your plan</h1>
            <p className="text-white/50 text-sm mb-6">Step 2 of 3 — Subscription</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {(['monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`rounded-2xl p-5 border text-left transition-all ${
                    plan === p ? 'border-brand-500/60 bg-brand-500/10' : 'border-white/10 glass hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="capitalize text-white font-medium text-sm">{p}</span>
                    {p === 'yearly' && <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full">Save 17%</span>}
                    {plan === p && <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                  </div>
                  <div className="font-display text-3xl font-bold text-white">{formatCurrency(PLAN_PRICES[p])}</div>
                  <div className="text-white/40 text-xs mt-1">per {p === 'monthly' ? 'month' : 'year'}</div>
                </button>
              ))}
            </div>

            <div className="glass rounded-2xl p-4 text-sm text-white/50 mb-6 space-y-1.5">
              <div className="flex items-center gap-2"><Check size={14} className="text-brand-400" /> 60% goes into the monthly prize pool</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-brand-400" /> Min. 10% donated to your charity</div>
              <div className="flex items-center gap-2"><Check size={14} className="text-brand-400" /> Cancel anytime</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 glass border border-white/10 text-white/60 px-5 py-3 rounded-2xl hover:text-white transition-colors text-sm">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={goToStep3} className="flex-1 bg-brand-500 hover:bg-brand-400 text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Charity */}
        {step === 3 && (
          <div className="glass rounded-3xl p-8 border border-white/5">
            <h1 className="font-display text-2xl font-bold text-white mb-1">Choose your charity</h1>
            <p className="text-white/50 text-sm mb-6">Step 3 of 3 — Where your contribution goes</p>

            {/* Contribution slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/60">Your charity contribution</label>
                <span className="text-brand-400 font-semibold text-sm">{contributionPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={contributionPct}
                onChange={e => setContributionPct(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>10% (min)</span>
                <span className="text-white/50">{formatCurrency(PLAN_PRICES[plan] * contributionPct / 100)}/mo to charity</span>
                <span>50%</span>
              </div>
            </div>

            {/* Charity grid */}
            <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto mb-6 pr-1">
              {charities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCharity(c.id)}
                  className={`rounded-2xl overflow-hidden border text-left transition-all ${
                    selectedCharity === c.id ? 'border-brand-500/60 ring-1 ring-brand-500/30' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {c.image_url && (
                    <div className="relative h-20">
                      <Image src={c.image_url} alt={c.name} fill className="object-cover" sizes="200px" />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 to-transparent" />
                      {selectedCharity === c.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-2.5">
                    <div className="text-white text-xs font-medium leading-tight">{c.name}</div>
                    {c.category && <div className="text-white/40 text-xs mt-0.5">{c.category}</div>}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 glass border border-white/10 text-white/60 px-5 py-3 rounded-2xl hover:text-white transition-colors text-sm">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading || !selectedCharity}
                className="flex-1 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : <>Complete Signup <Check size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
