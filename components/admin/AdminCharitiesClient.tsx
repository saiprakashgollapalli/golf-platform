'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2, Edit2, Check, X, Loader2, Star, Eye, EyeOff, HeartHandshake } from 'lucide-react'
import Image from 'next/image'

interface CharityRow {
  id: string
  name: string
  description: string
  long_description: string | null
  image_url: string | null
  website_url: string | null
  category: string | null
  is_featured: boolean
  is_active: boolean
  total_raised: number
  charity_events: Array<{ id: string; title: string; event_date: string }>
}

const BLANK = {
  name: '', description: '', long_description: '', image_url: '', website_url: '', category: '', is_featured: false,
}

export default function AdminCharitiesClient({ charities: init }: { charities: CharityRow[] }) {
  const supabase = createClient()
  const [charities, setCharities] = useState(init)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(false)

  function startEdit(c: CharityRow) {
    setEditId(c.id)
    setForm({ name: c.name, description: c.description, long_description: c.long_description || '', image_url: c.image_url || '', website_url: c.website_url || '', category: c.category || '', is_featured: c.is_featured })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(BLANK)
  }

  async function saveCharity() {
    if (!form.name || !form.description) { toast.error('Name and description required'); return }
    setLoading(true)

    const payload = {
      name: form.name,
      description: form.description,
      long_description: form.long_description || null,
      image_url: form.image_url || null,
      website_url: form.website_url || null,
      category: form.category || null,
      is_featured: form.is_featured,
    }

    if (editId) {
      const { data, error } = await supabase.from('charities').update(payload).eq('id', editId).select().single()
      if (error) { toast.error(error.message); setLoading(false); return }
      setCharities(charities.map(c => c.id === editId ? { ...c, ...data } : c))
      toast.success('Charity updated')
    } else {
      const { data, error } = await supabase.from('charities').insert({ ...payload, is_active: true, total_raised: 0 }).select().single()
      if (error) { toast.error(error.message); setLoading(false); return }
      setCharities([{ ...data, charity_events: [] }, ...charities])
      toast.success('Charity added')
    }

    cancelForm()
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    const { error } = await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setCharities(charities.map(c => c.id === id ? { ...c, is_active: !current } : c))
    toast.success(current ? 'Charity hidden' : 'Charity shown')
  }

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    setCharities(charities.map(c => c.id === id ? { ...c, is_featured: !current } : c))
    toast.success(current ? 'Removed from featured' : 'Set as featured')
  }

  async function deleteCharity(id: string) {
    if (!confirm('Delete this charity? This cannot be undone.')) return
    const { error } = await supabase.from('charities').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setCharities(charities.filter(c => c.id !== id))
    toast.success('Charity deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Charities</h1>
          <p className="text-white/50 text-sm">{charities.length} charities in the directory</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK) }}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-medium px-5 py-2.5 rounded-2xl text-sm transition-all"
        >
          <Plus size={16} />
          Add Charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass rounded-3xl p-6 border border-brand-500/20">
          <h2 className="font-display text-xl font-semibold text-white mb-5">{editId ? 'Edit Charity' : 'Add New Charity'}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1.5">Charity Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Macmillan Cancer Support" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1.5">Short Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Brief 1-2 sentence summary" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1.5">Full Description</label>
              <textarea value={form.long_description || ''} onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))} rows={3} placeholder="Longer description for charity profile page" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Image URL</label>
              <input value={form.image_url || ''} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://…" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Website URL</label>
              <input value={form.website_url || ''} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://…" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Category</label>
              <input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Health, Children, Environment…" className="w-full glass border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-brand-500/50" />
            </div>
            <div className="flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
                className={`w-11 h-6 rounded-full transition-all relative ${form.is_featured ? 'bg-gold-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${form.is_featured ? 'left-5' : 'left-0.5'}`} />
              </button>
              <label className="text-white/60 text-sm">Featured on homepage</label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancelForm} className="flex items-center gap-2 glass border border-white/10 text-white/60 px-5 py-2.5 rounded-2xl text-sm hover:text-white transition-all">
              <X size={14} /> Cancel
            </button>
            <button
              onClick={saveCharity}
              disabled={loading}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white font-medium px-5 py-2.5 rounded-2xl text-sm transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editId ? 'Save Changes' : 'Add Charity'}
            </button>
          </div>
        </div>
      )}

      {/* Charities grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {charities.map(c => (
          <div key={c.id} className={`glass rounded-3xl border overflow-hidden transition-all ${c.is_active ? 'border-white/5' : 'border-white/5 opacity-50'}`}>
            {c.image_url && (
              <div className="relative h-36 overflow-hidden">
                <Image src={c.image_url} alt={c.name} fill className="object-cover" sizes="350px" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                {c.is_featured && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold-500/90 text-dark-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star size={9} fill="currentColor" /> Featured
                  </div>
                )}
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display text-base font-semibold text-white leading-tight">{c.name}</h3>
                {c.category && <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{c.category}</span>}
              </div>
              <p className="text-white/50 text-xs mb-3 line-clamp-2">{c.description}</p>
              <div className="text-brand-400 text-sm font-semibold mb-3">{formatCurrency(c.total_raised)} raised</div>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => startEdit(c)} className="flex items-center gap-1 glass border border-white/10 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all">
                  <Edit2 size={11} /> Edit
                </button>
                <button onClick={() => toggleFeatured(c.id, c.is_featured)} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl transition-all border ${c.is_featured ? 'border-gold-500/30 text-gold-400 bg-gold-500/10' : 'glass border-white/10 text-white/50 hover:text-gold-400'}`}>
                  <Star size={11} /> {c.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={() => toggleActive(c.id, c.is_active)} className="flex items-center gap-1 glass border border-white/10 text-white/50 hover:text-white text-xs px-3 py-1.5 rounded-xl transition-all">
                  {c.is_active ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                </button>
                <button onClick={() => deleteCharity(c.id)} className="flex items-center gap-1 glass border border-red-500/20 text-red-400/50 hover:text-red-400 text-xs px-3 py-1.5 rounded-xl transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {charities.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/40">
            <HeartHandshake size={40} className="mx-auto mb-3 opacity-20" />
            No charities yet. Add your first one!
          </div>
        )}
      </div>
    </div>
  )
}
