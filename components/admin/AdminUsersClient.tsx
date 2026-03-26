'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Search, Shield, User, ChevronDown, ChevronUp, Edit2, Check, X, Loader2 } from 'lucide-react'

interface UserRow {
  id: string; email: string; full_name: string | null; role: string; created_at: string
  charity_contribution_pct: number
  subscriptions: Array<{ plan: string; status: string; current_period_end: string; amount: number }> | null
  charities: { name: string } | null
}

export default function AdminUsersClient({ users: initialUsers }: { users: UserRow[] }) {
  const supabase = createClient()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  async function toggleRole(u: UserRow) {
    const newRole = u.role === 'admin' ? 'subscriber' : 'admin'
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', u.id)
    if (error) { toast.error(error.message); return }
    setUsers(users.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    toast.success(`Role updated to ${newRole}`)
  }

  async function saveEdit(id: string) {
    setSavingId(id)
    const { error } = await supabase.from('profiles').update({ full_name: editName }).eq('id', id)
    if (error) { toast.error(error.message); setSavingId(null); return }
    setUsers(users.map(u => u.id === id ? { ...u, full_name: editName } : u))
    setEditingId(null)
    setSavingId(null)
    toast.success('Name updated')
  }

  async function cancelSubscription(userId: string, subId: string) {
    if (!confirm('Cancel this subscription?')) return
    const { error } = await supabase.from('subscriptions').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', subId)
    if (error) { toast.error(error.message); return }
    setUsers(users.map(u => u.id === userId ? {
      ...u,
      subscriptions: u.subscriptions?.map(s => s.status === 'active' ? { ...s, status: 'cancelled' } : s) || null
    } : u))
    toast.success('Subscription cancelled')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Users</h1>
          <p className="text-white/50 text-sm">{users.length} total users</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="glass border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50 w-64"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(user => {
          const activeSub = user.subscriptions?.find(s => s.status === 'active')
          const isExpanded = expandedId === user.id

          return (
            <div key={user.id} className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/3 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : user.id)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm shrink-0">
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </div>

                {/* Name / email */}
                <div className="flex-1 min-w-0">
                  {editingId === user.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="glass border border-brand-500/30 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none w-48"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(user.id)} className="text-brand-400 hover:text-brand-300">
                        {savingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{user.full_name || '(no name)'}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingId(user.id); setEditName(user.full_name || '') }}
                        className="text-white/20 hover:text-white/60 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="text-white/40 text-xs truncate">{user.email}</div>
                </div>

                {/* Role */}
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20' : 'bg-white/5 text-white/40 border border-white/10'
                }`}>
                  {user.role === 'admin' ? <Shield size={11} /> : <User size={11} />}
                  {user.role}
                </div>

                {/* Sub status */}
                <div className={`hidden sm:block px-2.5 py-1 rounded-full text-xs font-medium ${
                  activeSub ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-white/30'
                }`}>
                  {activeSub ? activeSub.plan : 'No sub'}
                </div>

                <div className="text-white/30">
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-white/40 text-xs mb-1">Joined</div>
                    <div className="text-white">{formatDate(user.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Charity</div>
                    <div className="text-white">{user.charities?.name || '—'} ({user.charity_contribution_pct}%)</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-xs mb-1">Subscription</div>
                    {activeSub ? (
                      <div>
                        <div className="text-white">{activeSub.plan} — {formatCurrency(activeSub.amount)}</div>
                        <div className="text-white/40 text-xs">Until {formatDate(activeSub.current_period_end)}</div>
                      </div>
                    ) : <div className="text-white/40">Inactive</div>}
                  </div>

                  {/* Actions */}
                  <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-2">
                    <button
                      onClick={() => toggleRole(user)}
                      className="flex items-center gap-1.5 glass border border-white/10 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Shield size={12} />
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    {activeSub && (
                      <button
                        onClick={() => cancelSubscription(user.id, activeSub as any)}
                        className="flex items-center gap-1.5 glass border border-red-500/20 text-red-400/60 hover:text-red-400 text-xs px-3 py-1.5 rounded-xl transition-all"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40">No users found.</div>
        )}
      </div>
    </div>
  )
}
