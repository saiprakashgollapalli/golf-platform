'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MONTH_NAMES, generateRandomNumbers, generateAlgorithmicNumbers, runDrawEngine, calculatePrizePool, calculatePrizePerWinner } from '@/lib/draw-engine'
import { Draw, DrawType, PRIZE_DISTRIBUTION } from '@/lib/types'
import { Dices, Play, Send, RefreshCw, Loader2, Trophy, ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Props {
  draws: Draw[]
  monthlyCount: number
  yearlyCount: number
}

export default function AdminDrawsClient({ draws: initialDraws, monthlyCount, yearlyCount }: Props) {
  const supabase = createClient()
  const [draws, setDraws] = useState<Draw[]>(initialDraws)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // New draw config
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [drawType, setDrawType] = useState<DrawType>('random')
  const [simulatedNumbers, setSimulatedNumbers] = useState<number[]>([])
  const [simResult, setSimResult] = useState<{ w5: number; w4: number; w3: number } | null>(null)

  const prizePool = calculatePrizePool(monthlyCount, yearlyCount)

  // Get previous jackpot rollover
  const lastDraw = draws[0]
  const rolledOverJackpot = lastDraw?.jackpot_rolled_over && lastDraw?.jackpot_amount > 0 && lastDraw?.status === 'published'
    ? lastDraw.jackpot_amount * PRIZE_DISTRIBUTION['5-match']
    : 0

  async function simulate() {
    setLoading(true)
    try {
      // Get all active subscribers' scores for algorithmic draw
      let entries: any[] = []
      if (drawType === 'algorithmic') {
        const { data: scores } = await supabase
          .from('scores')
          .select('user_id, score')
          .order('user_id')

        // Group by user
        const byUser: Record<string, number[]> = {}
        for (const s of (scores || [])) {
          if (!byUser[s.user_id]) byUser[s.user_id] = []
          byUser[s.user_id].push(s.score)
        }
        entries = Object.entries(byUser).map(([user_id, nums]) => ({
          user_id, entry_numbers: nums, match_count: 0, is_winner: false, id: user_id, draw_id: ''
        }))
      }

      const numbers = drawType === 'random'
        ? generateRandomNumbers()
        : generateAlgorithmicNumbers(entries, 'most')

      setSimulatedNumbers(numbers)

      // Simulate match counts
      const { data: allEntries } = await supabase.from('scores').select('user_id, score').order('user_id')
      const byUser2: Record<string, number[]> = {}
      for (const s of (allEntries || [])) {
        if (!byUser2[s.user_id]) byUser2[s.user_id] = []
        byUser2[s.user_id].push(s.score)
      }
      const entryList = Object.entries(byUser2).map(([uid, nums]) => ({
        id: uid, draw_id: '', user_id: uid, entry_numbers: nums, match_count: 0, is_winner: false, created_at: ''
      }))

      const result = runDrawEngine(entryList, numbers, prizePool, rolledOverJackpot)
      setSimResult({ w5: result.winners_5match.length, w4: result.winners_4match.length, w3: result.winners_3match.length })

      toast.success(`Simulation complete! ${numbers.join(', ')}`)
    } catch (err) {
      toast.error('Simulation failed')
    }
    setLoading(false)
  }

  async function publishDraw() {
    if (simulatedNumbers.length !== 5) { toast.error('Run simulation first'); return }
    if (!confirm(`Publish draw for ${MONTH_NAMES[month - 1]} ${year}? This cannot be undone.`)) return

    setLoading(true)
    try {
      // Check existing
      const { data: existing } = await supabase.from('draws').select('id').eq('month', month).eq('year', year).single()
      if (existing) { toast.error('Draw for this month already exists'); setLoading(false); return }

      // Snapshot all subscriber entries
      const { data: scores } = await supabase.from('scores').select('user_id, score, played_at')
      const { data: activeSubs } = await supabase.from('subscriptions').select('user_id').eq('status', 'active')
      const activeUserIds = new Set((activeSubs || []).map(s => s.user_id))

      const byUser: Record<string, number[]> = {}
      for (const s of (scores || [])) {
        if (activeUserIds.has(s.user_id)) {
          if (!byUser[s.user_id]) byUser[s.user_id] = []
          byUser[s.user_id].push(s.score)
        }
      }

      const entries = Object.entries(byUser).map(([uid, nums]) => ({
        id: uid, draw_id: '', user_id: uid, entry_numbers: nums.slice(0, 5), match_count: 0, is_winner: false, created_at: ''
      }))

      const result = runDrawEngine(entries, simulatedNumbers, prizePool, rolledOverJackpot)
      const hasJackpotWinner = result.winners_5match.length > 0

      // Create draw record
      const { data: draw, error: drawError } = await supabase.from('draws').insert({
        month,
        year,
        status: 'published',
        draw_type: drawType,
        winning_numbers: simulatedNumbers,
        prize_pool_total: prizePool,
        jackpot_amount: result.jackpot_amount,
        pool_4match: result.pool_4match,
        pool_3match: result.pool_3match,
        jackpot_rolled_over: !hasJackpotWinner,
        participant_count: entries.length,
        published_at: new Date().toISOString(),
      }).select().single()

      if (drawError) throw drawError

      // Insert draw entries
      const entryInserts = entries.map(e => {
        const matches = e.entry_numbers.filter((n: number) => simulatedNumbers.includes(n)).length
        return { draw_id: draw.id, user_id: e.user_id, entry_numbers: e.entry_numbers, match_count: matches, is_winner: matches >= 3 }
      })
      if (entryInserts.length > 0) await supabase.from('draw_entries').insert(entryInserts)

      // Create winner records
      const winnerInserts: any[] = []

      const process5 = result.winners_5match
      const prize5 = calculatePrizePerWinner(result.jackpot_amount, process5.length)
      for (const w of process5) {
        const entry = entryInserts.find(e => e.user_id === w.user_id)
        if (entry) winnerInserts.push({ draw_id: draw.id, user_id: w.user_id, entry_id: w.id, match_type: '5-match', prize_amount: prize5 })
      }

      const prize4 = calculatePrizePerWinner(result.pool_4match, result.winners_4match.length)
      for (const w of result.winners_4match) {
        winnerInserts.push({ draw_id: draw.id, user_id: w.user_id, entry_id: w.id, match_type: '4-match', prize_amount: prize4 })
      }

      const prize3 = calculatePrizePerWinner(result.pool_3match, result.winners_3match.length)
      for (const w of result.winners_3match) {
        winnerInserts.push({ draw_id: draw.id, user_id: w.user_id, entry_id: w.id, match_type: '3-match', prize_amount: prize3 })
      }

      if (winnerInserts.length > 0) await supabase.from('winners').insert(winnerInserts)

      setDraws([draw, ...draws])
      setSimulatedNumbers([])
      setSimResult(null)
      toast.success(`Draw published! ${winnerInserts.length} winner(s) created.`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish draw')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Draw Management</h1>
        <p className="text-white/50 text-sm">Configure, simulate, and publish monthly prize draws.</p>
      </div>

      {/* Prize pool info */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-brand-500/20">
          <div className="text-brand-400 text-xs mb-1">Estimated Prize Pool</div>
          <div className="font-display text-2xl font-bold text-white">{formatCurrency(prizePool)}</div>
          <div className="text-white/40 text-xs mt-1">{monthlyCount} monthly + {yearlyCount} yearly subs</div>
        </div>
        <div className="glass rounded-2xl p-5 border border-gold-500/20">
          <div className="text-gold-400 text-xs mb-1">Jackpot (40%)</div>
          <div className="font-display text-2xl font-bold text-white">{formatCurrency(prizePool * 0.4 + rolledOverJackpot)}</div>
          {rolledOverJackpot > 0 && <div className="text-gold-400 text-xs mt-1">+{formatCurrency(rolledOverJackpot)} rollover</div>}
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="text-white/40 text-xs mb-1">4-Match / 3-Match</div>
          <div className="font-display text-2xl font-bold text-white">{formatCurrency(prizePool * 0.35)} / {formatCurrency(prizePool * 0.25)}</div>
          <div className="text-white/40 text-xs mt-1">split among winners</div>
        </div>
      </div>

      {/* Draw configurator */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <h2 className="font-display text-xl font-semibold text-white mb-6">Configure New Draw</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs text-white/50 mb-2">Month</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/50 bg-transparent"
            >
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1} className="bg-dark-900">{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2">Draw Type</label>
            <select
              value={drawType}
              onChange={e => setDrawType(e.target.value as DrawType)}
              className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none bg-transparent"
            >
              <option value="random" className="bg-dark-900">Random</option>
              <option value="algorithmic" className="bg-dark-900">Algorithmic (weighted)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={simulate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 glass border border-brand-500/30 text-brand-400 hover:bg-brand-500/10 font-medium py-3 rounded-2xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Simulate
            </button>
          </div>
        </div>

        {/* Simulation result */}
        {simulatedNumbers.length > 0 && (
          <div className="glass-green rounded-2xl p-5 mb-5 border border-brand-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-brand-400 text-xs font-medium mb-2">Simulated Winning Numbers</div>
                <div className="flex gap-3">
                  {simulatedNumbers.map(n => (
                    <div key={n} className="number-ball animate-fade-in">{n}</div>
                  ))}
                </div>
              </div>
              {simResult && (
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gold-400">{simResult.w5}</div>
                    <div className="text-white/40 text-xs">5-match</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-brand-400">{simResult.w4}</div>
                    <div className="text-white/40 text-xs">4-match</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-400">{simResult.w3}</div>
                    <div className="text-white/40 text-xs">3-match</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
              <Info size={12} />
              This is a simulation only. Click Publish to make it official.
            </div>
          </div>
        )}

        <button
          onClick={publishDraw}
          disabled={loading || simulatedNumbers.length !== 5}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-2xl transition-all"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Publish Draw for {MONTH_NAMES[month - 1]} {year}
        </button>
      </div>

      {/* Draws list */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">Draw History</h2>
        <div className="space-y-2">
          {draws.length === 0 && <p className="text-white/40 text-sm">No draws yet.</p>}
          {draws.map(draw => (
            <div key={draw.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => setExpandedId(expandedId === draw.id ? null : draw.id)}
              >
                <div className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                  draw.status === 'published' ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-white/40'
                }`}>{draw.status}</div>
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{MONTH_NAMES[draw.month - 1]} {draw.year}</div>
                  <div className="text-white/40 text-xs">{draw.participant_count} participants · {draw.draw_type}</div>
                </div>
                <div className="hidden sm:flex gap-2">
                  {draw.winning_numbers?.map((n: number) => (
                    <div key={n} className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-mono">{n}</div>
                  ))}
                </div>
                <div className="text-white/40 text-sm font-medium">{formatCurrency(draw.prize_pool_total)}</div>
                {expandedId === draw.id ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
              </div>

              {expandedId === draw.id && (
                <div className="border-t border-white/5 p-4 grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Jackpot (40%)</div>
                    <div className="text-gold-400 font-semibold">{formatCurrency(draw.jackpot_amount)}</div>
                    {draw.jackpot_rolled_over && <div className="text-gold-400/60 text-xs">Rolled over →</div>}
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">4-Match (35%)</div>
                    <div className="text-white">{formatCurrency(draw.pool_4match)}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">3-Match (25%)</div>
                    <div className="text-white">{formatCurrency(draw.pool_3match)}</div>
                  </div>
                  {draw.published_at && (
                    <div className="sm:col-span-3 text-white/30 text-xs">Published: {formatDate(draw.published_at)}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
