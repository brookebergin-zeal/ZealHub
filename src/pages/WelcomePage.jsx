import { useState, useEffect } from 'react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const notConfigured = !import.meta.env.VITE_SUPABASE_URL ||
                       import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url_here'

const SLOGANS = ['love your future', 'engineer success', 'for yourself, not by yourself', 'lead with kindness']

export default function WelcomePage({ onLogin }) {
  const [state, setState] = useState({ current: 0, prev: null })

  useEffect(() => {
    let timeoutId = null
    const id = setInterval(() => {
      setState(s => ({ current: (s.current + 1) % SLOGANS.length, prev: s.current }))
      timeoutId = setTimeout(() => {
        setState(s => ({ ...s, prev: null }))
      }, 500)
    }, 3500)
    return () => {
      clearInterval(id)
      clearTimeout(timeoutId)
    }
  }, [])


  return (
    <>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-brand-50/40 to-brand-100/60 px-6">
      <video className='videoTag' autoPlay loop muted style={{ position: 'absolute', opacity: 0.5, width: '100%', height: '100vh', objectFit: 'cover', zIndex: -1 }}>
        <source src={"/boat.mp4"} type='video/mp4' />
      </video>
      {/* Logo + tagline */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-brand-700">
          Zeal <span className="text-brand-600">Hub</span>
        </h1>
        <div className="relative mt-3" style={{ height: '1.25rem' }}>
          {state.prev !== null && (
            <p key={`out-${state.prev}`} className="slogan-exit absolute inset-x-0 text-center text-sm tracking-[0.3em] uppercase text-brand-300">
              {SLOGANS[state.prev]}
            </p>
          )}
          <p key={`in-${state.current}`} className="slogan-enter absolute inset-x-0 text-center text-sm tracking-[0.3em] uppercase text-brand-300">
            {SLOGANS[state.current]}
          </p>
        </div>
      </div>

      {/* Sign-in */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onLogin}
          disabled={notConfigured}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-xl
                     shadow-sm hover:shadow-md hover:border-gray-300 transition-all
                     text-sm font-medium text-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          Log in with Google
        </button>

        {notConfigured && (
          <p className="text-xs text-amber-500 max-w-xs text-center leading-relaxed">
            Add{' '}
            <code className="bg-amber-50 border border-amber-200 px-1 rounded">VITE_SUPABASE_URL</code>
            {' '}and{' '}
            <code className="bg-amber-50 border border-amber-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>
            {' '}to{' '}
            <code className="bg-amber-50 border border-amber-200 px-1 rounded">.env.local</code>
            {' '}to enable login.
          </p>
        )}
      </div>
      </div>
      <div className="min-h-[50vh] flex flex-col md:flex-row items-center justify-center gap-8 px-6 py-12">
        <div className="w-72 rounded-xl overflow-hidden shadow-sm bg-white border border-gray-200
                     hover:shadow-md hover:border-gray-300 transition-all
                     text-sm">
          <img className="w-full h-44 object-cover" src="/sticky-notes.jpg" alt="Sticky notes"/>
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2 text-center">Organize your tasks</div>
          </div>
        </div>
        <div className="w-72 rounded-xl overflow-hidden shadow-sm bg-white border border-gray-200
                            hover:shadow-md hover:border-gray-300 transition-all
                            text-sm">
          <img className="w-full h-44 object-cover object-top" src="/calendar.jpg" alt="A laptop with a calendar"/>
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2 text-center">View your calendar</div>
          </div>
        </div>
        <div className="w-72 rounded-xl overflow-hidden shadow-sm bg-white border border-gray-200
                            hover:shadow-md hover:border-gray-300 transition-all
                            text-sm">
          <img className="w-full h-44 object-cover" src="/laptop.jpg" alt="Hands working on laptop"/>
          <div className="px-6 py-4">
            <div className="font-bold text-xl mb-2 text-center">Achieve your goals</div>
          </div>
        </div>
      </div>

    <div className="min-h-[20vh] bg-brand-400 px-6">
    </div>
    
  </>
  )
}
