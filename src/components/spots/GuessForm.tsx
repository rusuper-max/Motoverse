'use client'

import { useState } from 'react'
import { HelpCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface GuessFormProps {
  spotId: string
  onGuessSubmitted: (guess: { make: string; model: string; year?: number }) => void
  disabled?: boolean
  translations: {
    makeLabel: string
    makePlaceholder: string
    modelLabel: string
    modelPlaceholder: string
    yearLabel: string
    yearPlaceholder: string
    guess: string
    guessing: string
  }
}

export default function GuessForm({
  spotId,
  onGuessSubmitted,
  disabled = false,
  translations: t,
}: GuessFormProps) {
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!make.trim() || !model.trim()) {
      setError('Please enter make and model')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/spots/${spotId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: make.trim(),
          model: model.trim(),
          year: year ? parseInt(year) : null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onGuessSubmitted(data.guess)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit guess')
      }
    } catch {
      setError('Failed to submit guess')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-orange-400 mb-2">
        <HelpCircle className="w-5 h-5" />
        <span className="font-semibold">What car is this?</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">{t.makeLabel}</label>
          <input
            type="text"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder={t.makePlaceholder}
            disabled={disabled || submitting}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">{t.modelLabel}</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t.modelPlaceholder}
            disabled={disabled || submitting}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">{t.yearLabel}</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder={t.yearPlaceholder}
          disabled={disabled || submitting}
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <Button
        type="submit"
        disabled={disabled || submitting || !make.trim() || !model.trim()}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.guessing}
          </>
        ) : (
          t.guess
        )}
      </Button>
    </form>
  )
}
