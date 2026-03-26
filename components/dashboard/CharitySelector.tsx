'use client'

import { useState } from 'react'
import { Charity, CharityEvent } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, Heart, Calendar, ExternalLink, Check, Search } from 'lucide-react'
import Image from 'next/image'
import { PLAN_PRICES } from '@/lib/types'

interface CharityWithEvents extends Charity { charity_events?: CharityEvent[] }

interface Props {
  initialCharity: string | null
  initialPct: number
  charities: CharityWithEvents[]
  userId: string
}

export default function CharitySelector({ initialCharity, initialPct, charities, userId }: Props) {
  const supabase = createClient()
  const [selected, setSelected] = useState(initialCharity)
  const [pct, setPct] = useState(initialPct)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  const categories = ['All', ...Array.from(new Set(charities.map(c => c.category).filter(Boolean) as string[]))]

  const filtered = charities.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || c.category === categoryFilter
    return matchSearch && matchCat
  })

  const selectedCharity = charities.find(c => c.id === selected)

  async function save() {
    if (!selected) { toast.error('Please select a charity'); return }
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ charity_id: selected, charity_contribution_pct: pct })
      .eq('id', userId)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Charity preferences saved!')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">Choose Your Charity</h1>
        <p className="text-white/50 text-sm">Select where a portion of your subscription will go each month.</p>
      </div>

      {/* Contribution slider */}
      <div className="glass rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white font-semibold">Your Contribution</h2>
            <p className="text-white/40 text-sm mt-0.5">Minimum 10% required</p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold gradient-text">{pct}%</div>
            <div className="text-white/40 text-xs">≈ {formatCurrency(PLAN_PRICES.monthly * pct / 100)}/mo</div>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={50}
          step={5}
          value={pct}
          onChange={e => setPct(Number(e.target.value))}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>10% (min)</span>
          <span>50%</span>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search charities…"
            className="w-full glass border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-500/50 transition-colors text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                categoryFilter === cat ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'glass border border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Charity grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(charity => (
          <div
            key={charity.id}
            onClick={() => setSelected(charity.id)}
            className={`rounded-3xl overflow-hidden border cursor-pointer transition-all duration-200 glass ${
              selected === charity.id
                ? 'border-brand-500/60 ring-2 ring-brand-500/20'
                : 'border-white/5 hover:border-brand-500/20'
            }`}
          >
            {/* Image */}
            <div className="relative h-40 overflow-hidden">
              {charity.image_url ? (
                <Image src={charity.image_url} alt={charity.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-900/40 to-dark-800 flex items-center justify-center">
                  <Heart size={36} className="text-brand-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
              {charity.is_featured && (
                <div className="absolute top-2 left-2 bg-gold-500/90 text-dark-900 text-xs font-semibold px-2 py-0.5 rounded-full">Featured</div>
              )}
              {selected === charity.id && (
                <div className="absolute top-2 right-2 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display text-base font-semibold text-white leading-tight">{charity.name}</h3>
                {charity.category && (
                  <span className="shrink-0 text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{charity.category}</span>
                )}
              </div>
              <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-3">{charity.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-brand-400 text-sm font-semibold">{formatCurrency(charity.total_raised)}</div>
                  <div className="text-white/30 text-xs">raised total</div>
                </div>
                {charity.website_url && (
                  <a href={charity.website_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-white/30 hover:text-white transition-colors">
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>

              {/* Upcoming events */}
              {charity.charity_events && charity.charity_events.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                    <Calendar size={11} />
                    <span>Upcoming event</span>
                  </div>
                  <div className="text-white/60 text-xs">{charity.charity_events[0].title}</div>
                  <div className="text-white/30 text-xs">{formatDate(charity.charity_events[0].event_date)}</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-white/40">
            <Heart size={40} className="mx-auto mb-3 opacity-20" />
            No charities found matching your search.
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="sticky bottom-6">
        <button
          onClick={save}
          disabled={loading || !selected}
          className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 glow-green shadow-2xl"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          {loading ? 'Saving…' : 'Save Charity Preferences'}
        </button>
      </div>
    </div>
  )
}
