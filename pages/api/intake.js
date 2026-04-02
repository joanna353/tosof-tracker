import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email, name, answers, insights } = req.body

  // save to supabase
  const { error } = await supabase
    .from('users')
    .upsert([{ 
      email, 
      name, 
      intake_answers: answers, 
      intake_insights: insights,
      created_at: new Date(),
      current_day: 1
    }])

  if (error) return res.status(500).json({ error })

  // add to flodesk
  try {
    await fetch('https://api.flodesk.com/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
'Authorization': `Bearer ${process.env.FLODESK_API_KEY}`      },
      body: JSON.stringify({
        email,
        first_name: name,
        segments: ['14-day-tracker']
      })
    })
  } catch(e) {
    console.log('flodesk error', e)
  }
  
  res.status(200).json({ success: true })
}
