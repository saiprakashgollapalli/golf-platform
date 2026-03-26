import { createClient } from '@/lib/supabase/server'
import AdminWinnersClient from '@/components/admin/AdminWinnersClient'

export default async function AdminWinnersPage() {
  const supabase = createClient()
  const { data: winners } = await supabase
    .from('winners')
    .select('*, profiles(full_name, email), draws(month, year, winning_numbers)')
    .order('created_at', { ascending: false })

  return <AdminWinnersClient winners={winners || []} />
}
