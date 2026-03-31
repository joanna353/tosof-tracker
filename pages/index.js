export default function Home() {
  return (
    <div style={{margin: 0, padding: 0}}>
      <iframe 
        src="/tracker.html" 
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          display: 'block'
        }}
      />
    </div>
  )
}
