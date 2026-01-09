/**
 * Cleanup script to delete all imported car database data
 * This removes CarMake, CarModel, CarGeneration, EngineConfig
 * User cars (Car model) are preserved but their generationId and engineConfigId are set to null
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function cleanup() {
  console.log('🧹 Starting cleanup of imported car database...\n')

  // First, get counts to show what will be deleted
  const [makeCount, modelCount, generationCount, engineCount, carCount] = await Promise.all([
    prisma.carMake.count(),
    prisma.carModel.count(),
    prisma.carGeneration.count(),
    prisma.engineConfig.count(),
    prisma.car.count(),
  ])

  console.log('Current database state:')
  console.log(`  - CarMake: ${makeCount}`)
  console.log(`  - CarModel: ${modelCount}`)
  console.log(`  - CarGeneration: ${generationCount}`)
  console.log(`  - EngineConfig: ${engineCount}`)
  console.log(`  - User Cars: ${carCount}`)
  console.log('')

  // Check which user cars have references to generations/engines
  const carsWithGeneration = await prisma.car.count({
    where: { generationId: { not: null } }
  })
  const carsWithEngine = await prisma.car.count({
    where: { engineConfigId: { not: null } }
  })

  console.log(`User cars with generationId: ${carsWithGeneration}`)
  console.log(`User cars with engineConfigId: ${carsWithEngine}`)
  console.log('')

  // Step 1: Unlink user cars from generations and engines
  if (carsWithGeneration > 0 || carsWithEngine > 0) {
    console.log('📝 Unlinking user cars from imported data...')
    await prisma.car.updateMany({
      where: {
        OR: [
          { generationId: { not: null } },
          { engineConfigId: { not: null } }
        ]
      },
      data: {
        generationId: null,
        engineConfigId: null
      }
    })
    console.log('✅ User cars unlinked\n')
  }

  // Step 2: Delete in reverse order of dependencies
  console.log('🗑️  Deleting EngineConfig...')
  const deletedEngines = await prisma.engineConfig.deleteMany()
  console.log(`   Deleted ${deletedEngines.count} engine configs`)

  console.log('🗑️  Deleting CarGeneration...')
  const deletedGenerations = await prisma.carGeneration.deleteMany()
  console.log(`   Deleted ${deletedGenerations.count} generations`)

  console.log('🗑️  Deleting CarModel...')
  const deletedModels = await prisma.carModel.deleteMany()
  console.log(`   Deleted ${deletedModels.count} models`)

  console.log('🗑️  Deleting CarMake...')
  const deletedMakes = await prisma.carMake.deleteMany()
  console.log(`   Deleted ${deletedMakes.count} makes`)

  console.log('\n✅ Cleanup complete!')
  console.log(`\nDeleted:`)
  console.log(`  - ${deletedMakes.count} makes`)
  console.log(`  - ${deletedModels.count} models`)
  console.log(`  - ${deletedGenerations.count} generations`)
  console.log(`  - ${deletedEngines.count} engine configs`)
  console.log(`\nUser cars preserved: ${carCount}`)
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
