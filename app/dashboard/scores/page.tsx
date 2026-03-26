import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScoreManager from '@/components/dashboard/ScoreManager'

export default async function ScoresPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('played_at', { ascending: false })

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return <ScoreManager initialScores={scores || []} userId={user.id} hasSubscription={!!subscription} />
}
