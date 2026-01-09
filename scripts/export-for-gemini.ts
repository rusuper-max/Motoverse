/**
 * Export car data for Gemini AI reorganization
 *
 * This exports all the messy car data in a format that Gemini can process
 * to properly organize into model families.
 *
 * Usage: npx tsx scripts/export-for-gemini.ts
 * Output: /tmp/cars-for-gemini.json
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

async function main() {
  console.log('Exporting car data for Gemini processing...\n')

  // Get all makes with their models and generations
  const makes = await prisma.carMake.findMany({
    orderBy: { name: 'asc' },
    include: {
      models: {
        orderBy: { name: 'asc' },
        include: {
          generations: {
            orderBy: { startYear: 'asc' },
            include: {
              engines: true
            }
          }
        }
      }
    }
  })

  console.log(`Found ${makes.length} makes`)

  // Transform data for Gemini - simplified structure
  const exportData: Array<{
    make: string
    makeSlug: string
    currentModels: Array<{
      name: string
      slug: string
      generations: Array<{
        id: string
        name: string
        displayName: string | null
        startYear: number
        endYear: number | null
        engineCount: number
      }>
    }>
  }> = []

  for (const make of makes) {
    exportData.push({
      make: make.name,
      makeSlug: make.slug,
      currentModels: make.models.map(model => ({
        name: model.name,
        slug: model.slug,
        generations: model.generations.map(gen => ({
          id: gen.id,
          name: gen.name,
          displayName: gen.displayName,
          startYear: gen.startYear,
          endYear: gen.endYear,
          engineCount: gen.engines.length
        }))
      }))
    })
  }

  // Save full export
  fs.writeFileSync('/tmp/cars-for-gemini-full.json', JSON.stringify(exportData, null, 2))
  console.log(`\nSaved full export to /tmp/cars-for-gemini-full.json`)

  // Also create a simplified version with just model names per brand for easier processing
  const simplifiedExport: Array<{
    make: string
    models: string[]
  }> = exportData.map(m => ({
    make: m.make,
    models: m.currentModels.map(model => model.name)
  }))

  fs.writeFileSync('/tmp/cars-for-gemini-simple.json', JSON.stringify(simplifiedExport, null, 2))
  console.log(`Saved simplified export to /tmp/cars-for-gemini-simple.json`)

  // Count stats
  let totalModels = 0
  let totalGens = 0
  for (const make of exportData) {
    totalModels += make.currentModels.length
    for (const model of make.currentModels) {
      totalGens += model.generations.length
    }
  }

  console.log(`\nStats:`)
  console.log(`  Makes: ${makes.length}`)
  console.log(`  Models: ${totalModels}`)
  console.log(`  Generations: ${totalGens}`)

  // Create a prompt file for Gemini
  const geminiPrompt = `# Car Database Reorganization Task

I have a car database that was imported from a third-party source. The data is messy - instead of proper model families, each car variant is listed as a separate "model".

For example, under Mercedes-Benz, instead of having:
- C-Class (with generations: W202, W203, W204, W205, W206)
- E-Class (with generations: W210, W211, W212, W213, W214)

It currently has hundreds of entries like:
- "1993 Mercedes-Benz C"
- "1997 Mercedes-Benz C"
- "2000 Mercedes-Benz C"
- "1926 Mercedes-Benz 8/38"
- etc.

## Your Task

For each car brand in the attached JSON, analyze all the model names and:

1. **Identify proper model families** (e.g., "C-Class", "3 Series", "Mustang", "Civic")
2. **Group the messy entries** under their correct model family
3. **Keep historic/unique cars** that don't belong to a family as their own model

## Output Format

Return a JSON array with this structure:

\`\`\`json
[
  {
    "make": "BMW",
    "modelFamilies": [
      {
        "familyName": "3 Series",
        "familySlug": "3-series",
        "includesModels": ["1975 BMW 3", "1983 BMW 3", "BMW 3 Series", "2019 BMW 3", ...],
        "description": "BMW's compact executive car, produced since 1975"
      },
      {
        "familyName": "M3",
        "familySlug": "m3",
        "includesModels": ["BMW M3", "2007 BMW M3", ...],
        "description": "High-performance version of the 3 Series"
      }
    ],
    "standaloneModels": ["1936 BMW 326", "1956 BMW Isetta"]
  }
]
\`\`\`

## Rules

1. Use industry-standard model family names (C-Class not C, 3 Series not 3)
2. Performance variants (M3, AMG, RS) should be separate families if they're distinct product lines
3. SUVs/crossovers are their own families (X3, GLC, RAV4)
4. Historic cars that predate modern naming can stay as standalone
5. Generate slugs in lowercase with hyphens (c-class, 3-series, mustang)

## Data to Process

See the attached JSON file with all current models per brand.
`

  fs.writeFileSync('/tmp/gemini-prompt.md', geminiPrompt)
  console.log(`\nSaved Gemini prompt to /tmp/gemini-prompt.md`)

  console.log(`\n${'='.repeat(60)}`)
  console.log('NEXT STEPS:')
  console.log('='.repeat(60))
  console.log('\n1. Open Gemini (https://gemini.google.com/)')
  console.log('2. Upload /tmp/cars-for-gemini-simple.json')
  console.log('3. Paste the prompt from /tmp/gemini-prompt.md')
  console.log('4. Save Gemini\'s response as /tmp/gemini-organized.json')
  console.log('5. Run: npx tsx scripts/apply-gemini-reorganization.ts')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
