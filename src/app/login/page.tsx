'use client'

import { useActionState } from 'react'
import { login } from './actions'
import { IconKey, IconMail, IconArrowRight, IconAlertCircle } from '@tabler/icons-react'

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

  return (
    <div className="min-h-screen relative flex flex-col items-center p-6 lg:p-12 overflow-hidden selection:bg-amber-500 selection:text-white font-sans">
      {/* Fullscreen Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url('/login-bg-v2.webp')` }}
      />
      
      {/* Light/Airy Gradient Overlay to match reference */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-slate-950/80" />

      {/* Header Pill */}
      <div className="relative z-20 w-full max-w-7xl mx-auto flex justify-center lg:justify-between items-center mb-12 lg:mb-20 animate-fade-in-down">
        <div className="hidden lg:block text-2xl font-black text-slate-900 drop-shadow-md tracking-tighter">
          Zeal<span className="text-amber-500">.</span>
        </div>
        <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xl border border-white/50 pl-3 pr-5 py-2 rounded-full shadow-lg">
          <div className="flex -space-x-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
          </div>
          <p className="text-xs font-bold text-slate-800 tracking-wide">
            Leader&apos;s Dashboard. Welcome back!
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center flex-1">
        
        {/* Big Text (Reference style) */}
        <div className="text-center mb-16 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h1 className="text-6xl md:text-7xl lg:text-[6rem] font-black tracking-tighter text-slate-900 mb-6 drop-shadow-2xl">
            Faith. Fellowship. Future.
          </h1>
          <p className="text-xl md:text-2xl text-slate-900 font-bold max-w-2xl mx-auto drop-shadow-md">
            Sistem manajemen data jemaat dan grup GKDI Tugu.
          </p>
        </div>

        {/* Login Form (Glassmorphism center) */}
        <div className="w-full max-w-md bg-white/40 backdrop-blur-3xl border border-white/60 p-10 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/50 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-transparent pointer-events-none opacity-50" />
          
          <div className="relative z-10">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sign in</h2>
            </div>

            <form action={formAction} className="space-y-6">
              {/* Error Message */}
              {state.error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-2xl text-sm flex gap-3 items-start backdrop-blur-md">
                  <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{state.error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IconMail className="h-5 w-5 text-slate-700 group-focus-within:text-slate-950 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="Email Address"
                    className="w-full pl-12 pr-4 py-4 bg-white/50 hover:bg-white/70 border border-white/60 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-white/50 focus:border-white focus:bg-white/90 transition-all placeholder:text-slate-600 font-bold shadow-inner"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IconKey className="h-5 w-5 text-slate-700 group-focus-within:text-slate-950 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Password"
                    className="w-full pl-12 pr-4 py-4 bg-white/50 hover:bg-white/70 border border-white/60 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-white/50 focus:border-white focus:bg-white/90 transition-all placeholder:text-slate-600 font-bold shadow-inner"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 bg-slate-950 hover:bg-black hover:scale-[1.02] text-white font-bold py-4 px-4 rounded-2xl text-sm transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Bottom Stats Pill (Reference Style) */}
      <div className="relative z-20 w-[95%] max-w-4xl mt-16 mb-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex flex-wrap items-center justify-between gap-6 bg-slate-900/50 backdrop-blur-3xl border border-white/20 px-6 sm:px-10 py-8 rounded-[2.5rem] shadow-2xl text-white">
          <div className="text-center flex-1">
            <p className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">100+</p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest">Jemaat Aktif</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block"></div>
          <div className="text-center flex-1">
            <p className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">24</p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest">Grup PDG</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block"></div>
          <div className="text-center flex-1">
            <p className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">1</p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest">Keluarga Besar</p>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block"></div>
          <div className="text-center flex-1">
            <p className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">{new Date().getFullYear()}</p>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest">Tahun Kasih</p>
          </div>
        </div>
      </div>
    </div>
  )
}
