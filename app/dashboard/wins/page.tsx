import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WinningsView from '@/components/dashboard/WinningsView'

export default async function WinsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <WinningsView winners={winners || []} userId={user.id} />
}
