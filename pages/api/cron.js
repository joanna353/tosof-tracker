import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end()
  }

  const { data: users } = await supabase.from('users').select('*')
  const { data: checkins } = await supabase.from('checkins').select('*')

  const now = new Date()

  // Build digest for Joanna
  let digestHtml = `<h2 style="font-family:sans-serif;">☀️ morning digest — ${now.toDateString()}</h2>`
  
  for (const user of users) {
    const userCheckins = checkins.filter(c => c.email === user.email)
    const lastCheckin = userCheckins[0]
    const hoursSince = lastCheckin ? (now - new Date(lastCheckin.created_at)) / (1000 * 60 * 60) : 999
    const flag = hoursSince > 48
    const avgMood = userCheckins.length ? (userCheckins.reduce((a,b) => a + (b.mood||0), 0) / userCheckins.length).toFixed(1) : '—'
    const soberDays = userCheckins.filter(c => c.sober).length

    digestHtml += `
      <div style="background:${flag ? '#2a0f0f' : '#1a1a1a'};border-left:3px solid ${flag ? '#f87171' : '#c9a96e'};padding:1rem;margin-bottom:0.75rem;border-radius:0 8px 8px 0;">
        <strong style="color:#fff;">${user.name}</strong> <span style="color:#888;font-size:13px;">${user.email}</span>
        <div style="color:#ccc;font-size:13px;margin-top:0.5rem;">
          streak: ${soberDays} days · avg mood: ${avgMood} · last checkin: ${lastCheckin ? new Date(lastCheckin.created_at).toDateString() : 'never'}
        </div>
        ${flag ? '<div style="color:#f87171;font-size:13px;margin-top:0.5rem;">⚠ hasn\'t checked in for 48hrs — reach out</div>' : ''}
      </div>`
  }

  // Send digest to Joanna
  await resend.emails.send({
    from: 'tracker@theothersideoffear.co.uk',
    to: 'joanna@theothersideoffear.co.uk',
    subject: `☀️ morning digest — ${users.length} active users`,
    html: digestHtml
  })

  // Send daily reminder to each user
  for (const user of users) {
    const userCheckins = checkins.filter(c => c.email === user.email)
    const currentDay = (userCheckins.length || 0) + 1
    if (currentDay > 14) continue

    await resend.emails.send({
      from: 'joanna@theothersideoffear.co.uk',
      to: user.email,
      subject: `day ${currentDay} — your check-in is waiting`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#fff;padding:2rem;border-radius:12px;">
          <div style="font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:1rem;">The Other Side of Fear</div>
          <h2 style="font-weight:400;font-size:24px;margin-bottom:1rem;">day ${currentDay}, ${user.name}.</h2>
          <p style="color:#ccc;line-height:1.7;margin-bottom:1.5rem;">your check-in is waiting. it takes 5 minutes and it's the most important thing you'll do today.</p>
          <a href="https://tosof-tracker.vercel.app" style="display:block;background:#c9a96e;color:#0a0a0a;text-decoration:none;padding:0.9rem;text-align:center;border-radius:8px;font-weight:500;">do today's check-in →</a>
          <p style="color:#555;font-size:12px;margin-top:1.5rem;text-align:center;">with love, Joanna x</p>
        </div>`
    })
  }

  res.status(200).json({ ok: true, users: users.length })
}
