import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  return (
    <div style={{margin:0,padding:0,height:'100vh'}}>
      <iframe 
        src="/tracker.html" 
        style={{width:'100%',height:'100vh',border:'none',display:'block'}}
        allow="same-origin"
      />
    </div>
  )
}
