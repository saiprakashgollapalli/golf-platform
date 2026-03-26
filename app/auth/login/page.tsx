'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Welcome back!')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-dark-900 to-dark-950" />
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="relative text-center px-12">
          <div className="w-20 h-20 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-8">
            <Heart size={36} className="text-brand-400" fill="currentColor" />
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">Golf with purpose.</h2>
          <p className="text-white/50 text-lg leading-relaxed max-w-xs mx-auto">
            Track your scores, support charities, win monthly prizes.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[['£48K+', 'Raised'], ['1,840', 'Members'], ['£3.5K', 'Jackpot']].map(([val, lbl]) => (
              <div key={lbl} className="glass rounded-2xl p-4 text-center">
                <div className="font-display text-xl font-bold gradient-text">{val}</div>
                <div className="text-white/40 text-xs mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <Heart size={14} fill="white" className="text-white" />
            </div>
            <span className="font-display text-xl font-semibold text-white">GreenHeart</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/50 mb-8">Sign in to your GreenHeart account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 glow-green"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 glass rounded-2xl border border-white/5 text-xs text-white/40 space-y-1">
            <p className="font-medium text-white/60 mb-2">Demo credentials:</p>
            <p>User: <span className="text-brand-400">user@demo.com</span> / <span className="text-brand-400">Demo1234!</span></p>
            <p>Admin: <span className="text-gold-400">admin@demo.com</span> / <span className="text-gold-400">Admin1234!</span></p>
          </div>

          <p className="text-center text-white/40 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
