import Image from 'next/image'
import { Charity } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Heart } from 'lucide-react'

interface Props {
  charity: Charity
  selected?: boolean
  onSelect?: () => void
}

export default function CharityCard({ charity, selected, onSelect }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`group rounded-3xl overflow-hidden border transition-all duration-300 ${
        selected
          ? 'border-brand-500/60 shadow-lg shadow-brand-500/10'
          : 'border-white/5 hover:border-brand-500/20'
      } ${onSelect ? 'cursor-pointer' : ''} glass`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {charity.image_url ? (
          <Image
            src={charity.image_url}
            alt={charity.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-900/40 to-dark-800 flex items-center justify-center">
            <Heart size={40} className="text-brand-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
        {charity.is_featured && (
          <div className="absolute top-3 left-3 bg-gold-500/90 text-dark-900 text-xs font-semibold px-3 py-1 rounded-full">
            Featured
          </div>
        )}
        {selected && (
          <div className="absolute top-3 right-3 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        {charity.category && (
          <div className="absolute bottom-3 left-3 glass text-white/70 text-xs px-3 py-1 rounded-full">
            {charity.category}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold text-white mb-2">{charity.name}</h3>
        <p className="text-white/50 text-sm leading-relaxed line-clamp-2 mb-4">{charity.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-brand-400 font-semibold text-sm">{formatCurrency(charity.total_raised)}</div>
            <div className="text-white/30 text-xs">raised so far</div>
          </div>
          {onSelect && (
            <div className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
              selected ? 'bg-brand-500 text-white' : 'glass border border-white/10 text-white/60'
            }`}>
              {selected ? 'Selected' : 'Choose'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
