import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  const { password } = req.query
  
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorised' })
  }

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error })

  const { data: checkins } = await supabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false })

  res.status(200).json({ users, checkins })
}
