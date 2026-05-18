import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: user } = await supabase
    .from('users').select('role').eq('id', session.user.id).single()

  redirect(`/${user?.role}/dashboard`)
}
