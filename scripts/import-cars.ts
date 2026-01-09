/**
 * Script to import automobile data from autoevolution dataset
 *
 * Data source: https://github.com/ilyasozkurt/automobile-models-and-specs
 * Contains: 124 brands, 7207 models, 30066 engine configurations
 *
 * Usage:
 *   npx tsx scripts/import-cars.ts
 *
 * Note: Make sure to download and extract the JSON files first:
 *   curl -L "https://github.com/ilyasozkurt/automobile-models-and-specs/raw/master/automobiles.json.zip" -o /tmp/automobiles.json.zip
 *   unzip -o /tmp/automobiles.json.zip -d /tmp/
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Make sure .env.local exists with DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Type definitions for the JSON data
interface Brand {
  id: number
  name: string
  logo: string
  url: string
}

interface Automobile {
  id: number
  brand_id: number
  name: string
  description: string
  photos: string[]
  url: string
}

interface Engine {
  id: number
  automobile_id: number
  name: string
  specs: {
    'Engine Specs'?: {
      'Cylinders:'?: string
      'Displacement:'?: string
      'Power:'?: string
      'Torque:'?: string
      'Fuel System:'?: string
      'Fuel:'?: string
    }
    'Transmission Specs'?: {
      'Drive Type:'?: string
      'Gearbox:'?: string
    }
    'Dimensions'?: {
      'Length:'?: string
      'Width:'?: string
      'Height:'?: string
      'Wheelbase:'?: string
    }
  }
}

// Helper to create slug from name
function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Helper to parse year range from model name
function parseYears(name: string): { startYear: number | null; endYear: number | null } {
  // Pattern like "1998-2000" or "2020-Present"
  const match = name.match(/(\d{4})-(\d{4}|Present)/i)
  if (match) {
    return {
      startYear: parseInt(match[1]),
      endYear: match[2].toLowerCase() === 'present' ? null : parseInt(match[2])
    }
  }
  // Single year like "2020"
  const singleYear = name.match(/\b(19|20)\d{2}\b/)
  if (singleYear) {
    return {
      startYear: parseInt(singleYear[0]),
      endYear: null
    }
  }
  return { startYear: null, endYear: null }
}

// Helper to extract clean model name
function cleanModelName(name: string): string {
  // Remove year range and common suffixes
  return name
    .replace(/\s*\d{4}-\d{4}\s*/g, '')
    .replace(/\s*\d{4}-Present\s*/gi, '')
    .replace(/\s*Photos,?\s*engines?\s*&?\s*full\s*specs?\s*/gi, '')
    .replace(/&amp;/g, '&')
    .trim()
}

// Helper to parse HP from power string
function parseHP(power: string | undefined): number | null {
  if (!power) return null
  const match = power.match(/(\d+)\s*Hp/i)
  return match ? parseInt(match[1]) : null
}

// Helper to parse torque from string
function parseTorque(torque: string | undefined): number | null {
  if (!torque) return null
  const match = torque.match(/(\d+)\s*Nm/i)
  return match ? parseInt(match[1]) : null
}

// Helper to determine fuel type
function parseFuelType(fuel: string | undefined): string {
  if (!fuel) return 'petrol'
  const lowerFuel = fuel.toLowerCase()
  if (lowerFuel.includes('diesel')) return 'diesel'
  if (lowerFuel.includes('electric')) return 'electric'
  if (lowerFuel.includes('hybrid')) return 'hybrid'
  if (lowerFuel.includes('lpg') || lowerFuel.includes('cng')) return 'lpg'
  return 'petrol'
}

// Helper to determine drivetrain
function parseDrivetrain(driveType: string | undefined): string | null {
  if (!driveType) return null
  const lower = driveType.toLowerCase()
  if (lower.includes('all wheel') || lower.includes('awd') || lower.includes('4wd') || lower.includes('four wheel')) return 'awd'
  if (lower.includes('front wheel') || lower.includes('fwd')) return 'fwd'
  if (lower.includes('rear wheel') || lower.includes('rwd')) return 'rwd'
  return null
}

// Helper to determine transmission type
function parseTransmission(gearbox: string | undefined): string | null {
  if (!gearbox) return null
  const lower = gearbox.toLowerCase()
  if (lower.includes('manual')) return 'manual'
  if (lower.includes('automatic') || lower.includes('auto')) return 'automatic'
  if (lower.includes('cvt')) return 'cvt'
  if (lower.includes('dct') || lower.includes('dual clutch')) return 'dct'
  return null
}

// Popular brands to mark
const POPULAR_BRANDS = [
  'BMW', 'MERCEDES-BENZ', 'AUDI', 'VOLKSWAGEN', 'PORSCHE',
  'TOYOTA', 'HONDA', 'NISSAN', 'MAZDA', 'SUBARU', 'MITSUBISHI', 'LEXUS',
  'FORD', 'CHEVROLET', 'DODGE', 'JEEP', 'CADILLAC', 'TESLA',
  'FERRARI', 'LAMBORGHINI', 'MCLAREN', 'ASTON MARTIN', 'BENTLEY', 'ROLLS-ROYCE',
  'HYUNDAI', 'KIA', 'VOLVO', 'JAGUAR', 'LAND ROVER', 'MINI', 'ALFA ROMEO'
]

async function importData() {
  console.log('Starting automobile data import...\n')

  // Read JSON files
  const brandsPath = '/tmp/brands.json'
  const automobilesPath = '/tmp/automobiles.json'
  const enginesPath = '/tmp/engines.json'

  if (!fs.existsSync(brandsPath) || !fs.existsSync(automobilesPath) || !fs.existsSync(enginesPath)) {
    console.error('JSON files not found. Please download and extract them first.')
    console.error('Run:')
    console.error('  curl -L "https://github.com/ilyasozkurt/automobile-models-and-specs/raw/master/automobiles.json.zip" -o /tmp/automobiles.json.zip')
    console.error('  unzip -o /tmp/automobiles.json.zip -d /tmp/')
    process.exit(1)
  }

  const brands: Brand[] = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'))
  const automobiles: Automobile[] = JSON.parse(fs.readFileSync(automobilesPath, 'utf-8'))
  const engines: Engine[] = JSON.parse(fs.readFileSync(enginesPath, 'utf-8'))

  console.log(`Loaded: ${brands.length} brands, ${automobiles.length} models, ${engines.length} engines\n`)

  // Create brand ID mapping
  const brandIdMap = new Map<number, string>() // old ID -> new cuid
  const modelIdMap = new Map<number, string>() // old automobile ID -> new generation cuid

  // Import brands
  console.log('Importing brands...')
  let importedBrands = 0

  for (const brand of brands) {
    const slug = slugify(brand.name)
    const isPopular = POPULAR_BRANDS.includes(brand.name.toUpperCase())

    try {
      const existing = await prisma.carMake.findUnique({ where: { slug } })

      if (existing) {
        brandIdMap.set(brand.id, existing.id)
      } else {
        const created = await prisma.carMake.create({
          data: {
            name: brand.name,
            slug,
            logo: brand.logo,
            isPopular,
          }
        })
        brandIdMap.set(brand.id, created.id)
        importedBrands++
      }
    } catch (error) {
      console.error(`Failed to import brand ${brand.name}:`, error)
    }
  }
  console.log(`Imported ${importedBrands} new brands\n`)

  // Group automobiles by brand for model creation
  const autosByBrand = new Map<number, Automobile[]>()
  for (const auto of automobiles) {
    if (!autosByBrand.has(auto.brand_id)) {
      autosByBrand.set(auto.brand_id, [])
    }
    autosByBrand.get(auto.brand_id)!.push(auto)
  }

  // Import models and generations
  console.log('Importing models and generations...')
  let importedModels = 0
  let importedGenerations = 0

  for (const [brandId, autos] of autosByBrand) {
    const makeId = brandIdMap.get(brandId)
    if (!makeId) continue

    // Group by model name (without years)
    const modelGroups = new Map<string, Automobile[]>()
    for (const auto of autos) {
      const cleanName = cleanModelName(auto.name)
      // Extract base model name (first 2-3 words typically)
      const baseModel = cleanName.split(' ').slice(0, 3).join(' ')
      if (!modelGroups.has(baseModel)) {
        modelGroups.set(baseModel, [])
      }
      modelGroups.get(baseModel)!.push(auto)
    }

    for (const [modelName, modelAutos] of modelGroups) {
      const modelSlug = slugify(modelName)

      try {
        // Find or create model
        let model = await prisma.carModel.findFirst({
          where: { makeId, slug: modelSlug }
        })

        if (!model) {
          model = await prisma.carModel.create({
            data: {
              name: modelName,
              slug: modelSlug,
              makeId,
            }
          })
          importedModels++
        }

        // Create generations for each automobile entry
        for (const auto of modelAutos) {
          const { startYear, endYear } = parseYears(auto.name)
          if (!startYear) continue // Skip if no year found

          const generationName = `${startYear}${endYear ? `-${endYear}` : '+'}`

          try {
            const existingGen = await prisma.carGeneration.findFirst({
              where: { modelId: model.id, name: generationName }
            })

            if (existingGen) {
              modelIdMap.set(auto.id, existingGen.id)
            } else {
              const generation = await prisma.carGeneration.create({
                data: {
                  name: generationName,
                  displayName: cleanModelName(auto.name),
                  startYear,
                  endYear,
                  image: auto.photos[0] || null,
                  modelId: model.id,
                }
              })
              modelIdMap.set(auto.id, generation.id)
              importedGenerations++
            }
          } catch (error) {
            // Skip duplicate generations
          }
        }
      } catch (error) {
        console.error(`Failed to import model ${modelName}:`, error)
      }
    }
  }
  console.log(`Imported ${importedModels} new models, ${importedGenerations} new generations\n`)

  // Import engines
  console.log('Importing engine configurations...')
  let importedEngines = 0
  let skippedEngines = 0

  for (const engine of engines) {
    const generationId = modelIdMap.get(engine.automobile_id)
    if (!generationId) {
      skippedEngines++
      continue
    }

    const specs = engine.specs || {}
    const engineSpecs = specs['Engine Specs'] || {}
    const transmissionSpecs = specs['Transmission Specs'] || {}

    const hp = parseHP(engineSpecs['Power:'])
    const torque = parseTorque(engineSpecs['Torque:'])
    const fuelType = parseFuelType(engineSpecs['Fuel:'])
    const drivetrain = parseDrivetrain(transmissionSpecs['Drive Type:'])
    const transmission = parseTransmission(transmissionSpecs['Gearbox:'])

    try {
      // Check if similar engine already exists
      const existing = await prisma.engineConfig.findFirst({
        where: {
          generationId,
          name: engine.name,
        }
      })

      if (!existing) {
        await prisma.engineConfig.create({
          data: {
            name: engine.name,
            displacement: engineSpecs['Displacement:'] || null,
            fuelType,
            horsepower: hp,
            torque,
            transmission,
            drivetrain,
            generationId,
          }
        })
        importedEngines++
      }
    } catch (error) {
      // Skip errors (likely duplicates)
      skippedEngines++
    }

    // Progress indicator
    if ((importedEngines + skippedEngines) % 1000 === 0) {
      console.log(`  Processed ${importedEngines + skippedEngines} engines...`)
    }
  }

  console.log(`Imported ${importedEngines} new engines (skipped ${skippedEngines})\n`)

  // Summary
  console.log('='.repeat(50))
  console.log('Import complete!')
  console.log('='.repeat(50))

  const finalCounts = await Promise.all([
    prisma.carMake.count(),
    prisma.carModel.count(),
    prisma.carGeneration.count(),
    prisma.engineConfig.count(),
  ])

  console.log(`\nDatabase totals:`)
  console.log(`  Makes: ${finalCounts[0]}`)
  console.log(`  Models: ${finalCounts[1]}`)
  console.log(`  Generations: ${finalCounts[2]}`)
  console.log(`  Engine configs: ${finalCounts[3]}`)
}

// Run import
importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
