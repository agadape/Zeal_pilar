'use client'

import { useActionState, useState } from 'react'
import { login } from './actions'
import { IconKey, IconMail, IconArrowRight, IconAlertCircle, IconX } from '@tabler/icons-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await login(formData)
      if (result?.error) {
        return { error: result.error }
      }
      return { error: null }
    },
    { error: null }
  )

  const [showModal, setShowModal] = useState(false)

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-hidden selection:bg-indigo-500 selection:text-white font-sans text-slate-900">
      {/* Fullscreen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/login-bg-v2.webp')` }}
      />
      
      {/* Cinematic Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 1. Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center animate-fade-in-down">
        <div className="flex items-center gap-2">
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Zeal Logo" className="w-10 h-10 rounded-full object-cover shadow-lg border border-white/20" />
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all shadow-sm"
          >
            Sign in
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="hidden sm:block px-5 py-2.5 rounded-full bg-white hover:bg-slate-200 text-slate-900 font-semibold text-sm transition-all shadow-md"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* 2. Main Hero Content (Centered) */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center mt-[-4rem]">
        
        {/* Floating Avatars Pill removed for clean look */}

        {/* Big Text */}
        <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] font-black tracking-[-0.02em] text-white mb-6 animate-fade-in-up drop-shadow-2xl" style={{ animationDelay: '200ms', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
          Love God, Love People,<br className="hidden md:block"/> Love Life.
        </h1>
        
        <p className="text-lg sm:text-xl text-white/90 font-medium max-w-2xl mx-auto mb-10 animate-fade-in-up drop-shadow-lg" style={{ animationDelay: '300ms' }}>
          Sistem manajemen eksklusif GKDI Tugu Youth & Campus.
        </p>

        {/* Center CTA Button */}
        <button 
          onClick={() => setShowModal(true)}
          className="px-8 py-4 rounded-full bg-white hover:bg-slate-200 hover:scale-105 active:scale-95 text-slate-900 font-bold text-lg transition-all shadow-xl animate-fade-in-up" style={{ animationDelay: '400ms' }}
        >
          Sign In to Dashboard
        </button>
      </main>

      {/* 3. Bottom Stats Pill removed for clean look */}

      {/* Login Modal Overlay */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl animate-slide-in-up">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 p-2 rounded-full"
            >
              <IconX className="w-5 h-5" />
            </button>
            
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.jpg" alt="Zeal Logo" className="w-16 h-16 rounded-full object-cover shadow-lg border-4 border-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center">Welcome back</h2>
              <p className="text-slate-500 mt-2 font-medium text-center">Enter your credentials to access the dashboard.</p>
            </div>

            <form action={formAction} className="space-y-5">
              {state.error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex gap-3 items-start shadow-sm">
                  <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{state.error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IconMail className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@zeal.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IconKey className="h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 bg-black hover:bg-slate-800 active:scale-95 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <IconArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
