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
    <div className="min-h-screen flex bg-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Glassmorphism Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 items-center justify-center p-12">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/10 rounded-full mix-blend-screen filter blur-[120px]" />
        
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />

        {/* Glass Card */}
        <div className="relative z-10 w-full max-w-xl backdrop-blur-2xl bg-white/5 border border-white/10 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-start ring-1 ring-white/10 overflow-hidden">
          {/* Inner reflection */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
          
          <div className="relative z-20">
            <div className="mb-8">
              <span className="px-4 py-1.5 bg-white/10 border border-white/20 text-white font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-full backdrop-blur-md shadow-sm">
                Zeal Jogja
              </span>
            </div>
            
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 mb-6 leading-[1.1]">
              GKDI Tugu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Youth & Campus</span>
            </h1>
            
            <p className="text-slate-300/80 text-lg max-w-md font-medium leading-relaxed mb-10">
              Sistem manajemen data jemaat, grup PDG, dan laporan pelayanan. Terpusat, aman, dan mudah digunakan.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center shrink-0">
                    <IconAlertCircle className="w-4 h-4 text-slate-500 opacity-0" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Trusted by Leaders
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white rounded-l-[3rem] lg:-ml-8 relative z-20 shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex lg:hidden mb-6 items-center justify-center w-12 h-12 bg-indigo-50 rounded-xl">
              <IconKey className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Login Dashboard</h2>
            <p className="text-slate-500 mt-2">Masuk untuk mengelola data Tugu</p>
          </div>

          <form action={formAction} className="space-y-5">
            {/* Error Message */}
            {state.error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex gap-3 items-start shadow-sm">
                <IconAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{state.error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-600">
                  <IconMail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <IconKey className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-8 bg-slate-900 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-slate-900 disabled:hover:shadow-none"
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
          
          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} GKDI Tugu. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
