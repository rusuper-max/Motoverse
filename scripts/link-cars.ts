/**
 * Link existing cars to their generations and engine configs
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

async function main() {
  // Get all cars with full data
  const cars = await prisma.car.findMany({
    include: {
      owner: { select: { username: true } },
      generation: {
        include: {
          model: { include: { make: true } }
        }
      }
    }
  })

  console.log('Current cars:')
  for (const c of cars) {
    console.log(`\n- ${c.owner.username}'s car (id: ${c.id})`)
    console.log(`  Year: ${c.year}`)
    console.log(`  Make field: ${c.make || 'null'}`)
    console.log(`  Model field: ${c.model || 'null'}`)
    console.log(`  Nickname: ${c.nickname || 'null'}`)
    console.log(`  HP: ${c.horsepower}, Torque: ${c.torque}`)
    console.log(`  Engine: ${c.engine}`)
    console.log(`  GenerationId: ${c.generationId || 'NOT LINKED'}`)
    if (c.generation) {
      console.log(`  Generation: ${c.generation.model.make.name} ${c.generation.model.name} ${c.generation.displayName}`)
    }
  }

  // Get Audi TT 8J generation (2006-2014)
  const ttGen = await prisma.carGeneration.findFirst({
    where: {
      name: '8J',
      model: { name: 'TT', make: { name: 'Audi' } }
    },
    include: { engines: true }
  })

  // Get Suzuki Swift SF generation (1989-2004)
  const swiftGen = await prisma.carGeneration.findFirst({
    where: {
      name: 'SF',
      model: { name: 'Swift', make: { name: 'Suzuki' } }
    },
    include: { engines: true }
  })

  console.log('\n\nAvailable generations:')
  if (ttGen) {
    console.log(`\nAudi TT ${ttGen.displayName}:`)
    ttGen.engines.forEach(e => console.log(`  - ${e.name}: ${e.horsepower}HP, ${e.torque}Nm`))
  }
  if (swiftGen) {
    console.log(`\nSuzuki Swift ${swiftGen.displayName}:`)
    swiftGen.engines.forEach(e => console.log(`  - ${e.name}: ${e.horsepower}HP, ${e.torque}Nm`))
  }

  // Now link based on owner username and specs
  for (const car of cars) {
    // Janker's Swift - 101HP, 118Nm, 1994
    if (car.owner.username === 'janker' && car.horsepower === 101) {
      if (swiftGen) {
        const engine = swiftGen.engines.find(e => e.horsepower === 101 && e.torque === 118)
        await prisma.car.update({
          where: { id: car.id },
          data: {
            make: 'Suzuki',
            model: 'Swift',
            generationId: swiftGen.id,
            engineConfigId: engine?.id || null
          }
        })
        console.log(`\n✅ Linked janker's car to Suzuki Swift ${swiftGen.displayName} with ${engine?.name || 'no engine'}`)
      }
    }

    // Profactor's TT - 360HP, 480Nm, 2014
    if (car.owner.username === 'profactor') {
      if (ttGen) {
        // 360HP is tuned, closest stock is TT RS 340HP or TTS 272HP
        // Since it's 2.0 TFSI with 360HP, it's likely a tuned TTS (2.0 TFSI Quattro)
        const engine = ttGen.engines.find(e => e.name.includes('TTS'))
        await prisma.car.update({
          where: { id: car.id },
          data: {
            make: 'Audi',
            model: 'TT',
            generationId: ttGen.id,
            engineConfigId: engine?.id || null
          }
        })
        console.log(`\n✅ Linked profactor's car to Audi TT ${ttGen.displayName} with ${engine?.name || 'no engine'}`)
      }
    }
  }

  console.log('\n✅ Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
