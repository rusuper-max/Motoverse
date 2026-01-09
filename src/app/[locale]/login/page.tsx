'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Car, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.auth.login
  const supabase = createClient()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      // Check if identifier is email or username
      let email = identifier
      const isEmail = identifier.includes('@')

      if (!isEmail) {
        // Look up email by username via API
        const lookupRes = await fetch(`/api/auth/lookup?username=${encodeURIComponent(identifier)}`)
        if (!lookupRes.ok) {
          setErrorMessage(t.errors.invalidCredentials)
          setStatus('error')
          return
        }
        const lookupData = await lookupRes.json()
        email = lookupData.email
      }

      // Sign in directly with client-side Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMessage(t.errors.invalidCredentials)
        setStatus('error')
        return
      }

      // Auth state change will be picked up by useAuth hook automatically via onAuthStateChange
      // Redirect to home
      router.push(`/${locale}`)
    } catch {
      setErrorMessage(t.errors.failed)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-600/20 via-zinc-950 to-zinc-950" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-3xl -z-10" />

      {/* Logo */}
      <Link href={`/${locale}`} className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <Car className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">MachineBio</span>
      </Link>

      {/* Form Card */}
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          <p className="mt-2 text-zinc-400">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username */}
          <div className="space-y-1">
            <label htmlFor="identifier" className="block text-sm font-medium text-zinc-300">
              Email or Username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="you@example.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {status === 'error' && errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? t.submitting : t.submitButton}
            {status !== 'loading' && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-zinc-400">
          {t.noAccount}{' '}
          <Link href={`/${locale}/register`} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            {t.registerLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
