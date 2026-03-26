import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CharitySelector from '@/components/dashboard/CharitySelector'

export default async function CharityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, charitiesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('charities').select('*, charity_events(*)').eq('is_active', true).order('is_featured', { ascending: false }),
  ])

  return (
    <CharitySelector
      initialCharity={profileRes.data?.charity_id || null}
      initialPct={profileRes.data?.charity_contribution_pct || 10}
      charities={charitiesRes.data || []}
      userId={user.id}
    />
  )
}
