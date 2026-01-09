/**
 * Apply Gemini's reorganization to the car database
 *
 * This reads the JSON output from Gemini and reorganizes the database accordingly.
 *
 * Usage: npx tsx scripts/apply-gemini-reorganization.ts
 * Input: /tmp/gemini-organized.json
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

interface GeminiOutput {
  make: string
  modelFamilies: Array<{
    familyName: string
    familySlug: string
    includesModels: string[]
    description?: string
  }>
  standaloneModels?: string[]
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function main() {
  console.log('Applying Gemini reorganization...\n')

  // Read Gemini output
  const inputPath = '/tmp/gemini-organized.json'
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    console.error('\nPlease run Gemini first and save the output to this file.')
    process.exit(1)
  }

  const geminiData: GeminiOutput[] = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
  console.log(`Loaded reorganization data for ${geminiData.length} makes\n`)

  let familiesCreated = 0
  let generationsMoved = 0
  let modelsDeleted = 0

  for (const makeData of geminiData) {
    // Find the make in our database
    const make = await prisma.carMake.findFirst({
      where: {
        OR: [
          { name: { equals: makeData.make, mode: 'insensitive' } },
          { slug: slugify(makeData.make) }
        ]
      }
    })

    if (!make) {
      console.log(`⚠️  Make not found: ${makeData.make}`)
      continue
    }

    console.log(`\n--- ${make.name} ---`)

    // Process each model family
    for (const family of makeData.modelFamilies) {
      if (!family.includesModels || family.includesModels.length === 0) continue

      // Find or create the family model
      let familyModel = await prisma.carModel.findFirst({
        where: {
          makeId: make.id,
          slug: family.familySlug
        }
      })

      if (!familyModel) {
        // Create the family model
        familyModel = await prisma.carModel.create({
          data: {
            name: family.familyName,
            slug: family.familySlug,
            makeId: make.id
          }
        })
        familiesCreated++
        console.log(`  + Created family: ${family.familyName}`)
      }

      // Get existing generation names in the family to avoid conflicts
      const existingGens = await prisma.carGeneration.findMany({
        where: { modelId: familyModel.id },
        select: { name: true }
      })
      const existingGenNames = new Set(existingGens.map(g => g.name))

      // Find all models that should be merged into this family
      for (const modelName of family.includesModels) {
        // Find the source model
        const sourceModel = await prisma.carModel.findFirst({
          where: {
            makeId: make.id,
            name: { equals: modelName, mode: 'insensitive' }
          },
          include: { generations: true }
        })

        if (!sourceModel) continue
        if (sourceModel.id === familyModel.id) continue // Don't process self

        // Move generations from source to family
        for (const gen of sourceModel.generations) {
          let newName = gen.name

          // Handle name conflicts
          if (existingGenNames.has(newName)) {
            const suffix = sourceModel.name.replace(/^\d{4}\s+/, '').trim()
            newName = `${gen.name} (${suffix})`

            let counter = 2
            while (existingGenNames.has(newName)) {
              newName = `${gen.name} (${suffix} #${counter})`
              counter++
            }
          }

          try {
            await prisma.carGeneration.update({
              where: { id: gen.id },
              data: {
                modelId: familyModel.id,
                name: newName
              }
            })
            existingGenNames.add(newName)
            generationsMoved++
          } catch (error) {
            // Skip conflicts
          }
        }

        // Delete the now-empty source model
        try {
          await prisma.carModel.delete({
            where: { id: sourceModel.id }
          })
          modelsDeleted++
        } catch (error) {
          // May have remaining generations
        }
      }
    }
  }

  // Clean up any empty models
  console.log('\n--- Cleaning up empty models ---')
  const emptyModels = await prisma.carModel.findMany({
    where: { generations: { none: {} } }
  })

  if (emptyModels.length > 0) {
    await prisma.carModel.deleteMany({
      where: { id: { in: emptyModels.map(m => m.id) } }
    })
    console.log(`Deleted ${emptyModels.length} empty models`)
    modelsDeleted += emptyModels.length
  }

  // Final counts
  const [makeCount, modelCount, genCount, engineCount] = await Promise.all([
    prisma.carMake.count(),
    prisma.carModel.count(),
    prisma.carGeneration.count(),
    prisma.engineConfig.count(),
  ])

  console.log('\n' + '='.repeat(50))
  console.log('REORGANIZATION COMPLETE')
  console.log('='.repeat(50))
  console.log(`\nChanges:`)
  console.log(`  Families created: ${familiesCreated}`)
  console.log(`  Generations moved: ${generationsMoved}`)
  console.log(`  Models deleted: ${modelsDeleted}`)
  console.log(`\nDatabase totals:`)
  console.log(`  Makes:       ${makeCount}`)
  console.log(`  Models:      ${modelCount}`)
  console.log(`  Generations: ${genCount}`)
  console.log(`  Engines:     ${engineCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
