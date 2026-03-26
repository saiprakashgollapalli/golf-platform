'use client'

import { useState } from 'react'
import { Score } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { Plus, Trash2, Loader2, Info, Target, Edit2, Check, X } from 'lucide-react'

interface Props {
  initialScores: Score[]
  userId: string
  hasSubscription: boolean
}

export default function ScoreManager({ initialScores, userId, hasSubscription }: Props) {
  const supabase = createClient()
  const [scores, setScores] = useState<Score[]>(initialScores)
  const [loading, setLoading] = useState(false)

  // New score form
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newCourse, setNewCourse] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editScore, setEditScore] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editCourse, setEditCourse] = useState('')

  async function addScore(e: React.FormEvent) {
    e.preventDefault()
    const val = parseInt(newScore)
    if (isNaN(val) || val < 1 || val > 45) { toast.error('Score must be between 1 and 45'); return }
    if (!newDate) { toast.error('Please select a date'); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('scores')
      .insert({ user_id: userId, score: val, played_at: newDate, course_name: newCourse || null })
      .select()
      .single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Refetch to reflect trigger (oldest may have been removed)
    const { data: fresh } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })

    setScores(fresh || [])
    setNewScore('')
    setNewDate(new Date().toISOString().split('T')[0])
    setNewCourse('')
    toast.success('Score added!')
    setLoading(false)
  }

  async function deleteScore(id: string) {
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setScores(scores.filter(s => s.id !== id))
    toast.success('Score removed')
  }

  function startEdit(score: Score) {
    setEditingId(score.id)
    setEditScore(String(score.score))
    setEditDate(score.played_at)
    setEditCourse(score.course_name || '')
  }

  async function saveEdit(id: string) {
    const val = parseInt(editScore)
    if (isNaN(val) || val < 1 || val > 45) { toast.error('Score must be between 1 and 45'); return }
    const { error } = await supabase
      .from('scores')
      .update({ score: val, played_at: editDate, course_name: editCourse || null })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    setScores(scores.map(s => s.id === id ? { ...s, score: val, played_at: editDate, course_name: editCourse || null } : s))
    setEditingId(null)
    toast.success('Score updated')
  }

  const avgScore = scores.length ? (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1) : '—'
  const maxScore = scores.length ? Math.max(...scores.map(s => s.score)) : 0
  const minScore = scores.length ? Math.min(...scores.map(s => s.score)) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">My Draw Numbers</h1>
        <p className="text-white/50 text-sm">Your last 5 Stableford scores are your monthly draw numbers. Adding a 6th removes the oldest.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Average', value: avgScore, unit: 'pts' },
          { label: 'Best', value: maxScore || '—', unit: 'pts' },
          { label: 'Worst', value: minScore || '—', unit: 'pts' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-4 text-center border border-white/5">
            <div className="font-display text-2xl font-bold gradient-text">{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Score list */}
        <div className="lg:col-span-3 glass rounded-3xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-white">Your Scores</h2>
            <div className="text-white/40 text-sm">{scores.length}/5 slots used</div>
          </div>

          {scores.length === 0 ? (
            <div className="text-center py-12">
              <Target size={48} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/40">No scores yet — add your first round!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((score, idx) => (
                <div
                  key={score.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    idx === 0 ? 'glass-green border-brand-500/20' : 'glass border-white/5'
                  }`}
                >
                  {editingId === score.id ? (
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={editScore}
                        onChange={e => setEditScore(e.target.value)}
                        min={1}
                        max={45}
                        className="glass border border-brand-500/30 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="glass border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none col-span-1"
                      />
                      <input
                        type="text"
                        value={editCourse}
                        onChange={e => setEditCourse(e.target.value)}
                        placeholder="Course"
                        className="glass border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="number-ball shrink-0">{score.score}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium">{score.course_name || 'Golf Round'}</div>
                        <div className="text-white/40 text-xs">{formatDate(score.played_at)}</div>
                      </div>
                      <div className="hidden sm:block w-20">
                        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div className="score-bar" style={{ width: `${(score.score / 45) * 100}%` }} />
                        </div>
                        <div className="text-white/30 text-xs mt-1 text-right">{score.score}/45</div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  {editingId === score.id ? (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => saveEdit(score.id)} className="w-8 h-8 bg-brand-500/20 rounded-xl flex items-center justify-center text-brand-400 hover:bg-brand-500/30">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-white/40 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEdit(score)} className="w-8 h-8 glass border border-white/5 rounded-xl flex items-center justify-center text-white/30 hover:text-white transition-colors">
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => deleteScore(score.id)} className="w-8 h-8 glass border border-white/5 rounded-xl flex items-center justify-center text-red-400/50 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Rolling-limit notice */}
          {scores.length === 5 && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-gold-500/5 border border-gold-500/10">
              <Info size={14} className="text-gold-400 shrink-0 mt-0.5" />
              <p className="text-white/50 text-xs">You have 5 scores. Adding a new one will automatically remove your oldest score.</p>
            </div>
          )}
        </div>

        {/* Add score form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-3xl p-6 border border-white/5 sticky top-24">
            <h2 className="font-display text-lg font-semibold text-white mb-5">Add a Score</h2>

            {!hasSubscription ? (
              <div className="text-center py-6">
                <div className="text-white/40 text-sm mb-3">Active subscription required to log scores.</div>
                <a href="/auth/signup" className="bg-brand-500 text-white text-sm px-5 py-2.5 rounded-xl inline-block">Subscribe Now</a>
              </div>
            ) : (
              <form onSubmit={addScore} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Stableford Score
                    <span className="text-white/30 ml-1">(1–45)</span>
                  </label>
                  <input
                    type="number"
                    value={newScore}
                    onChange={e => setNewScore(e.target.value)}
                    min={1}
                    max={45}
                    placeholder="e.g. 28"
                    className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Date Played</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-2">Course Name <span className="text-white/30">(optional)</span></label>
                  <input
                    type="text"
                    value={newCourse}
                    onChange={e => setNewCourse(e.target.value)}
                    placeholder="St Andrews, etc."
                    className="w-full glass border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {loading ? 'Adding…' : 'Add Score'}
                </button>
              </form>
            )}

            {/* Info box */}
            <div className="mt-5 p-4 rounded-2xl bg-white/3 border border-white/5 text-xs text-white/40 space-y-1.5">
              <p className="font-medium text-white/60">How draw numbers work</p>
              <p>Your 5 Stableford scores become your 5 draw numbers each month.</p>
              <p>Match 3, 4, or all 5 to win — higher scores = higher draw numbers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
