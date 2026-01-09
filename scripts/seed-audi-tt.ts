/**
 * Seed Audi TT generations and engine configurations
 * This is an example of detailed car data with generations and engines
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

// Audi TT Generations with engine options
const AUDI_TT_DATA = {
  make: 'Audi',
  model: 'TT',
  generations: [
    {
      name: '8N',
      displayName: '8N (1998-2006)',
      startYear: 1998,
      endYear: 2006,
      bodyType: 'coupe',
      engines: [
        {
          name: '1.8T 150',
          displacement: '1.8L',
          fuelType: 'Petrol',
          horsepower: 150,
          torque: 210,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.8T 180',
          displacement: '1.8L',
          fuelType: 'Petrol',
          horsepower: 180,
          torque: 235,
          transmission: 'Manual 5-speed / Auto 5-speed',
          drivetrain: 'FWD / Quattro',
        },
        {
          name: '1.8T 225 Quattro',
          displacement: '1.8L',
          fuelType: 'Petrol',
          horsepower: 225,
          torque: 280,
          transmission: 'Manual 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: '3.2 V6 Quattro',
          displacement: '3.2L',
          fuelType: 'Petrol',
          horsepower: 250,
          torque: 320,
          transmission: 'S tronic 6-speed',
          drivetrain: 'Quattro',
        },
      ],
    },
    {
      name: '8J',
      displayName: '8J (2006-2014)',
      startYear: 2006,
      endYear: 2014,
      bodyType: 'coupe',
      engines: [
        {
          name: '1.8 TFSI',
          displacement: '1.8L',
          fuelType: 'Petrol',
          horsepower: 160,
          torque: 250,
          transmission: 'Manual 6-speed / S tronic 7-speed',
          drivetrain: 'FWD',
        },
        {
          name: '2.0 TFSI',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 200,
          torque: 280,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'FWD / Quattro',
        },
        {
          name: '2.0 TFSI Quattro',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 211,
          torque: 350,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: '3.2 V6 Quattro',
          displacement: '3.2L',
          fuelType: 'Petrol',
          horsepower: 250,
          torque: 320,
          transmission: 'S tronic 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: 'TTS 2.0 TFSI Quattro',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 272,
          torque: 350,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: 'TT RS 2.5 TFSI Quattro',
          displacement: '2.5L',
          fuelType: 'Petrol',
          horsepower: 340,
          torque: 450,
          transmission: 'Manual 6-speed / S tronic 7-speed',
          drivetrain: 'Quattro',
        },
        {
          name: '2.0 TDI',
          displacement: '2.0L',
          fuelType: 'Diesel',
          horsepower: 170,
          torque: 350,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'FWD / Quattro',
        },
      ],
    },
    {
      name: '8S',
      displayName: '8S (2014-2024)',
      startYear: 2014,
      endYear: 2024,
      bodyType: 'coupe',
      engines: [
        {
          name: '1.8 TFSI',
          displacement: '1.8L',
          fuelType: 'Petrol',
          horsepower: 180,
          torque: 250,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'FWD',
        },
        {
          name: '2.0 TFSI',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 197,
          torque: 320,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'FWD',
        },
        {
          name: '2.0 TFSI Quattro',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 230,
          torque: 370,
          transmission: 'S tronic 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: '2.0 TFSI 45 Quattro',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 245,
          torque: 370,
          transmission: 'S tronic 7-speed',
          drivetrain: 'Quattro',
        },
        {
          name: 'TTS 2.0 TFSI Quattro',
          displacement: '2.0L',
          fuelType: 'Petrol',
          horsepower: 306,
          torque: 400,
          transmission: 'S tronic 6-speed',
          drivetrain: 'Quattro',
        },
        {
          name: 'TT RS 2.5 TFSI Quattro',
          displacement: '2.5L',
          fuelType: 'Petrol',
          horsepower: 400,
          torque: 480,
          transmission: 'S tronic 7-speed',
          drivetrain: 'Quattro',
        },
        {
          name: '2.0 TDI',
          displacement: '2.0L',
          fuelType: 'Diesel',
          horsepower: 184,
          torque: 380,
          transmission: 'Manual 6-speed / S tronic 6-speed',
          drivetrain: 'FWD / Quattro',
        },
      ],
    },
  ],
}

async function seed() {
  console.log('🚗 Seeding Audi TT generations and engines...\n')

  // Find or create Audi make
  let make = await prisma.carMake.findFirst({
    where: { name: AUDI_TT_DATA.make },
  })

  if (!make) {
    make = await prisma.carMake.create({
      data: {
        name: AUDI_TT_DATA.make,
        slug: 'audi',
        isPopular: true,
      },
    })
    console.log(`✅ Created make: ${AUDI_TT_DATA.make}`)
  } else {
    console.log(`✅ Found make: ${AUDI_TT_DATA.make}`)
  }

  // Find or create TT model
  let model = await prisma.carModel.findFirst({
    where: {
      makeId: make.id,
      name: AUDI_TT_DATA.model,
    },
  })

  if (!model) {
    model = await prisma.carModel.create({
      data: {
        name: AUDI_TT_DATA.model,
        slug: 'tt',
        makeId: make.id,
      },
    })
    console.log(`✅ Created model: ${AUDI_TT_DATA.model}`)
  } else {
    console.log(`✅ Found model: ${AUDI_TT_DATA.model}`)
  }

  // Create generations with engines
  let gensCreated = 0
  let enginesCreated = 0

  for (const genData of AUDI_TT_DATA.generations) {
    // Check if generation exists
    let generation = await prisma.carGeneration.findFirst({
      where: {
        modelId: model.id,
        name: genData.name,
      },
    })

    if (!generation) {
      generation = await prisma.carGeneration.create({
        data: {
          name: genData.name,
          displayName: genData.displayName,
          startYear: genData.startYear,
          endYear: genData.endYear,
          bodyType: genData.bodyType,
          modelId: model.id,
        },
      })
      console.log(`  ✅ Created generation: ${genData.displayName}`)
      gensCreated++
    } else {
      console.log(`  ⏭️  Generation exists: ${genData.displayName}`)
    }

    // Create engines for this generation
    for (const engineData of genData.engines) {
      const existingEngine = await prisma.engineConfig.findFirst({
        where: {
          generationId: generation.id,
          name: engineData.name,
        },
      })

      if (!existingEngine) {
        await prisma.engineConfig.create({
          data: {
            name: engineData.name,
            displacement: engineData.displacement,
            fuelType: engineData.fuelType,
            horsepower: engineData.horsepower,
            torque: engineData.torque,
            transmission: engineData.transmission,
            drivetrain: engineData.drivetrain,
            generationId: generation.id,
          },
        })
        enginesCreated++
      }
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Created ${gensCreated} generations`)
  console.log(`   Created ${enginesCreated} engine configurations`)

  // Show TT summary
  const ttModel = await prisma.carModel.findFirst({
    where: { makeId: make.id, name: 'TT' },
    include: {
      generations: {
        include: {
          _count: { select: { engines: true } },
        },
      },
    },
  })

  if (ttModel) {
    console.log(`\n📊 Audi TT now has:`)
    for (const gen of ttModel.generations) {
      console.log(`   ${gen.displayName || gen.name}: ${gen._count.engines} engines`)
    }
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
