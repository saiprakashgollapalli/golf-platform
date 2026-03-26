export type UserRole = 'subscriber' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  charity_id: string | null
  charity_contribution_pct: number
  created_at: string
  updated_at: string
}

export interface Charity {
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
  created_at: string
  updated_at: string
}

export interface CharityEvent {
  id: string
  charity_id: string
  title: string
  description: string | null
  event_date: string
  location: string | null
  registration_url: string | null
  created_at: string
}

export type SubscriptionPlan = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed' | 'pending'

export interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  amount: number
  currency: string
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number
  played_at: string
  course_name: string | null
  created_at: string
}

export type DrawStatus = 'pending' | 'simulated' | 'published'
export type DrawType = 'random' | 'algorithmic'

export interface Draw {
  id: string
  month: number
  year: number
  status: DrawStatus
  draw_type: DrawType
  winning_numbers: number[]
  prize_pool_total: number
  jackpot_amount: number
  pool_4match: number
  pool_3match: number
  jackpot_rolled_over: boolean
  rolled_over_from: string | null
  participant_count: number
  notes: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type MatchType = '5-match' | '4-match' | '3-match'
export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'rejected'

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  entry_id: string
  match_type: MatchType
  prize_amount: number
  payment_status: PaymentStatus
  proof_url: string | null
  proof_submitted_at: string | null
  verified_at: string | null
  verified_by: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  draws?: Draw
}

export interface DrawEntry {
  id: string
  draw_id: string
  user_id: string
  entry_numbers: number[]
  match_count: number
  is_winner: boolean
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  subscription_id: string | null
  amount: number
  currency: string
  status: string
  payment_type: string
  charity_amount: number
  prize_pool_amount: number
  platform_amount: number
  created_at: string
}

// Draw engine types
export interface DrawResult {
  winning_numbers: number[]
  winners_5match: DrawEntry[]
  winners_4match: DrawEntry[]
  winners_3match: DrawEntry[]
  prize_pool_total: number
  jackpot_amount: number
  pool_4match: number
  pool_3match: number
}

export const PLAN_PRICES = {
  monthly: 9.99,
  yearly: 99.99,
}

export const PRIZE_POOL_PCT = 0.6  // 60% of subscription goes to prize pool
export const CHARITY_MIN_PCT = 0.1 // 10% minimum to charity
export const PLATFORM_PCT = 0.3    // 30% platform fee

export const PRIZE_DISTRIBUTION = {
  '5-match': 0.40,
  '4-match': 0.35,
  '3-match': 0.25,
}
