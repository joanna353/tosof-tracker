import { useState, useEffect } from 'react'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [data, setData] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)
    const res = await fetch(`/api/admin?password=${password}`)
    if (res.ok) {
      const json = await res.json()
      setData(json)
      setAuthed(true)
    } else {
      alert('wrong password')
    }
    setLoading(false)
  }

  if (!authed) return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#1a1a1a',padding:'2rem',borderRadius:12,width:320}}>
        <div style={{color:'#888',fontSize:11,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'1rem'}}>The Other Side of Fear</div>
        <div style={{color:'#fff',fontSize:20,fontWeight:500,marginBottom:'1.5rem'}}>coach dashboard</div>
        <input 
          type="password" 
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          style={{width:'100%',padding:'0.75rem',background:'#222',border:'0.5px solid #444',borderRadius:8,color:'#fff',fontSize:14,marginBottom:'0.75rem',boxSizing:'border-box'}}
        />
        <button onClick={login} style={{width:'100%',padding:'0.85rem',background:'#c9a96e',color:'#0a0a0a',border:'none',borderRadius:8,fontSize:14,fontWeight:500,cursor:'pointer'}}>
          {loading ? 'loading...' : 'log in →'}
        </button>
      </div>
    </div>
  )

  const users = data?.users || []
  const checkins = data?.checkins || []

  function getUserCheckins(email) {
    return checkins.filter(c => c.email === email)
  }

  function getStreak(email) {
    return getUserCheckins(email).filter(c => c.sober).length
  }

  function getLastCheckin(email) {
    const uc = getUserCheckins(email)
    if (!uc.length) return 'never'
    const last = new Date(uc[0].created_at)
    const diff = Math.floor((new Date() - last) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'today'
    if (diff === 1) return 'yesterday'
    return `${diff} days ago`
  }

  function getAvgMood(email) {
    const uc = getUserCheckins(email)
    if (!uc.length) return '—'
    const avg = uc.reduce((a,b) => a + (b.mood || 0), 0) / uc.length
    return avg.toFixed(1)
  }

  function isFlag(email) {
    const uc = getUserCheckins(email)
    if (!uc.length) return true
    const last = new Date(uc[0].created_at)
    const diff = (new Date() - last) / (1000 * 60 * 60)
    return diff > 48
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',fontFamily:'sans-serif',padding:'1.5rem'}}>
      <div style={{maxWidth:800,margin:'0 auto'}}>
        <div style={{color:'#888',fontSize:11,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:'0.5rem'}}>The Other Side of Fear</div>
        <div style={{color:'#fff',fontSize:22,fontWeight:500,marginBottom:'1.5rem'}}>coach dashboard</div>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'1.5rem'}}>
          <div style={{background:'#1a1a1a',borderRadius:8,padding:'1rem'}}>
            <div style={{color:'#666',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.25rem'}}>total users</div>
            <div style={{color:'#c9a96e',fontSize:28,fontFamily:'serif'}}>{users.length}</div>
          </div>
          <div style={{background:'#1a1a1a',borderRadius:8,padding:'1rem'}}>
            <div style={{color:'#666',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.25rem'}}>total checkins</div>
            <div style={{color:'#c9a96e',fontSize:28,fontFamily:'serif'}}>{checkins.length}</div>
          </div>
          <div style={{background:'#1a1a1a',borderRadius:8,padding:'1rem'}}>
            <div style={{color:'#666',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.25rem'}}>need attention</div>
            <div style={{color:'#f87171',fontSize:28,fontFamily:'serif'}}>{users.filter(u => isFlag(u.email)).length}</div>
          </div>
        </div>

        {selected ? (
          <div>
            <button onClick={() => setSelected(null)} style={{background:'transparent',border:'0.5px solid #444',color:'#888',padding:'0.5rem 1rem',borderRadius:8,cursor:'pointer',marginBottom:'1rem',fontSize:13}}>← back to all users</button>
            <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'0.75rem'}}>
              <div style={{color:'#fff',fontSize:18,fontWeight:500,marginBottom:'0.25rem'}}>{selected.name}</div>
              <div style={{color:'#888',fontSize:13,marginBottom:'1rem'}}>{selected.email}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                <div style={{background:'#222',borderRadius:8,padding:'0.75rem'}}>
                  <div style={{color:'#666',fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em'}}>sober days</div>
                  <div style={{color:'#4ade80',fontSize:24,fontFamily:'serif'}}>{getStreak(selected.email)}</div>
                </div>
                <div style={{background:'#222',borderRadius:8,padding:'0.75rem'}}>
                  <div style={{color:'#666',fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em'}}>avg mood</div>
                  <div style={{color:'#c9a96e',fontSize:24,fontFamily:'serif'}}>{getAvgMood(selected.email)}</div>
                </div>
                <div style={{background:'#222',borderRadius:8,padding:'0.75rem'}}>
                  <div style={{color:'#666',fontSize:10,textTransform:'uppercase',letterSpacing:'0.15em'}}>last checkin</div>
                  <div style={{color:'#fff',fontSize:16,marginTop:4}}>{getLastCheckin(selected.email)}</div>
                </div>
              </div>
            </div>

            {selected.intake_answers && (
              <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem',marginBottom:'0.75rem'}}>
                <div style={{color:'#888',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'1rem'}}>intake answers</div>
                {selected.intake_answers.map((a, i) => (
                  <div key={i} style={{marginBottom:'0.75rem',paddingBottom:'0.75rem',borderBottom:'0.5px solid #333'}}>
                    <div style={{color:'#666',fontSize:12,marginBottom:'0.25rem'}}>Q{i+1}</div>
                    <div style={{color:'#ccc',fontSize:14,lineHeight:1.6}}>{a}</div>
                  </div>
                ))}
              </div>
            )}

            {selected.intake_insights && selected.intake_insights.length > 0 && (
              <div style={{background:'#1a1510',border:'0.5px solid #c9a96e30',borderLeft:'2px solid #c9a96e',borderRadius:'0 12px 12px 0',padding:'1.25rem',marginBottom:'0.75rem'}}>
                <div style={{color:'#c9a96e',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'0.75rem'}}>Joanna's insights from intake</div>
                {selected.intake_insights.map((ins, i) => (
                  <div key={i} style={{color:'#e8d5b0',fontSize:14,lineHeight:1.65,marginBottom:'0.5rem'}}>{ins.insight}</div>
                ))}
              </div>
            )}

            <div style={{background:'#1a1a1a',borderRadius:12,padding:'1.5rem'}}>
              <div style={{color:'#888',fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:'1rem'}}>daily checkins</div>
              {getUserCheckins(selected.email).map((c, i) => (
                <div key={i} style={{marginBottom:'0.75rem',paddingBottom:'0.75rem',borderBottom:'0.5px solid #333'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
                    <div style={{color:'#fff',fontSize:13,fontWeight:500}}>day {c.day}</div>
                    <div style={{display:'flex',gap:'0.75rem'}}>
                      <span style={{color:'#c9a96e',fontSize:12}}>mood {c.mood}/10</span>
                      <span style={{color: c.sober ? '#4ade80' : '#f87171',fontSize:12}}>{c.sober ? 'sober' : 'not sober'}</span>
                    </div>
                  </div>
                  {c.trigger_time && <div style={{color:'#666',fontSize:12,marginBottom:'0.25rem'}}>trigger time: {c.trigger_time}</div>}
                  {c.trigger_before && <div style={{color:'#888',fontSize:13,lineHeight:1.6}}>{c.trigger_before}</div>}
                  {c.answers && Object.values(c.answers).map((a, j) => (
                    <div key={j} style={{color:'#999',fontSize:13,lineHeight:1.6,marginTop:'0.25rem'}}>{a}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {users.map((u, i) => (
              <div key={i} onClick={() => setSelected(u)} style={{background:'#1a1a1a',borderRadius:12,padding:'1.1rem 1.25rem',marginBottom:'0.75rem',cursor:'pointer',borderLeft:`3px solid ${isFlag(u.email) ? '#f87171' : '#c9a96e'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{color:'#fff',fontWeight:500,marginBottom:'0.2rem'}}>{u.name}</div>
                    <div style={{color:'#666',fontSize:13}}>{u.email}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{color:'#c9a96e',fontSize:22,fontFamily:'serif'}}>{getStreak(u.email)}d</div>
                    <div style={{color:'#666',fontSize:11}}>sober streak</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'1.5rem',marginTop:'0.5rem',fontSize:12,color:'#666'}}>
                  <span>mood avg {getAvgMood(u.email)}</span>
                  <span>last checkin {getLastCheckin(u.email)}</span>
                  <span>day {u.current_day || 1}</span>
                </div>
                {isFlag(u.email) && <div style={{marginTop:'0.5rem',fontSize:12,color:'#f87171',background:'#f8717115',padding:'0.25rem 0.6rem',borderRadius:4,display:'inline-block'}}>⚠ hasn't checked in — reach out</div>}
              </div>
            ))}
            {users.length === 0 && <div style={{color:'#666',fontSize:14,textAlign:'center',padding:'2rem'}}>no users yet — share your tracker link to get started</div>}
          </div>
        )}
      </div>
    </div>
  )
}
