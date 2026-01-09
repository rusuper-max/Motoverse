'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Car, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'

export default function RegisterPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.auth.register

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match") // TODO: Add translation key for this
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, name: name || undefined }),
      })

      const data = await res.json()

      if (res.ok) {
        // Registration successful, show check email message
        setStatus('success')
        // router.push(`/${locale}`) // Don't redirect immediately
      } else {
        // Handle specific errors
        switch (data.error) {
          case 'email_taken':
            setErrorMessage(t.errors.emailTaken)
            break
          case 'username_taken':
            setErrorMessage(t.errors.usernameTaken)
            break
          case 'invalid_email':
            setErrorMessage(t.errors.invalidEmail)
            break
          case 'invalid_username':
            setErrorMessage(t.errors.invalidUsername)
            break
          case 'weak_password':
            setErrorMessage(t.errors.weakPassword)
            break
          case 'missing_fields':
            setErrorMessage(t.errors.missingFields)
            break
          default:
            setErrorMessage(t.errors.failed)
        }
        setStatus('error')
      }
    } catch {
      setErrorMessage(t.errors.failed)
      setStatus('error')
    }
  }

  const handleResend = async () => {
    setResendStatus('loading')
    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setResendStatus('success')
      } else {
        setResendStatus('error')
      }
    } catch {
      setResendStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-orange-600/20 via-zinc-950 to-zinc-950" />
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 text-green-500">✉️</div>
          </div>
          <h1 className="text-3xl font-bold text-white">Check your email</h1>
          <p className="text-zinc-400">
            We've sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            Please check your inbox (and spam folder) to verify your account.
          </p>

          <div className="pt-4 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={resendStatus === 'loading' || resendStatus === 'success'}
            >
              {resendStatus === 'loading' ? 'Sending...' :
                resendStatus === 'success' ? 'Email Sent!' :
                  resendStatus === 'error' ? 'Failed to send' :
                    'Resend Email'}
            </Button>

            <Link href={`/${locale}/login`}>
              <Button size="lg" className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              {t.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
              {t.usernameLabel}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder={t.usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <p className="text-xs text-zinc-500">{t.usernameHint}</p>
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
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Display Name (optional) */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
              {t.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-white placeholder-zinc-500 focus:border-orange-500 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
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

        {/* Sign in link */}
        <p className="mt-6 text-center text-zinc-400">
          {t.haveAccount}{' '}
          <Link href={`/${locale}/login`} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            {t.signInLink}
          </Link>
        </p>
      </div>
    </div>
  )
}
