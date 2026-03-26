'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MONTH_NAMES } from '@/lib/draw-engine'
import { Trophy, Check, X, ExternalLink, Loader2, Clock, Banknote, Filter } from 'lucide-react'

interface WinnerRow {
  id: string
  user_id: string
  draw_id: string
  match_type: string
  prize_amount: number
  payment_status: string
  proof_url: string | null
  proof_submitted_at: string | null
  verified_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  profiles: { full_name: string | null; email: string } | null
  draws: { month: number; year: number; winning_numbers: number[] } | null
}

const MATCH_COLORS: Record<string, string> = {
  '5-match': 'text-gold-400 bg-gold-500/10 border-gold-500/20',
  '4-match': 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  '3-match': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-gold-400 bg-gold-500/10',
  approved: 'text-brand-400 bg-brand-500/10',
  paid: 'text-blue-400 bg-blue-500/10',
  rejected: 'text-red-400 bg-red-500/10',
}

export default function AdminWinnersClient({ winners: initialWinners }: { winners: WinnerRow[] }) {
  const supabase = createClient()
  const [winners, setWinners] = useState(initialWinners)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = winners.filter(w => statusFilter === 'all' || w.payment_status === statusFilter)

  async function updateStatus(id: string, status: string, adminId?: string) {
    setLoadingId(id)
    const update: Record<string, unknown> = {
      payment_status: status,
      notes: notesMap[id] || null,
    }
    if (status === 'approved') update.verified_at = new Date().toISOString()
    if (status === 'paid') update.paid_at = new Date().toISOString()

    const { error } = await supabase.from('winners').update(update).eq('id', id)
    if (error) { toast.error(error.message); setLoadingId(null); return }

    setWinners(winners.map(w => w.id === id ? { ...w, ...update } : w))
    toast.success(`Status updated to ${status}`)
    setLoadingId(null)
  }

  const counts = {
    all: winners.length,
    pending: winners.filter(w => w.payment_status === 'pending').length,
    approved: winners.filter(w => w.payment_status === 'approved').length,
    paid: winners.filter(w => w.payment_status === 'paid').length,
    rejected: winners.filter(w => w.payment_status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Winner Verification</h1>
        <p className="text-white/50 text-sm">Review proof uploads and manage prize payouts.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {(['all', 'pending', 'approved', 'paid', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              statusFilter === s
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'glass border border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {s} <span className="text-xs opacity-60 ml-1">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Winners list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Trophy size={40} className="mx-auto mb-3 opacity-20" />
            No winners in this category.
          </div>
        )}

        {filtered.map(winner => (
          <div key={winner.id} className="glass rounded-3xl border border-white/5 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              {/* Left: info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${MATCH_COLORS[winner.match_type] || ''}`}>
                    <Trophy size={11} />
                    {winner.match_type}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[winner.payment_status] || ''}`}>
                    {winner.payment_status}
                  </div>
                  <div className="text-gold-400 font-semibold">{formatCurrency(winner.prize_amount)}</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-white/40 text-xs block">Member</span>
                    <span className="text-white">{winner.profiles?.full_name || winner.profiles?.email || 'Unknown'}</span>
                    <span className="text-white/40 text-xs block">{winner.profiles?.email}</span>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs block">Draw</span>
                    <span className="text-white">
                      {winner.draws ? `${MONTH_NAMES[winner.draws.month - 1]} ${winner.draws.year}` : '—'}
                    </span>
                  </div>
                  {winner.draws?.winning_numbers && (
                    <div>
                      <span className="text-white/40 text-xs block mb-1">Winning Numbers</span>
                      <div className="flex gap-1.5">
                        {winner.draws.winning_numbers.map((n: number) => (
                          <div key={n} className="w-7 h-7 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-mono">{n}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-white/40 text-xs block">Won on</span>
                    <span className="text-white text-sm">{formatDate(winner.created_at)}</span>
                  </div>
                </div>

                {/* Proof */}
                <div className="mb-3">
                  <span className="text-white/40 text-xs block mb-1">Proof of Scores</span>
                  {winner.proof_url ? (
                    <a
                      href={winner.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm transition-colors"
                    >
                      <ExternalLink size={13} />
                      View submitted proof
                      {winner.proof_submitted_at && <span className="text-white/30 text-xs ml-1">({formatDate(winner.proof_submitted_at)})</span>}
                    </a>
                  ) : (
                    <span className="text-white/30 text-sm">No proof uploaded yet</span>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="text-white/40 text-xs block mb-1">Admin Notes</label>
                  <input
                    type="text"
                    placeholder="Optional notes…"
                    defaultValue={winner.notes || ''}
                    onChange={e => setNotesMap(prev => ({ ...prev, [winner.id]: e.target.value }))}
                    className="w-full glass border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50"
                  />
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex lg:flex-col gap-2 shrink-0">
                {winner.payment_status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(winner.id, 'approved')}
                      disabled={loadingId === winner.id}
                      className="flex items-center gap-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 text-sm font-medium px-4 py-2.5 rounded-2xl transition-all disabled:opacity-50"
                    >
                      {loadingId === winner.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(winner.id, 'rejected')}
                      disabled={loadingId === winner.id}
                      className="flex items-center gap-2 glass border border-red-500/20 text-red-400/60 hover:text-red-400 text-sm px-4 py-2.5 rounded-2xl transition-all disabled:opacity-50"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </>
                )}

                {winner.payment_status === 'approved' && (
                  <button
                    onClick={() => updateStatus(winner.id, 'paid')}
                    disabled={loadingId === winner.id}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-sm font-medium px-4 py-2.5 rounded-2xl transition-all disabled:opacity-50"
                  >
                    {loadingId === winner.id ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                    Mark as Paid
                  </button>
                )}

                {winner.payment_status === 'rejected' && (
                  <button
                    onClick={() => updateStatus(winner.id, 'pending')}
                    disabled={loadingId === winner.id}
                    className="flex items-center gap-2 glass border border-white/10 text-white/50 hover:text-white text-sm px-4 py-2.5 rounded-2xl transition-all"
                  >
                    <Clock size={14} />
                    Reopen
                  </button>
                )}

                {winner.payment_status === 'paid' && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm px-4 py-2.5">
                    <Banknote size={14} />
                    <span>Paid {winner.paid_at ? formatDate(winner.paid_at) : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
