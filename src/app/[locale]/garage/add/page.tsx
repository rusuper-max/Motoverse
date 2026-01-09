'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, Check, Settings } from 'lucide-react'
import Button from '@/components/ui/Button'
import ImageUpload from '@/components/ui/ImageUpload'
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'
import { useAuth } from '@/hooks/useAuth'

interface Make {
  id: string
  name: string
  slug: string
  logo: string | null
  isPopular: boolean
}

interface Model {
  id: string
  name: string
  slug: string
  _count?: { generations: number }
}

interface Generation {
  id: string
  name: string
  displayName: string | null
  startYear: number
  endYear: number | null
  bodyType: string | null
  _count?: { engines: number; cars: number }
}

interface EngineConfig {
  id: string
  name: string
  displacement: string | null
  fuelType: string
  horsepower: number | null
  torque: number | null
  transmission: string | null
  drivetrain: string | null
}

type Step = 'make' | 'model' | 'generation' | 'engine' | 'details'

export default function AddCarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = params.locale as Locale
  const dict = getDictionary(locale)
  const t = dict.garage

  const { authenticated, loading: authLoading } = useAuth()

  // Step state
  const [step, setStep] = useState<Step>('make')

  // Selection state
  const [selectedMake, setSelectedMake] = useState<Make | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(null)
  const [selectedEngine, setSelectedEngine] = useState<EngineConfig | null>(null)
  const [useCustomEngine, setUseCustomEngine] = useState(false)

  // Data state
  const [makes, setMakes] = useState<Make[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [engines, setEngines] = useState<EngineConfig[]>([])
  const [loadingMakes, setLoadingMakes] = useState(true)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingGenerations, setLoadingGenerations] = useState(false)
  const [loadingEngines, setLoadingEngines] = useState(false)

  // Form state
  const [year, setYear] = useState('')
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

  // Search state
  const [makeSearch, setMakeSearch] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!authenticated) {
      router.push(`/${locale}/login`)
      return
    }
    fetchMakes()
  }, [authenticated, authLoading, locale, router])

  const fetchMakes = async () => {
    try {
      const res = await fetch('/api/makes')
      if (res.ok) {
        const data = await res.json()
        setMakes(data.makes)
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMakes(false)
    }
  }

  const fetchModels = async (makeId: string) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/makes/${makeId}/models`)
      if (res.ok) {
        const data = await res.json()
        setModels(data.models)
      }
    } catch {
      // Ignore
    } finally {
      setLoadingModels(false)
    }
  }

  const fetchGenerations = async (modelId: string) => {
    setLoadingGenerations(true)
    try {
      const res = await fetch(`/api/models/${modelId}/generations`)
      if (res.ok) {
        const data = await res.json()
        setGenerations(data.generations)
      }
    } catch {
      // Ignore
    } finally {
      setLoadingGenerations(false)
    }
  }

  const fetchEngines = async (generationId: string) => {
    setLoadingEngines(true)
    try {
      const res = await fetch(`/api/generations/${generationId}/engines`)
      if (res.ok) {
        const data = await res.json()
        setEngines(data.engines)
      }
    } catch {
      // Ignore
    } finally {
      setLoadingEngines(false)
    }
  }

  const handleSelectMake = (make: Make) => {
    setSelectedMake(make)
    setSelectedModel(null)
    setSelectedGeneration(null)
    setSelectedEngine(null)
    setStep('model')
    fetchModels(make.id)
  }

  const handleSelectModel = (model: Model) => {
    setSelectedModel(model)
    setSelectedGeneration(null)
    setSelectedEngine(null)
    fetchGenerations(model.id)
    setStep('generation')
  }

  const handleSelectGeneration = (generation: Generation) => {
    setSelectedGeneration(generation)
    setSelectedEngine(null)
    // Set default year to most recent in range
    const defaultYear = generation.endYear || generation.startYear
    setYear(String(defaultYear))
    fetchEngines(generation.id)
    setStep('engine')
  }

  const handleSelectEngine = (engineConfig: EngineConfig) => {
    setSelectedEngine(engineConfig)
    setUseCustomEngine(false)
    // Auto-fill specs from engine config
    setEngine(engineConfig.name)
    setFuelType(engineConfig.fuelType || '')
    setHorsepower(engineConfig.horsepower?.toString() || '')
    setTorque(engineConfig.torque?.toString() || '')
    setTransmission(engineConfig.transmission || '')
    setDrivetrain(engineConfig.drivetrain || '')
    setStep('details')
  }

  const handleCustomEngine = () => {
    setSelectedEngine(null)
    setUseCustomEngine(true)
    // Clear engine-related fields
    setEngine('')
    setFuelType('')
    setHorsepower('')
    setTorque('')
    setTransmission('')
    setDrivetrain('')
    setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGeneration || !year) {
      setError(t.errors.selectYear)
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
          generationId: selectedGeneration.id,
          engineConfigId: selectedEngine?.id || undefined,
          year: parseInt(year, 10),
          nickname: nickname || undefined,
          engine: engine || undefined,
          transmission: transmission || undefined,
          drivetrain: drivetrain || undefined,
          fuelType: fuelType || undefined,
          horsepower: horsepower || undefined,
          torque: torque || undefined,
          color: color || undefined,
          mileage: mileage || undefined,
          images, // Pass the gallery
          thumbnail: images.length > 0 ? images[0] : undefined, // Auto-set thumbnail
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

  // Generate year options based on selected generation
  const minYear = selectedGeneration?.startYear || 1950
  const maxYear = selectedGeneration?.endYear || new Date().getFullYear() + 1
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i)

  // Filter makes by search
  const filteredMakes = makes.filter((make) =>
    make.name.toLowerCase().includes(makeSearch.toLowerCase())
  )
  const popularMakes = filteredMakes.filter((m) => m.isPopular)
  const otherMakes = filteredMakes.filter((m) => !m.isPopular)

  // Group engines by fuel type
  const petrolEngines = engines.filter(e => e.fuelType === 'petrol')
  const dieselEngines = engines.filter(e => e.fuelType === 'diesel')
  const otherEngines = engines.filter(e => !['petrol', 'diesel'].includes(e.fuelType))

  const goBack = () => {
    if (step === 'details') {
      setStep('engine')
    } else if (step === 'engine') {
      setStep('generation')
    } else if (step === 'generation') {
      setStep('model')
    } else if (step === 'model') {
      setStep('make')
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {(['make', 'model', 'generation', 'engine', 'details'] as Step[]).map((s, i) => {
            const labels = { make: 'Make', model: 'Model', generation: 'Generation', engine: 'Engine', details: 'Details' }
            const isCompleted =
              (s === 'make' && selectedMake) ||
              (s === 'model' && selectedModel) ||
              (s === 'generation' && selectedGeneration) ||
              (s === 'engine' && (selectedEngine || useCustomEngine))
            const isCurrent = step === s

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${isCurrent ? 'bg-orange-500 text-white' : isCompleted ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                    }`}
                >
                  {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : i + 1}
                  <span>{labels[s]}</span>
                </div>
                {i < 4 && <div className="w-4 sm:w-8 h-px bg-zinc-700 flex-shrink-0" />}
              </div>
            )
          })}
        </div>

        {/* Selected car summary */}
        {(selectedMake || selectedModel || selectedGeneration) && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
              <Car className="w-6 h-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {selectedMake?.name} {selectedModel?.name} {selectedGeneration?.displayName || selectedGeneration?.name} {year && `(${year})`}
              </p>
              {selectedEngine && (
                <p className="text-zinc-400 text-sm truncate">{selectedEngine.name}</p>
              )}
              {!selectedModel && <p className="text-zinc-500 text-sm">Select a model</p>}
              {selectedModel && !selectedGeneration && <p className="text-zinc-500 text-sm">Select a generation</p>}
            </div>
            {step !== 'make' && (
              <button
                onClick={goBack}
                className="text-sm text-orange-400 hover:text-orange-300 flex-shrink-0"
              >
                Back
              </button>
            )}
          </div>
        )}

        {/* Step: Select Make */}
        {step === 'make' && (
          <div>
            <input
              type="text"
              placeholder="Search makes..."
              value={makeSearch}
              onChange={(e) => setMakeSearch(e.target.value)}
              className="w-full px-4 py-3 mb-6 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
            />

            {loadingMakes ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {popularMakes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">Popular Makes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {popularMakes.map((make) => (
                        <button
                          key={make.id}
                          onClick={() => handleSelectMake(make)}
                          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white font-medium">{make.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {otherMakes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">All Makes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {otherMakes.map((make) => (
                        <button
                          key={make.id}
                          onClick={() => handleSelectMake(make)}
                          className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white text-sm">{make.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step: Select Model */}
        {step === 'model' && (
          <div>
            {loadingModels ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400">No models found for {selectedMake?.name}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <p className="text-white font-medium">{model.name}</p>
                    {model._count && model._count.generations > 0 && (
                      <p className="text-zinc-500 text-sm mt-1">
                        {model._count.generations} generation{model._count.generations > 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Select Generation */}
        {step === 'generation' && (
          <div>
            {loadingGenerations ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : generations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-400 mb-4">No generations found for {selectedModel?.name}</p>
                <p className="text-zinc-500 text-sm">This model doesn&apos;t have generation data yet. Please check back later or contact support to add your car.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generations.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => handleSelectGeneration(gen)}
                    className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <p className="text-white font-medium">{gen.displayName || gen.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                      <span>{gen.startYear} - {gen.endYear || 'present'}</span>
                      {gen.bodyType && <span className="capitalize">{gen.bodyType}</span>}
                    </div>
                    {gen._count && gen._count.engines > 0 && (
                      <p className="text-orange-400/70 text-sm mt-2">
                        {gen._count.engines} engine option{gen._count.engines > 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Select Engine */}
        {step === 'engine' && (
          <div>
            {loadingEngines ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Petrol engines */}
                {petrolEngines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">Petrol / Gasoline</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {petrolEngines.map((eng) => (
                        <button
                          key={eng.id}
                          onClick={() => handleSelectEngine(eng)}
                          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white font-medium">{eng.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-zinc-500">
                            {eng.horsepower && <span>{eng.horsepower} HP</span>}
                            {eng.torque && <span>{eng.torque} Nm</span>}
                            {eng.transmission && <span className="capitalize">{eng.transmission}</span>}
                            {eng.drivetrain && <span className="uppercase">{eng.drivetrain}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diesel engines */}
                {dieselEngines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">Diesel</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {dieselEngines.map((eng) => (
                        <button
                          key={eng.id}
                          onClick={() => handleSelectEngine(eng)}
                          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white font-medium">{eng.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-zinc-500">
                            {eng.horsepower && <span>{eng.horsepower} HP</span>}
                            {eng.torque && <span>{eng.torque} Nm</span>}
                            {eng.transmission && <span className="capitalize">{eng.transmission}</span>}
                            {eng.drivetrain && <span className="uppercase">{eng.drivetrain}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other engines (electric, hybrid, etc.) */}
                {otherEngines.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3">Electric / Hybrid / Other</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {otherEngines.map((eng) => (
                        <button
                          key={eng.id}
                          onClick={() => handleSelectEngine(eng)}
                          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-orange-500 hover:bg-zinc-800 transition-colors text-left"
                        >
                          <p className="text-white font-medium">{eng.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-zinc-500">
                            <span className="capitalize">{eng.fuelType}</span>
                            {eng.horsepower && <span>{eng.horsepower} HP</span>}
                            {eng.torque && <span>{eng.torque} Nm</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom engine option */}
                <div className="border-t border-zinc-800 pt-6">
                  <button
                    onClick={handleCustomEngine}
                    className="w-full p-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 hover:border-orange-500 hover:bg-zinc-800/50 transition-colors text-left flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Custom / Other Engine</p>
                      <p className="text-zinc-500 text-sm">Enter engine specs manually</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">{t.year} *</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select year</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Engine specs header */}
            {selectedEngine && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                <p className="text-zinc-400 text-sm">Pre-filled from: <span className="text-white">{selectedEngine.name}</span></p>
                <p className="text-zinc-500 text-xs mt-1">You can modify any values below</p>
              </div>
            )}

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
                <label className="block text-sm font-medium text-zinc-300 mb-2">Photos (Max 10)</label>
                <ImageUpload
                  value={images}
                  onChange={(newImages) => setImages(newImages)}
                  onRemove={(urlToRemove) => setImages(prev => prev.filter(url => url !== urlToRemove))}
                  bucket="machinebio-photos"
                  folderPath="cars"
                  maxFiles={10}
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
