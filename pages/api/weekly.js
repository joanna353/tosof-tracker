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

  if (!users?.length) return res.status(200).json({ ok: true, message: 'no users yet' })

  // Trigger times analysis
  const triggerTimes = checkins.filter(c => c.trigger_time && c.trigger_time !== 'no strong pull today')
  const timeCounts = {}
  triggerTimes.forEach(c => { timeCounts[c.trigger_time] = (timeCounts[c.trigger_time] || 0) + 1 })
  const topTimes = Object.entries(timeCounts).sort((a,b) => b[1]-a[1]).slice(0,3)

  // Trigger before analysis
  const triggerBefores = checkins.filter(c => c.trigger_before).map(c => c.trigger_before)

  // Mood trends
  const allMoods = checkins.filter(c => c.mood).map(c => c.mood)
  const avgMood = allMoods.length ? (allMoods.reduce((a,b) => a+b, 0) / allMoods.length).toFixed(1) : '—'
  const recentMoods = checkins.slice(0, 20).filter(c => c.mood).map(c => c.mood)
  const recentAvg = recentMoods.length ? (recentMoods.reduce((a,b) => a+b, 0) / recentMoods.length).toFixed(1) : '—'
  const moodTrend = parseFloat(recentAvg) > parseFloat(avgMood) ? '↑ improving' : '→ steady'

  // Intake themes
  const allIntakeAnswers = users.filter(u => u.intake_answers).flatMap(u => u.intake_answers)
  const allCheckinAnswers = checkins.filter(c => c.answers).flatMap(c => Object.values(c.answers || {}))

  // Common words analysis
  const stopWords = ['i', 'the', 'a', 'and', 'to', 'of', 'it', 'my', 'is', 'in', 'that', 'me', 'for', 'on', 'are', 'was', 'with', 'but', 'have', 'had', 'not', 'do', 'be', 'at', 'so', 'up', 'just', 'or', 'when', 'its', 'an', 'if', 'can', 'get', 'been', 'this', 'very', 'feel', 'like', 'really', 'about', 'more', 'out', 'what', 'know', 'think', 'from', 'how', 'all', 'would', 'there', 'they', 'we', 'you', 'your', 'their', 'which', 'one', 'also', 'into', 'has', 'him', 'his', 'her', 'she', 'he', 'as', 'by', 'at', 'been', 'some', 'no', 'could', 'time', 'still', 'than', 'now', 'will', 'much', 'did', 'too', 'who', 'am', 'day', 'days', 'want', 'need', 'go', 'see', 'make', 'even', 'back', 'our', 'us', 'them', 'then', 'these', 'any']
  
  const wordCount = {}
  const allText = [...allIntakeAnswers, ...allCheckinAnswers].join(' ').toLowerCase()
  allText.split(/\s+/).forEach(word => {
    const clean = word.replace(/[^a-z]/g, '')
    if (clean.length > 3 && !stopWords.includes(clean)) {
      wordCount[clean] = (wordCount[clean] || 0) + 1
    }
  })
  const topWords = Object.entries(wordCount).sort((a,b) => b[1]-a[1]).slice(0,15)

  const now = new Date()

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#fff;padding:2rem;border-radius:12px;">
      <div style="font-size:11px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:0.5rem;">The Other Side of Fear</div>
      <h2 style="font-weight:400;font-size:24px;color:#fff;margin-bottom:0.5rem;">weekly trends</h2>
      <div style="font-size:13px;color:#888;margin-bottom:2rem;">${now.toDateString()} · ${users.length} active users · ${checkins.length} total check-ins</div>

      <div style="background:#1a1a1a;border-radius:12px;padding:1.25rem;margin-bottom:1rem;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:0.75rem;">mood across all users</div>
        <div style="font-size:32px;font-family:serif;color:#c9a96e;">${avgMood}<span style="font-size:16px;color:#888;">/10</span></div>
        <div style="font-size:13px;color:#4ade80;margin-top:0.25rem;">${moodTrend}</div>
      </div>

      <div style="background:#1a1a1a;border-radius:12px;padding:1.25rem;margin-bottom:1rem;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:0.75rem;">top trigger times</div>
        ${topTimes.map(([time, count]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid #333;font-size:14px;color:#fff;">
            <span>${time}</span><span style="color:#888;">${count}x</span>
          </div>`).join('')}
        ${topTimes.length === 0 ? '<div style="color:#666;font-size:13px;">not enough data yet</div>' : ''}
      </div>

      <div style="background:#1a1a1a;border-radius:12px;padding:1.25rem;margin-bottom:1rem;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:0.75rem;">most common themes — content ideas 🎯</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${topWords.map(([word, count]) => `<span style="background:#222;color:#c9a96e;padding:4px 10px;border-radius:20px;font-size:13px;">${word} (${count})</span>`).join('')}
        </div>
        ${topWords.length === 0 ? '<div style="color:#666;font-size:13px;">not enough data yet</div>' : ''}
      </div>

      <div style="background:#1a1a1a;border-radius:12px;padding:1.25rem;margin-bottom:1rem;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#888;text-transform:uppercase;margin-bottom:0.75rem;">what people were doing before the urge hit</div>
        ${triggerBefores.slice(0,5).map(t => `<div style="color:#ccc;font-size:13px;line-height:1.6;padding:6px 0;border-bottom:0.5px solid #333;">"${t}"</div>`).join('')}
        ${triggerBefores.length === 0 ? '<div style="color:#666;font-size:13px;">not enough data yet</div>' : ''}
      </div>

      <div style="background:#0a1f12;border:0.5px solid #1a4a28;border-radius:12px;padding:1.25rem;">
        <div style="font-size:10px;letter-spacing:0.2em;color:#4ade80;text-transform:uppercase;margin-bottom:0.75rem;">content ideas from this week's data</div>
        ${topTimes[0] ? `<div style="color:#86efac;font-size:13px;line-height:1.7;margin-bottom:0.5rem;">→ most common trigger time is <strong>${topTimes[0][0]}</strong> — content idea: what to do at ${topTimes[0][0]} instead</div>` : ''}
        ${topWords[0] ? `<div style="color:#86efac;font-size:13px;line-height:1.7;margin-bottom:0.5rem;">→ the word "<strong>${topWords[0][0]}</strong>" keeps coming up — what does that tell you about what your audience needs right now?</div>` : ''}
        <div style="color:#86efac;font-size:13px;line-height:1.7;">→ avg mood is ${avgMood}/10 and ${moodTrend.includes('improving') ? 'improving — share a win story this week' : 'steady — might be time for a motivational push'}</div>
      </div>
    </div>`

  await resend.emails.send({
    from: 'tracker@theothersideoffear.co.uk',
    to: 'joanna@theothersideoffear.co.uk',
    subject: `📊 weekly trends — ${now.toDateString()}`,
    html
  })

  res.status(200).json({ ok: true })
}
