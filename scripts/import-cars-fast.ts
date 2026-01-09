/**
 * FAST import script using batch operations
 *
 * Usage: npx tsx scripts/import-cars-fast.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface Brand {
  id: number
  name: string
  logo: string
}

interface Automobile {
  id: number
  brand_id: number
  name: string
  photos: string[]
}

interface Engine {
  id: number
  automobile_id: number
  name: string
  specs: {
    'Engine Specs'?: {
      'Displacement:'?: string
      'Power:'?: string
      'Torque:'?: string
      'Fuel:'?: string
    }
    'Transmission Specs'?: {
      'Drive Type:'?: string
      'Gearbox:'?: string
    }
  }
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseYears(name: string): { startYear: number | null; endYear: number | null } {
  const match = name.match(/(\d{4})-(\d{4}|Present)/i)
  if (match) {
    return {
      startYear: parseInt(match[1]),
      endYear: match[2].toLowerCase() === 'present' ? null : parseInt(match[2])
    }
  }
  const singleYear = name.match(/\b(19|20)\d{2}\b/)
  if (singleYear) {
    return { startYear: parseInt(singleYear[0]), endYear: null }
  }
  return { startYear: null, endYear: null }
}

function cleanModelName(name: string): string {
  return name
    .replace(/\s*\d{4}-\d{4}\s*/g, '')
    .replace(/\s*\d{4}-Present\s*/gi, '')
    .replace(/\s*Photos,?\s*engines?\s*&?\s*full\s*specs?\s*/gi, '')
    .replace(/&amp;/g, '&')
    .trim()
}

function parseHP(power: string | undefined): number | null {
  if (!power) return null
  const match = power.match(/(\d+)\s*Hp/i)
  return match ? parseInt(match[1]) : null
}

function parseTorque(torque: string | undefined): number | null {
  if (!torque) return null
  const match = torque.match(/(\d+)\s*Nm/i)
  return match ? parseInt(match[1]) : null
}

function parseFuelType(fuel: string | undefined): string {
  if (!fuel) return 'petrol'
  const lower = fuel.toLowerCase()
  if (lower.includes('diesel')) return 'diesel'
  if (lower.includes('electric')) return 'electric'
  if (lower.includes('hybrid')) return 'hybrid'
  return 'petrol'
}

function parseDrivetrain(driveType: string | undefined): string | null {
  if (!driveType) return null
  const lower = driveType.toLowerCase()
  if (lower.includes('all wheel') || lower.includes('awd') || lower.includes('4wd')) return 'awd'
  if (lower.includes('front wheel') || lower.includes('fwd')) return 'fwd'
  if (lower.includes('rear wheel') || lower.includes('rwd')) return 'rwd'
  return null
}

function parseTransmission(gearbox: string | undefined): string | null {
  if (!gearbox) return null
  const lower = gearbox.toLowerCase()
  if (lower.includes('manual')) return 'manual'
  if (lower.includes('automatic') || lower.includes('auto')) return 'automatic'
  if (lower.includes('cvt')) return 'cvt'
  if (lower.includes('dct') || lower.includes('dual clutch')) return 'dct'
  return null
}

const POPULAR_BRANDS = [
  'BMW', 'MERCEDES-BENZ', 'AUDI', 'VOLKSWAGEN', 'PORSCHE',
  'TOYOTA', 'HONDA', 'NISSAN', 'MAZDA', 'SUBARU', 'MITSUBISHI', 'LEXUS',
  'FORD', 'CHEVROLET', 'DODGE', 'JEEP', 'CADILLAC', 'TESLA',
  'FERRARI', 'LAMBORGHINI', 'MCLAREN', 'ASTON MARTIN', 'BENTLEY', 'ROLLS-ROYCE',
  'HYUNDAI', 'KIA', 'VOLVO', 'JAGUAR', 'LAND ROVER', 'MINI', 'ALFA ROMEO'
]

async function main() {
  console.log('=== FAST CAR DATABASE IMPORT ===\n')

  // Load JSON files
  const brands: Brand[] = JSON.parse(fs.readFileSync('/tmp/brands.json', 'utf-8'))
  const automobiles: Automobile[] = JSON.parse(fs.readFileSync('/tmp/automobiles.json', 'utf-8'))
  const engines: Engine[] = JSON.parse(fs.readFileSync('/tmp/engines.json', 'utf-8'))

  console.log(`Loaded: ${brands.length} brands, ${automobiles.length} autos, ${engines.length} engines\n`)

  // Step 1: Get existing makes to avoid duplicates
  console.log('Step 1: Processing brands...')
  const existingMakes = await prisma.carMake.findMany({ select: { id: true, slug: true } })
  const existingMakeSlugs = new Set(existingMakes.map(m => m.slug))

  const newBrands = brands.filter(b => !existingMakeSlugs.has(slugify(b.name)))

  if (newBrands.length > 0) {
    await prisma.carMake.createMany({
      data: newBrands.map(b => ({
        name: b.name,
        slug: slugify(b.name),
        logo: b.logo || null,
        isPopular: POPULAR_BRANDS.includes(b.name.toUpperCase()),
      })),
      skipDuplicates: true,
    })
  }

  // Get all makes with their IDs
  const allMakes = await prisma.carMake.findMany({ select: { id: true, slug: true } })
  const makeSlugToId = new Map(allMakes.map(m => [m.slug, m.id]))
  const brandIdToMakeId = new Map<number, string>()
  for (const brand of brands) {
    const makeId = makeSlugToId.get(slugify(brand.name))
    if (makeId) brandIdToMakeId.set(brand.id, makeId)
  }
  console.log(`  ${allMakes.length} total brands in database\n`)

  // Step 2: Group automobiles by model name and process
  console.log('Step 2: Processing models...')

  // Get existing models
  const existingModels = await prisma.carModel.findMany({
    select: { id: true, makeId: true, slug: true }
  })
  const existingModelKeys = new Set(existingModels.map(m => `${m.makeId}:${m.slug}`))

  // Group automobiles by brand -> model
  const modelGroups = new Map<string, { makeId: string; name: string; slug: string }>()

  for (const auto of automobiles) {
    const makeId = brandIdToMakeId.get(auto.brand_id)
    if (!makeId) continue

    const cleanName = cleanModelName(auto.name)
    const baseModel = cleanName.split(' ').slice(0, 3).join(' ')
    const modelSlug = slugify(baseModel)
    const key = `${makeId}:${modelSlug}`

    if (!modelGroups.has(key) && !existingModelKeys.has(key)) {
      modelGroups.set(key, { makeId, name: baseModel, slug: modelSlug })
    }
  }

  // Batch insert new models
  const newModels = Array.from(modelGroups.values())
  if (newModels.length > 0) {
    // Insert in batches of 500
    for (let i = 0; i < newModels.length; i += 500) {
      const batch = newModels.slice(i, i + 500)
      await prisma.carModel.createMany({
        data: batch,
        skipDuplicates: true,
      })
      console.log(`  Inserted models ${i + 1}-${Math.min(i + 500, newModels.length)}...`)
    }
  }

  // Get all models with IDs
  const allModels = await prisma.carModel.findMany({ select: { id: true, makeId: true, slug: true } })
  const modelKeyToId = new Map(allModels.map(m => [`${m.makeId}:${m.slug}`, m.id]))
  console.log(`  ${allModels.length} total models in database\n`)

  // Step 3: Process generations
  console.log('Step 3: Processing generations...')

  // Get existing generations
  const existingGens = await prisma.carGeneration.findMany({
    select: { id: true, modelId: true, name: true }
  })
  const existingGenKeys = new Set(existingGens.map(g => `${g.modelId}:${g.name}`))

  // Prepare generation data
  const generationData: Array<{
    modelId: string
    name: string
    displayName: string
    startYear: number
    endYear: number | null
    image: string | null
    autoId: number // for engine mapping
  }> = []

  for (const auto of automobiles) {
    const makeId = brandIdToMakeId.get(auto.brand_id)
    if (!makeId) continue

    const cleanName = cleanModelName(auto.name)
    const baseModel = cleanName.split(' ').slice(0, 3).join(' ')
    const modelSlug = slugify(baseModel)
    const modelId = modelKeyToId.get(`${makeId}:${modelSlug}`)
    if (!modelId) continue

    const { startYear, endYear } = parseYears(auto.name)
    if (!startYear) continue

    const genName = `${startYear}${endYear ? `-${endYear}` : '+'}`
    const genKey = `${modelId}:${genName}`

    if (!existingGenKeys.has(genKey)) {
      generationData.push({
        modelId,
        name: genName,
        displayName: cleanName,
        startYear,
        endYear,
        image: auto.photos?.[0] || null,
        autoId: auto.id,
      })
      existingGenKeys.add(genKey) // Prevent duplicates in same batch
    }
  }

  // Batch insert generations
  if (generationData.length > 0) {
    for (let i = 0; i < generationData.length; i += 500) {
      const batch = generationData.slice(i, i + 500)
      await prisma.carGeneration.createMany({
        data: batch.map(g => ({
          modelId: g.modelId,
          name: g.name,
          displayName: g.displayName,
          startYear: g.startYear,
          endYear: g.endYear,
          image: g.image,
        })),
        skipDuplicates: true,
      })
      console.log(`  Inserted generations ${i + 1}-${Math.min(i + 500, generationData.length)}...`)
    }
  }

  // Get all generations with IDs
  const allGens = await prisma.carGeneration.findMany({
    select: { id: true, modelId: true, name: true }
  })
  const genKeyToId = new Map(allGens.map(g => [`${g.modelId}:${g.name}`, g.id]))
  console.log(`  ${allGens.length} total generations in database\n`)

  // Build auto ID to generation ID mapping
  const autoIdToGenId = new Map<number, string>()
  for (const auto of automobiles) {
    const makeId = brandIdToMakeId.get(auto.brand_id)
    if (!makeId) continue

    const cleanName = cleanModelName(auto.name)
    const baseModel = cleanName.split(' ').slice(0, 3).join(' ')
    const modelSlug = slugify(baseModel)
    const modelId = modelKeyToId.get(`${makeId}:${modelSlug}`)
    if (!modelId) continue

    const { startYear, endYear } = parseYears(auto.name)
    if (!startYear) continue

    const genName = `${startYear}${endYear ? `-${endYear}` : '+'}`
    const genId = genKeyToId.get(`${modelId}:${genName}`)
    if (genId) autoIdToGenId.set(auto.id, genId)
  }

  // Step 4: Process engines
  console.log('Step 4: Processing engines...')

  // Get existing engines
  const existingEngines = await prisma.engineConfig.findMany({
    select: { generationId: true, name: true }
  })
  const existingEngineKeys = new Set(existingEngines.map(e => `${e.generationId}:${e.name}`))

  // Prepare engine data
  const engineData: Array<{
    generationId: string
    name: string
    displacement: string | null
    fuelType: string
    horsepower: number | null
    torque: number | null
    transmission: string | null
    drivetrain: string | null
  }> = []

  for (const engine of engines) {
    const generationId = autoIdToGenId.get(engine.automobile_id)
    if (!generationId) continue

    const engineKey = `${generationId}:${engine.name}`
    if (existingEngineKeys.has(engineKey)) continue

    const specs = engine.specs || {}
    const engineSpecs = specs['Engine Specs'] || {}
    const transSpecs = specs['Transmission Specs'] || {}

    engineData.push({
      generationId,
      name: engine.name,
      displacement: engineSpecs['Displacement:'] || null,
      fuelType: parseFuelType(engineSpecs['Fuel:']),
      horsepower: parseHP(engineSpecs['Power:']),
      torque: parseTorque(engineSpecs['Torque:']),
      transmission: parseTransmission(transSpecs['Gearbox:']),
      drivetrain: parseDrivetrain(transSpecs['Drive Type:']),
    })
    existingEngineKeys.add(engineKey)
  }

  // Batch insert engines
  if (engineData.length > 0) {
    for (let i = 0; i < engineData.length; i += 1000) {
      const batch = engineData.slice(i, i + 1000)
      await prisma.engineConfig.createMany({
        data: batch,
        skipDuplicates: true,
      })
      console.log(`  Inserted engines ${i + 1}-${Math.min(i + 1000, engineData.length)}...`)
    }
  }

  // Final counts
  const [makeCount, modelCount, genCount, engineCount] = await Promise.all([
    prisma.carMake.count(),
    prisma.carModel.count(),
    prisma.carGeneration.count(),
    prisma.engineConfig.count(),
  ])

  console.log('\n=== IMPORT COMPLETE ===')
  console.log(`Makes:       ${makeCount}`)
  console.log(`Models:      ${modelCount}`)
  console.log(`Generations: ${genCount}`)
  console.log(`Engines:     ${engineCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
