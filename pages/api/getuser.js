import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email } = req.body

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) return res.status(404).json({ error: 'user not found' })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .eq('email', email)
    .order('day', { ascending: true })

  res.status(200).json({ user, checkins })
}
