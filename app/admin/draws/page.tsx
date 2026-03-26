import { createClient } from '@/lib/supabase/server'
import AdminDrawsClient from '@/components/admin/AdminDrawsClient'

export default async function AdminDrawsPage() {
  const supabase = createClient()

  const [drawsRes, subsRes] = await Promise.all([
    supabase.from('draws').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('subscriptions').select('plan', { count: 'exact' }).eq('status', 'active'),
  ])

  // Calculate current prize pool from active subs
  const subs = subsRes.data || []
  const monthlyCount = subs.filter(s => s.plan === 'monthly').length
  const yearlyCount = subs.filter(s => s.plan === 'yearly').length

  return (
    <AdminDrawsClient
      draws={drawsRes.data || []}
      monthlyCount={monthlyCount}
      yearlyCount={yearlyCount}
    />
  )
}
