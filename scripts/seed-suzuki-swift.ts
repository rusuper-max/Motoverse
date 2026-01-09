/**
 * Seed Suzuki Swift generations and engine configurations
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

// Suzuki Swift Generations with engine options
const SUZUKI_SWIFT_DATA = {
  make: 'Suzuki',
  model: 'Swift',
  generations: [
    {
      name: 'SA310',
      displayName: 'SA310 (1983-1989)',
      startYear: 1983,
      endYear: 1989,
      bodyType: 'hatchback',
      engines: [
        {
          name: '1.0L G10',
          displacement: '1.0L',
          fuelType: 'Petrol',
          horsepower: 48,
          torque: 74,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.3L G13A',
          displacement: '1.3L',
          fuelType: 'Petrol',
          horsepower: 67,
          torque: 103,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
      ],
    },
    {
      name: 'SF',
      displayName: 'SF (1989-2004)',
      startYear: 1989,
      endYear: 2004,
      bodyType: 'hatchback',
      engines: [
        {
          name: '1.0L G10',
          displacement: '1.0L',
          fuelType: 'Petrol',
          horsepower: 53,
          torque: 79,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.3L G13B',
          displacement: '1.3L',
          fuelType: 'Petrol',
          horsepower: 68,
          torque: 105,
          transmission: 'Manual 5-speed / Auto 3-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.3L G13B GTi',
          displacement: '1.3L',
          fuelType: 'Petrol',
          horsepower: 101,
          torque: 118,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.6L G16B GTi',
          displacement: '1.6L',
          fuelType: 'Petrol',
          horsepower: 115,
          torque: 138,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
      ],
    },
    {
      name: 'RS',
      displayName: 'RS/MZ (2004-2010)',
      startYear: 2004,
      endYear: 2010,
      bodyType: 'hatchback',
      engines: [
        {
          name: '1.3L M13A',
          displacement: '1.3L',
          fuelType: 'Petrol',
          horsepower: 92,
          torque: 118,
          transmission: 'Manual 5-speed / Auto CVT',
          drivetrain: 'FWD',
        },
        {
          name: '1.5L M15A',
          displacement: '1.5L',
          fuelType: 'Petrol',
          horsepower: 102,
          torque: 133,
          transmission: 'Manual 5-speed / Auto 4-speed',
          drivetrain: 'FWD / 4WD',
        },
        {
          name: '1.6L M16A Sport',
          displacement: '1.6L',
          fuelType: 'Petrol',
          horsepower: 125,
          torque: 148,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.3L DDiS',
          displacement: '1.3L',
          fuelType: 'Diesel',
          horsepower: 75,
          torque: 190,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
      ],
    },
    {
      name: 'FZ',
      displayName: 'FZ/NZ (2010-2017)',
      startYear: 2010,
      endYear: 2017,
      bodyType: 'hatchback',
      engines: [
        {
          name: '1.2L K12B',
          displacement: '1.2L',
          fuelType: 'Petrol',
          horsepower: 94,
          torque: 118,
          transmission: 'Manual 5-speed / Auto CVT',
          drivetrain: 'FWD',
        },
        {
          name: '1.2L K12B DualJet',
          displacement: '1.2L',
          fuelType: 'Petrol',
          horsepower: 90,
          torque: 120,
          transmission: 'Manual 5-speed / Auto CVT',
          drivetrain: 'FWD / 4WD',
        },
        {
          name: '1.4L K14B',
          displacement: '1.4L',
          fuelType: 'Petrol',
          horsepower: 95,
          torque: 130,
          transmission: 'Manual 5-speed / Auto 4-speed',
          drivetrain: 'FWD',
        },
        {
          name: '1.6L M16A Sport',
          displacement: '1.6L',
          fuelType: 'Petrol',
          horsepower: 136,
          torque: 160,
          transmission: 'Manual 6-speed / Auto CVT',
          drivetrain: 'FWD',
        },
        {
          name: '1.3L DDiS',
          displacement: '1.3L',
          fuelType: 'Diesel',
          horsepower: 75,
          torque: 190,
          transmission: 'Manual 5-speed',
          drivetrain: 'FWD',
        },
      ],
    },
    {
      name: 'AZ',
      displayName: 'AZ (2017-present)',
      startYear: 2017,
      endYear: null,
      bodyType: 'hatchback',
      engines: [
        {
          name: '1.0L K10C Boosterjet',
          displacement: '1.0L',
          fuelType: 'Petrol',
          horsepower: 111,
          torque: 170,
          transmission: 'Manual 6-speed / Auto 6-speed',
          drivetrain: 'FWD / 4WD',
        },
        {
          name: '1.2L K12C DualJet',
          displacement: '1.2L',
          fuelType: 'Petrol',
          horsepower: 83,
          torque: 107,
          transmission: 'Manual 5-speed / Auto CVT',
          drivetrain: 'FWD',
        },
        {
          name: '1.2L K12C Hybrid',
          displacement: '1.2L',
          fuelType: 'Hybrid',
          horsepower: 83,
          torque: 107,
          transmission: 'Auto CVT',
          drivetrain: 'FWD / 4WD',
        },
        {
          name: '1.4L K14C Boosterjet Sport',
          displacement: '1.4L',
          fuelType: 'Petrol',
          horsepower: 140,
          torque: 230,
          transmission: 'Manual 6-speed / Auto 6-speed',
          drivetrain: 'FWD',
        },
      ],
    },
  ],
}

async function seed() {
  console.log('🚗 Seeding Suzuki Swift generations and engines...\n')

  // Find or create Suzuki make
  let make = await prisma.carMake.findFirst({
    where: { name: SUZUKI_SWIFT_DATA.make },
  })

  if (!make) {
    make = await prisma.carMake.create({
      data: {
        name: SUZUKI_SWIFT_DATA.make,
        slug: 'suzuki',
        country: 'Japan',
        isPopular: true,
      },
    })
    console.log(`✅ Created make: ${SUZUKI_SWIFT_DATA.make}`)
  } else {
    console.log(`✅ Found make: ${SUZUKI_SWIFT_DATA.make}`)
  }

  // Find or create Swift model
  let model = await prisma.carModel.findFirst({
    where: {
      makeId: make.id,
      name: SUZUKI_SWIFT_DATA.model,
    },
  })

  if (!model) {
    model = await prisma.carModel.create({
      data: {
        name: SUZUKI_SWIFT_DATA.model,
        slug: 'swift',
        makeId: make.id,
      },
    })
    console.log(`✅ Created model: ${SUZUKI_SWIFT_DATA.model}`)
  } else {
    console.log(`✅ Found model: ${SUZUKI_SWIFT_DATA.model}`)
  }

  // Create generations with engines
  let gensCreated = 0
  let enginesCreated = 0

  for (const genData of SUZUKI_SWIFT_DATA.generations) {
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

  // Show Swift summary
  const swiftModel = await prisma.carModel.findFirst({
    where: { makeId: make.id, name: 'Swift' },
    include: {
      generations: {
        include: {
          _count: { select: { engines: true } },
        },
      },
    },
  })

  if (swiftModel) {
    console.log(`\n📊 Suzuki Swift now has:`)
    for (const gen of swiftModel.generations) {
      console.log(`   ${gen.displayName || gen.name}: ${gen._count.engines} engines`)
    }
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
