jsimport { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, name, day, mood, sober, answers, triggerTime, triggerBefore } = req.body

  const { error } = await supabase
    .from('checkins')
    .insert([{ email, name, day, mood, sober, answers, trigger_time: triggerTime, trigger_before: triggerBefore, created_at: new Date() }])

  if (error) return res.status(500).json({ error })
  
  res.status(200).json({ success: true })
}
