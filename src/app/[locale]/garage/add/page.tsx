'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Car, Check, Search, Loader2, Database, Globe } from 'lucide-react'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

// Types for our local database
interface LocalMake {
  id: string
  name: string
  slug: string
  logo: string | null
}

interface LocalModel {
  id: string
  name: string
  slug: string
}

interface LocalGeneration {
  id: string
  name: string
  displayName: string | null
  startYear: number
  endYear: number | null
  _count?: { engines: number }
}

interface LocalEngine {
  id: string
  name: string
  horsepower: number | null
  torque: number | null
  displacement: string | null
  fuelType: string
  transmission: string | null
  drivetrain: string | null
}

// Types for NHTSA API
interface NHTSAMake {
  name: string
  id: number
}

interface NHTSAModel {
  name: string
  id: number
}

interface VINData {
  make: string | null
  model: string | null
  year: number | null
  bodyType: string | null
  trim: string | null
  horsepower: number | null
  displacement: string | null
  cylinders: number | null
  fuelType: string | null
  transmission: string | null
  drivetrain: string | null
}

type Step = 'start' | 'year' | 'make' | 'model' | 'generation' | 'engine' | 'details'
type DataSource = 'local' | 'nhtsa'

export default function AddCarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.garage

  const { authenticated, loading: authLoading } = useAuth()

  // Step state
  const [step, setStep] = useState<Step>('start')
  const [dataSource, setDataSource] = useState<DataSource>('local')

  // VIN state
  const [vin, setVin] = useState('')
  const [vinLoading, setVinLoading] = useState(false)
  const [vinError, setVinError] = useState('')
  const [vinData, setVinData] = useState<VINData | null>(null)

  // Selection state
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMake, setSelectedMake] = useState<{ name: string; id: string | number } | null>(null)
  const [selectedModel, setSelectedModel] = useState<{ name: string; id: string | number } | null>(null)
  const [selectedGeneration, setSelectedGeneration] = useState<LocalGeneration | null>(null)
  const [selectedEngine, setSelectedEngine] = useState<LocalEngine | null>(null)

  // Local database state
  const [localMakes, setLocalMakes] = useState<LocalMake[]>([])
  const [localModels, setLocalModels] = useState<LocalModel[]>([])
  const [localGenerations, setLocalGenerations] = useState<LocalGeneration[]>([])
  const [localEngines, setLocalEngines] = useState<LocalEngine[]>([])

  // NHTSA state (fallback)
  const [nhtsaMakes, setNhtsaMakes] = useState<NHTSAMake[]>([])
  const [nhtsaModels, setNhtsaModels] = useState<NHTSAModel[]>([])

  // Loading state
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingGenerations, setLoadingGenerations] = useState(false)
  const [loadingEngines, setLoadingEngines] = useState(false)

  // Search state
  const [makeSearch, setMakeSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')

  // Form state
  const [nickname, setNickname] = useState('')
  const [engine, setEngine] = useState('')
  const [transmission, setTransmission] = useState('')
  const [drivetrain, setDrivetrain] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [horsepower, setHorsepower] = useState('')
  const [torque, setTorque] = useState('')
  const [color, setColor] = useState('')
  const [mileage, setMileage] = useState('')
  const [images, setImages] = useState<string[]>([])

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!authenticated) {
      router.push(`/${locale}/login`)
    }
  }, [authenticated, authLoading, locale, router])

  // Fetch local makes on mount
  useEffect(() => {
    fetchLocalMakes()
  }, [])

  // Auto-fill from URL params
  const searchParams = useSearchParams()

  useEffect(() => {
    if (loadingMakes || localMakes.length === 0) return

    const makeParam = searchParams.get('make')
    if (makeParam && !selectedMake) {
      const match = localMakes.find(m => m.name.toLowerCase() === makeParam.toLowerCase())
      if (match) {
        handleSelectMake({ name: match.name, id: match.id }, 'local')
      }
    }
  }, [loadingMakes, localMakes, searchParams, selectedMake])

  useEffect(() => {
    if (loadingModels || localModels.length === 0) return

    const modelParam = searchParams.get('model')
    if (modelParam && selectedMake && !selectedModel) {
      const match = localModels.find(m => m.name.toLowerCase() === modelParam.toLowerCase())
      if (match) {
        handleSelectModel({ name: match.name, id: match.id })
      }
    }
  }, [loadingModels, localModels, searchParams, selectedMake, selectedModel])

  useEffect(() => {
    if (loadingGenerations || localGenerations.length === 0) return

    const genParam = searchParams.get('generation')
    if (genParam && selectedModel && !selectedGeneration) {
      const match = localGenerations.find(g => g.name === genParam)
      if (match) {
        handleSelectGeneration(match)
      }
    }
  }, [loadingGenerations, localGenerations, searchParams, selectedModel, selectedGeneration])

  useEffect(() => {
    if (loadingEngines || localEngines.length === 0) return

    const engineParam = searchParams.get('engine')
    if (engineParam && selectedGeneration && !selectedEngine) {
      const match = localEngines.find(e => e.name === engineParam)
      if (match) {
        handleSelectEngine(match)
      }
    }
  }, [loadingEngines, localEngines, searchParams, selectedGeneration, selectedEngine])

  // Fetch local makes from our database
  const fetchLocalMakes = async () => {
    try {
      const res = await fetch('/api/makes')
      if (res.ok) {
        const data = await res.json()
        setLocalMakes(data.makes || [])
      }
    } catch {
      // ignore
    }
  }

  // Fetch local models for a make
  const fetchLocalModels = async (makeId: string) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/makes/${makeId}/models`)
      if (res.ok) {
        const data = await res.json()
        setLocalModels(data.models || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingModels(false)
    }
  }

  // Fetch generations for a model
  const fetchLocalGenerations = async (modelId: string) => {
    setLoadingGenerations(true)
    try {
      const res = await fetch(`/api/models/${modelId}/generations`)
      if (res.ok) {
        const data = await res.json()
        setLocalGenerations(data.generations || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingGenerations(false)
    }
  }

  // Fetch engines for a generation
  const fetchLocalEngines = async (generationId: string) => {
    setLoadingEngines(true)
    try {
      const res = await fetch(`/api/generations/${generationId}/engines`)
      if (res.ok) {
        const data = await res.json()
        setLocalEngines(data.engines || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingEngines(false)
    }
  }

  // Fetch NHTSA makes (fallback)
  const fetchNHTSAMakes = async () => {
    setLoadingMakes(true)
    try {
      const res = await fetch('/api/nhtsa/makes')
      if (res.ok) {
        const data = await res.json()
        setNhtsaMakes(data.makes || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingMakes(false)
    }
  }

  // Fetch NHTSA models for make+year (fallback)
  const fetchNHTSAModels = async (makeName: string, year: number) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/nhtsa/models?make=${encodeURIComponent(makeName)}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setNhtsaModels(data.models || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingModels(false)
    }
  }

  // Decode VIN
  const handleVinDecode = async () => {
    if (!vin || vin.length !== 17) {
      setVinError('VIN must be exactly 17 characters')
      return
    }

    setVinLoading(true)
    setVinError('')

    try {
      const res = await fetch(`/api/nhtsa/vin?vin=${encodeURIComponent(vin)}`)
      const data = await res.json()

      if (!res.ok || !data.valid) {
        setVinError(data.error || 'Invalid VIN')
        return
      }

      setVinData(data.decoded)

      // Auto-fill form fields
      if (data.decoded.year) setSelectedYear(data.decoded.year)
      if (data.decoded.make) setSelectedMake({ name: data.decoded.make, id: 0 })
      if (data.decoded.model) setSelectedModel({ name: data.decoded.model, id: 0 })
      if (data.decoded.horsepower) setHorsepower(String(data.decoded.horsepower))
      if (data.decoded.displacement) setEngine(data.decoded.displacement)
      if (data.decoded.fuelType) setFuelType(mapNHTSAFuelType(data.decoded.fuelType))
      if (data.decoded.transmission) setTransmission(mapNHTSATransmission(data.decoded.transmission))
      if (data.decoded.drivetrain) setDrivetrain(mapNHTSADrivetrain(data.decoded.drivetrain))

      // Skip to details
      setStep('details')
    } catch {
      setVinError('Failed to decode VIN')
    } finally {
      setVinLoading(false)
    }
  }

  // Map NHTSA values to our form values
  const mapNHTSAFuelType = (nhtsa: string): string => {
    const lower = nhtsa.toLowerCase()
    if (lower.includes('gasoline') || lower.includes('petrol')) return 'petrol'
    if (lower.includes('diesel')) return 'diesel'
    if (lower.includes('electric')) return 'electric'
    if (lower.includes('hybrid')) return 'hybrid'
    if (lower.includes('lpg') || lower.includes('propane')) return 'lpg'
    return ''
  }

  const mapNHTSATransmission = (nhtsa: string): string => {
    const lower = nhtsa.toLowerCase()
    if (lower.includes('manual')) return 'manual'
    if (lower.includes('automatic')) return 'automatic'
    if (lower.includes('cvt')) return 'cvt'
    if (lower.includes('dual') || lower.includes('dct') || lower.includes('dsg')) return 'dct'
    return ''
  }

  const mapNHTSADrivetrain = (nhtsa: string): string => {
    const lower = nhtsa.toLowerCase()
    if (lower.includes('front') || lower === 'fwd') return 'fwd'
    if (lower.includes('rear') || lower === 'rwd') return 'rwd'
    if (lower.includes('all') || lower === 'awd') return 'awd'
    if (lower.includes('4x4') || lower.includes('4wd') || lower === '4wd') return '4wd'
    return ''
  }

  const handleSelectYear = (year: number) => {
    setSelectedYear(year)
    setSelectedMake(null)
    setSelectedModel(null)
    setSelectedGeneration(null)
    setSelectedEngine(null)
    setLocalModels([])
    setLocalGenerations([])
    setLocalEngines([])
    setNhtsaModels([])
    setStep('make')
  }

  const handleSelectMake = (make: { name: string; id: string | number }, source: DataSource) => {
    setSelectedMake(make)
    setSelectedModel(null)
    setSelectedGeneration(null)
    setSelectedEngine(null)
    setLocalGenerations([])
    setLocalEngines([])
    setDataSource(source)

    if (source === 'local' && typeof make.id === 'string') {
      fetchLocalModels(make.id)
    } else if (source === 'nhtsa' && selectedYear) {
      fetchNHTSAModels(make.name, selectedYear)
    }
    setStep('model')
  }

  const handleSelectModel = (model: { name: string; id: string | number }) => {
    setSelectedModel(model)
    setSelectedGeneration(null)
    setSelectedEngine(null)
    setLocalEngines([])

    // If using local database and model has a string ID, check for generations
    if (dataSource === 'local' && typeof model.id === 'string') {
      fetchLocalGenerations(model.id)
      setStep('generation')
    } else {
      // NHTSA flow goes straight to details
      setStep('details')
    }
  }

  const handleSelectGeneration = (generation: LocalGeneration) => {
    setSelectedGeneration(generation)
    setSelectedEngine(null)
    fetchLocalEngines(generation.id)
    setStep('engine')
  }

  const handleSelectEngine = (engine: LocalEngine | null) => {
    setSelectedEngine(engine)

    // Auto-fill form fields from engine
    if (engine) {
      if (engine.horsepower) setHorsepower(String(engine.horsepower))
      if (engine.torque) setTorque(String(engine.torque))
      if (engine.displacement) setEngine(engine.displacement)
      if (engine.transmission) setTransmission(mapTransmission(engine.transmission))
      if (engine.drivetrain) setDrivetrain(mapDrivetrain(engine.drivetrain))
      if (engine.fuelType) setFuelType(mapFuelType(engine.fuelType))
    }

    setStep('details')
  }

  const handleSkipGeneration = () => {
    setSelectedGeneration(null)
    setSelectedEngine(null)
    setStep('details')
  }

  const handleSkipEngine = () => {
    setSelectedEngine(null)
    setStep('details')
  }

  // Map database values to form values
  const mapTransmission = (val: string): string => {
    const lower = val.toLowerCase()
    if (lower.includes('manual') || lower.includes('mt')) return 'manual'
    if (lower.includes('automatic') || lower.includes('at')) return 'automatic'
    if (lower.includes('cvt')) return 'cvt'
    if (lower.includes('dct') || lower.includes('dsg') || lower.includes('dual')) return 'dct'
    return ''
  }

  const mapDrivetrain = (val: string): string => {
    const lower = val.toLowerCase()
    if (lower.includes('front') || lower === 'fwd' || lower === 'ff') return 'fwd'
    if (lower.includes('rear') || lower === 'rwd' || lower === 'fr') return 'rwd'
    if (lower.includes('all') || lower === 'awd' || lower.includes('quattro')) return 'awd'
    if (lower.includes('4x4') || lower.includes('4wd')) return '4wd'
    return ''
  }

  const mapFuelType = (val: string): string => {
    const lower = val.toLowerCase()
    if (lower.includes('petrol') || lower.includes('gasoline')) return 'petrol'
    if (lower.includes('diesel')) return 'diesel'
    if (lower.includes('electric')) return 'electric'
    if (lower.includes('hybrid')) return 'hybrid'
    if (lower.includes('lpg')) return 'lpg'
    return ''
  }

  const handleManualEntry = () => {
    setStep('year')
  }

  const switchToNHTSA = () => {
    setDataSource('nhtsa')
    if (nhtsaMakes.length === 0) {
      fetchNHTSAMakes()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedYear || !selectedMake || !selectedModel) {
      setError('Please select year, make, and model')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          year: selectedYear,
          make: selectedMake.name,
          model: selectedModel.name,
          // Include generation and engine if selected from local database
          generationId: selectedGeneration?.id || undefined,
          engineConfigId: selectedEngine?.id || undefined,
          nickname: nickname || undefined,
          engine: engine || undefined,
          transmission: transmission || undefined,
          drivetrain: drivetrain || undefined,
          fuelType: fuelType || undefined,
          horsepower: horsepower ? parseInt(horsepower, 10) : undefined,
          torque: torque ? parseInt(torque, 10) : undefined,
          color: color || undefined,
          mileage: mileage ? parseInt(mileage, 10) : undefined,
          vin: vin || undefined,
          images,
          thumbnail: images.length > 0 ? images[0] : undefined,
        }),
      })

      if (res.ok) {
        router.push(`/${locale}/garage`)
      } else {
        const data = await res.json()
        setError(data.message || t.errors.failed)
      }
    } catch {
      setError(t.errors.failed)
    } finally {
      setSubmitting(false)
    }
  }

  // Generate year options (1950 to next year)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1950 + 2 }, (_, i) => currentYear + 1 - i)

  // Filter local makes by search
  const filteredLocalMakes = localMakes.filter((make) =>
    make.name.toLowerCase().includes(makeSearch.toLowerCase())
  )

  // Filter NHTSA makes by search
  const filteredNHTSAMakes = nhtsaMakes.filter((make) =>
    make.name.toLowerCase().includes(makeSearch.toLowerCase())
  )

  // Filter local models by search
  const filteredLocalModels = localModels.filter((model) =>
    model.name.toLowerCase().includes(modelSearch.toLowerCase())
  )

  // Filter NHTSA models by search
  const filteredNHTSAModels = nhtsaModels.filter((model) =>
    model.name.toLowerCase().includes(modelSearch.toLowerCase())
  )

  const goBack = () => {
    if (step === 'details') {
      if (vinData) {
        setStep('start')
        setVinData(null)
      } else if (selectedEngine || (selectedGeneration && localEngines.length > 0)) {
        setStep('engine')
      } else if (selectedGeneration || (dataSource === 'local' && localGenerations.length > 0)) {
        setStep('generation')
      } else {
        setStep('model')
      }
    } else if (step === 'engine') {
      setStep('generation')
    } else if (step === 'generation') {
      setStep('model')
    } else if (step === 'model') {
      setStep('make')
    } else if (step === 'make') {
      setStep('year')
    } else if (step === 'year') {
      setStep('start')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/${locale}/garage`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Garage
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t.addCarTitle}</h1>
          <p className="text-zinc-400 mt-1">{t.addCarSubtitle}</p>
        </div>

        {/* Progress indicator */}
        {step !== 'start' && (
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            {(() => {
              // Determine which steps to show based on data source
              const showGeneration = dataSource === 'local' && (step === 'generation' || step === 'engine' || selectedGeneration || localGenerations.length > 0)
              const showEngine = dataSource === 'local' && (step === 'engine' || selectedEngine || localEngines.length > 0)

              const steps: { id: Step; label: string }[] = [
                { id: 'year', label: 'Year' },
                { id: 'make', label: 'Make' },
                { id: 'model', label: 'Model' },
              ]

              if (showGeneration) steps.push({ id: 'generation', label: 'Generation' })
              if (showEngine) steps.push({ id: 'engine', label: 'Engine' })
              steps.push({ id: 'details', label: 'Details' })

              return steps.map((s, i) => {
                const isCompleted =
                  (s.id === 'year' && selectedYear) ||
                  (s.id === 'make' && selectedMake) ||
                  (s.id === 'model' && selectedModel) ||
                  (s.id === 'generation' && selectedGeneration) ||
                  (s.id === 'engine' && selectedEngine)
                const isCurrent = step === s.id

                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${isCurrent ? 'bg-orange-500 text-white' : isCompleted ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                        }`}
                    >
                      {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : i + 1}
                      <span>{s.label}</span>
                    </div>
                    {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-zinc-700 flex-shrink-0" />}
                  </div>
                )
              })
            })()}
          </div>
        )}

        {/* Selected car summary */}
        {(selectedYear || selectedMake || selectedModel) && step !== 'start' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Car className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {selectedYear} {selectedMake?.name} {selectedModel?.name} {selectedGeneration?.displayName || selectedGeneration?.name || ''}
              </p>
              {selectedEngine && (
                <p className="text-zinc-400 text-sm truncate">{selectedEngine.name}</p>
              )}
              {vinData && <p className="text-zinc-500 text-sm">VIN: {vin}</p>}
              {dataSource === 'nhtsa' && <p className="text-zinc-500 text-xs">via NHTSA</p>}
            </div>
            {step !== 'year' && (
              <button
                onClick={goBack}
                className="text-sm text-orange-400 hover:text-orange-300 flex-shrink-0"
              >
                Back
              </button>
            )}
          </div>
        )}

        {/* Step: Start - VIN or Manual */}
        {step === 'start' && (
          <div className="space-y-8">
            {/* VIN Decode Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Quick Add with VIN</h2>
              <p className="text-zinc-400 text-sm mb-4">
                Enter your Vehicle Identification Number to auto-fill car details
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none font-mono tracking-wider"
                />
                <Button
                  onClick={handleVinDecode}
                  disabled={vinLoading || vin.length !== 17}
                  className="flex items-center gap-2"
                >
                  {vinLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Decode
                </Button>
              </div>

              {vinError && (
                <p className="text-red-400 text-sm mt-3">{vinError}</p>
              )}

              <p className="text-zinc-500 text-xs mt-3">
                VIN is typically found on the driver&apos;s side dashboard or door jamb
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-500 text-sm">or</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Manual Entry */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Manual Entry</h2>
              <p className="text-zinc-400 text-sm mb-4">
                Select your car&apos;s year, make, and model from our database
              </p>

              <Button onClick={handleManualEntry} variant="secondary" className="w-full">
                Start Manual Entry
              </Button>
            </div>
          </div>
        )}

        {/* Step: Select Year */}
        {step === 'year' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Select Year</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-96 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleSelectYear(year)}
                  className="p-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-white text-center"
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Select Make */}
        {step === 'make' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Select Make</h2>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setDataSource('local')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${dataSource === 'local' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  <Database className="w-3 h-3" />
                  Popular
                </button>
                <button
                  onClick={switchToNHTSA}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${dataSource === 'nhtsa' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  <Globe className="w-3 h-3" />
                  All Makes
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search makes..."
              value={makeSearch}
              onChange={(e) => setMakeSearch(e.target.value)}
              className="w-full px-4 py-3 mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />

            {dataSource === 'local' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                {filteredLocalMakes.map((make) => (
                  <button
                    key={make.id}
                    onClick={() => handleSelectMake({ name: make.name, id: make.id }, 'local')}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left flex items-center gap-3"
                  >
                    {make.logo && (
                      <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center">
                        <Car className="w-4 h-4 text-zinc-500" />
                      </div>
                    )}
                    <p className="text-white text-sm font-medium truncate">{make.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {loadingMakes ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {filteredNHTSAMakes.slice(0, 200).map((make) => (
                      <button
                        key={make.id}
                        onClick={() => handleSelectMake({ name: make.name, id: make.id }, 'nhtsa')}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <p className="text-white text-sm truncate">{make.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {dataSource === 'local' && filteredLocalMakes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-2">No makes found matching &quot;{makeSearch}&quot;</p>
                <button onClick={switchToNHTSA} className="text-orange-400 hover:text-orange-300 text-sm underline">
                  Search all makes via NHTSA
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step: Select Model */}
        {step === 'model' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Select Model</h2>

            <input
              type="text"
              placeholder="Search models..."
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              className="w-full px-4 py-3 mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />

            {loadingModels ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dataSource === 'local' && filteredLocalModels.length === 0 && filteredNHTSAModels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">No models found for {selectedMake?.name}</p>
                <p className="text-zinc-500 text-sm mb-4">You can enter the model name manually or search NHTSA.</p>
                <div className="max-w-sm mx-auto space-y-3">
                  <input
                    type="text"
                    placeholder="Enter model name"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                  />
                  {modelSearch && (
                    <Button
                      onClick={() => handleSelectModel({ name: modelSearch, id: 0 })}
                      className="w-full"
                    >
                      Use &quot;{modelSearch}&quot;
                    </Button>
                  )}
                  <button
                    onClick={() => {
                      if (selectedYear && selectedMake) {
                        setDataSource('nhtsa')
                        fetchNHTSAModels(selectedMake.name, selectedYear)
                      }
                    }}
                    className="text-orange-400 hover:text-orange-300 text-sm underline"
                  >
                    Search models via NHTSA
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {dataSource === 'local' ? (
                  filteredLocalModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel({ name: model.name, id: model.id })}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <p className="text-white font-medium">{model.name}</p>
                    </button>
                  ))
                ) : (
                  filteredNHTSAModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel({ name: model.name, id: model.id })}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <p className="text-white font-medium">{model.name}</p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Manual entry fallback */}
            {((dataSource === 'local' && filteredLocalModels.length > 0) || (dataSource === 'nhtsa' && filteredNHTSAModels.length > 0)) && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-zinc-500 text-sm mb-3">Can&apos;t find your model?</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter model name manually"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none text-sm"
                  />
                  {modelSearch && (
                    <Button
                      onClick={() => handleSelectModel({ name: modelSearch, id: 0 })}
                      size="sm"
                    >
                      Use This
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Select Generation */}
        {step === 'generation' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Select Generation</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Choose your car&apos;s generation to get accurate stock specifications
            </p>

            {loadingGenerations ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : localGenerations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">No generations found for {selectedModel?.name}</p>
                <p className="text-zinc-500 text-sm mb-4">You can continue without selecting a generation.</p>
                <Button onClick={handleSkipGeneration} variant="secondary">
                  Skip - Enter Details Manually
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {localGenerations
                    .filter(gen => {
                      // Filter generations that match the selected year
                      if (!selectedYear) return true
                      return selectedYear >= gen.startYear && (!gen.endYear || selectedYear <= gen.endYear)
                    })
                    .map((gen) => (
                      <button
                        key={gen.id}
                        onClick={() => handleSelectGeneration(gen)}
                        className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                      >
                        <p className="text-white font-medium">{gen.displayName || gen.name}</p>
                        <p className="text-zinc-500 text-sm mt-1">
                          {gen.startYear} - {gen.endYear || 'Present'}
                        </p>
                        {gen._count && gen._count.engines > 0 && (
                          <p className="text-orange-400 text-xs mt-1">
                            {gen._count.engines} engine{gen._count.engines !== 1 ? 's' : ''} available
                          </p>
                        )}
                      </button>
                    ))}
                </div>

                {/* Show all generations if none match the year */}
                {selectedYear && localGenerations.filter(gen => selectedYear >= gen.startYear && (!gen.endYear || selectedYear <= gen.endYear)).length === 0 && (
                  <div className="mb-6">
                    <p className="text-zinc-400 text-sm mb-4">
                      No generations match {selectedYear}. Showing all generations:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {localGenerations.map((gen) => (
                        <button
                          key={gen.id}
                          onClick={() => handleSelectGeneration(gen)}
                          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white font-medium">{gen.displayName || gen.name}</p>
                          <p className="text-zinc-500 text-sm mt-1">
                            {gen.startYear} - {gen.endYear || 'Present'}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={handleSkipGeneration}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    Skip - I&apos;ll enter details manually
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Select Engine */}
        {step === 'engine' && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Select Engine</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Choose your engine configuration to auto-fill power specifications
            </p>

            {loadingEngines ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : localEngines.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">No engine configurations found</p>
                <p className="text-zinc-500 text-sm mb-4">You can continue and enter specifications manually.</p>
                <Button onClick={handleSkipEngine} variant="secondary">
                  Continue - Enter Specs Manually
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {localEngines.map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => handleSelectEngine(eng)}
                      className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                    >
                      <p className="text-white font-medium">{eng.name}</p>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {eng.horsepower && (
                          <span className="text-zinc-400 text-sm">
                            <span className="text-orange-400 font-semibold">{eng.horsepower}</span> HP
                          </span>
                        )}
                        {eng.torque && (
                          <span className="text-zinc-400 text-sm">
                            <span className="text-orange-400 font-semibold">{eng.torque}</span> Nm
                          </span>
                        )}
                        {eng.fuelType && (
                          <span className="text-zinc-500 text-sm capitalize">{eng.fuelType}</span>
                        )}
                        {eng.transmission && (
                          <span className="text-zinc-500 text-sm">{eng.transmission}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={handleSkipEngine}
                    className="text-zinc-400 hover:text-white text-sm"
                  >
                    Skip - I&apos;ll enter specs manually
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* VIN auto-fill notice */}
            {vinData && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <p className="text-green-400 text-sm">
                  Fields auto-filled from VIN. You can modify any values below.
                </p>
              </div>
            )}

            {/* Engine selection notice */}
            {selectedEngine && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-sm">
                  Stock specifications filled from {selectedEngine.name}. You can modify values if your car is tuned.
                </p>
              </div>
            )}

            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.nickname}</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t.nicknamePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Two columns for specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Engine */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.engine}</label>
                <input
                  type="text"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  placeholder={t.enginePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Horsepower */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.horsepowerLabel}</label>
                <input
                  type="number"
                  value={horsepower}
                  onChange={(e) => setHorsepower(e.target.value)}
                  placeholder={t.horsepowerPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Torque */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Torque (Nm)</label>
                <input
                  type="number"
                  value={torque}
                  onChange={(e) => setTorque(e.target.value)}
                  placeholder="e.g., 350"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Transmission */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.transmission}</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="manual">{t.transmissions.manual}</option>
                  <option value="automatic">{t.transmissions.automatic}</option>
                  <option value="cvt">{t.transmissions.cvt}</option>
                  <option value="dct">{t.transmissions.dct}</option>
                  <option value="other">{t.transmissions.other}</option>
                </select>
              </div>

              {/* Drivetrain */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.drivetrain}</label>
                <select
                  value={drivetrain}
                  onChange={(e) => setDrivetrain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="fwd">{t.drivetrains.fwd}</option>
                  <option value="rwd">{t.drivetrains.rwd}</option>
                  <option value="awd">{t.drivetrains.awd}</option>
                  <option value="4wd">{t.drivetrains['4wd']}</option>
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.fuelType}</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Select</option>
                  <option value="petrol">{t.fuelTypes.petrol}</option>
                  <option value="diesel">{t.fuelTypes.diesel}</option>
                  <option value="electric">{t.fuelTypes.electric}</option>
                  <option value="hybrid">{t.fuelTypes.hybrid}</option>
                  <option value="lpg">{t.fuelTypes.lpg}</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.color}</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder={t.colorPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">{t.mileageLabel}</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder={t.mileagePlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Photos */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Photos (Thumbnail)</label>
                <ImageUpload
                  value={images}
                  onChange={(newImages) => setImages(newImages)}
                  onRemove={(urlToRemove) => setImages(prev => prev.filter(url => url !== urlToRemove))}
                  bucket="machinebio-photos"
                  folderPath="cars"
                  maxFiles={1}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? t.adding : t.addCarButton}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
