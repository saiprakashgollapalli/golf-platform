'use client'

import { useState } from 'react'
import { Winner } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MONTH_NAMES } from '@/lib/draw-engine'
import { Trophy, Upload, Loader2, Clock, CheckCircle, XCircle, Banknote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface WinnerWithDraw extends Winner { draws?: { month: number; year: number; winning_numbers: number[] } }

interface Props { winners: WinnerWithDraw[]; userId: string }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending Verification', color: 'text-gold-400', icon: <Clock size={14} /> },
  approved: { label: 'Approved', color: 'text-brand-400', icon: <CheckCircle size={14} /> },
  paid: { label: 'Paid', color: 'text-blue-400', icon: <Banknote size={14} /> },
  rejected: { label: 'Rejected', color: 'text-red-400', icon: <XCircle size={14} /> },
}

const MATCH_COLORS: Record<string, string> = {
  '5-match': 'text-gold-400 bg-gold-500/10 border-gold-500/20',
  '4-match': 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  '3-match': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

export default function WinningsView({ winners, userId }: Props) {
  const supabase = createClient()
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const totalWon = winners.reduce((s, w) => s + w.prize_amount, 0)
  const totalPaid = winners.filter(w => w.payment_status === 'paid').reduce((s, w) => s + w.prize_amount, 0)
  const pending = winners.filter(w => w.payment_status === 'pending' || w.payment_status === 'approved').length

  async function uploadProof(winnerId: string, file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return }

    setUploadingId(winnerId)
    const path = `${userId}/${winnerId}/${file.name}`

    const { error: uploadError } = await supabase.storage.from('winner-proofs').upload(path, file, { upsert: true })
    if (uploadError) { toast.error(uploadError.message); setUploadingId(null); return }

    const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(path)

    const { error } = await supabase.from('winners').update({
      proof_url: publicUrl,
      proof_submitted_at: new Date().toISOString(),
    }).eq('id', winnerId)

    if (error) { toast.error(error.message) } else { toast.success('Proof uploaded! Awaiting admin review.') }
    setUploadingId(null)
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">My Winnings</h1>
        <p className="text-white/50 text-sm">Track your prize history and payment status.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Won', value: formatCurrency(totalWon), color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
          { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
          { label: 'Pending', value: pending, color: 'text-white', bg: 'bg-white/5 border-white/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-5 border ${s.bg} text-center`}>
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Winners list */}
      {winners.length === 0 ? (
        <div className="glass rounded-3xl p-12 border border-white/5 text-center">
          <Trophy size={56} className="text-white/10 mx-auto mb-4" />
          <h3 className="font-display text-xl text-white mb-2">No wins yet</h3>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Keep logging your Stableford scores each month. Match 3, 4, or 5 numbers in the monthly draw to win!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {winners.map(winner => {
            const statusConf = STATUS_CONFIG[winner.payment_status]
            const matchColor = MATCH_COLORS[winner.match_type] || ''
            const draw = winner.draws
            return (
              <div key={winner.id} className="glass rounded-3xl p-6 border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Match badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold shrink-0 ${matchColor}`}>
                    <Trophy size={14} />
                    {winner.match_type}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-white font-semibold">
                        {draw ? `${MONTH_NAMES[draw.month - 1]} ${draw.year} Draw` : 'Prize Draw'}
                      </span>
                      <div className={`flex items-center gap-1.5 text-xs ${statusConf.color}`}>
                        {statusConf.icon}
                        {statusConf.label}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-3">
                      <span>Won: <span className="text-gold-400 font-semibold">{formatCurrency(winner.prize_amount)}</span></span>
                      <span>Date: {formatDate(winner.created_at)}</span>
                      {winner.paid_at && <span>Paid: {formatDate(winner.paid_at)}</span>}
                    </div>

                    {/* Winning numbers */}
                    {draw?.winning_numbers && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {draw.winning_numbers.map((n: number) => (
                          <div key={n} className="number-ball w-8 h-8 text-xs">{n}</div>
                        ))}
                      </div>
                    )}

                    {/* Proof upload */}
                    {(winner.payment_status === 'pending') && (
                      <div className="mt-3">
                        {winner.proof_url ? (
                          <div className="flex items-center gap-2 text-brand-400 text-xs">
                            <CheckCircle size={14} />
                            Proof submitted — awaiting review
                          </div>
                        ) : (
                          <div>
                            <p className="text-white/50 text-xs mb-2">Upload proof of your scores to claim your prize:</p>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => { if (e.target.files?.[0]) uploadProof(winner.id, e.target.files[0]) }}
                                disabled={uploadingId === winner.id}
                              />
                              <div className="inline-flex items-center gap-2 glass border border-white/10 hover:border-brand-500/30 text-white/60 hover:text-white text-xs px-4 py-2 rounded-xl transition-all">
                                {uploadingId === winner.id
                                  ? <><Loader2 size={12} className="animate-spin" /> Uploading…</>
                                  : <><Upload size={12} /> Upload Score Screenshot</>
                                }
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {winner.notes && (
                      <div className="mt-2 text-xs text-white/40 italic">{winner.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
