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
    <div className="min-h-screen flex bg-white selection:bg-indigo-500 selection:text-white">
      {/* Left Column: Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: `url('/login-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        
        <div className="relative z-10 w-full h-full flex flex-col justify-end p-12 lg:p-16 text-white">
          <div className="mb-4">
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest rounded-full backdrop-blur-sm">
              Zeal Jogja
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            GKDI Tugu<br />Youth & Campus
          </h1>
          <p className="text-slate-300 text-lg max-w-md font-medium leading-relaxed">
            Sistem manajemen data jemaat dan grup PDG. Silakan masuk untuk mengakses *dashboard*.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
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
