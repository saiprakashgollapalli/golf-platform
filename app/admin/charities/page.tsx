import { createClient } from '@/lib/supabase/server'
import AdminCharitiesClient from '@/components/admin/AdminCharitiesClient'

export default async function AdminCharitiesPage() {
  const supabase = createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*, charity_events(*)')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  return <AdminCharitiesClient charities={charities || []} />
}
