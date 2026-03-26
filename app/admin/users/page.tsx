import { createClient } from '@/lib/supabase/server'
import AdminUsersClient from '@/components/admin/AdminUsersClient'

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*, subscriptions(plan, status, current_period_end, amount), charities(name)')
    .order('created_at', { ascending: false })

  return <AdminUsersClient users={users || []} />
}
