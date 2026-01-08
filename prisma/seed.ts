import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

// Import brand data from modular files
import {
  audiModels, audiGenerations,
  bmwModels, bmwGenerations,
  volkswagenModels, volkswagenGenerations,
  type GenerationData
} from './seed/brands'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const carMakes = [
  // Popular brands (will show first)
  { name: 'BMW', slug: 'bmw', country: 'Germany', isPopular: true },
  { name: 'Mercedes-Benz', slug: 'mercedes-benz', country: 'Germany', isPopular: true },
  { name: 'Audi', slug: 'audi', country: 'Germany', isPopular: true },
  { name: 'Volkswagen', slug: 'volkswagen', country: 'Germany', isPopular: true },
  { name: 'Toyota', slug: 'toyota', country: 'Japan', isPopular: true },
  { name: 'Honda', slug: 'honda', country: 'Japan', isPopular: true },
  { name: 'Nissan', slug: 'nissan', country: 'Japan', isPopular: true },
  { name: 'Ford', slug: 'ford', country: 'USA', isPopular: true },
  { name: 'Chevrolet', slug: 'chevrolet', country: 'USA', isPopular: true },
  { name: 'Porsche', slug: 'porsche', country: 'Germany', isPopular: true },

  // A
  { name: 'Acura', slug: 'acura', country: 'Japan' },
  { name: 'Alfa Romeo', slug: 'alfa-romeo', country: 'Italy' },
  { name: 'Aston Martin', slug: 'aston-martin', country: 'UK' },

  // B
  { name: 'Bentley', slug: 'bentley', country: 'UK' },
  { name: 'Buick', slug: 'buick', country: 'USA' },

  // C
  { name: 'Cadillac', slug: 'cadillac', country: 'USA' },
  { name: 'Chrysler', slug: 'chrysler', country: 'USA' },
  { name: 'Citroën', slug: 'citroen', country: 'France' },

  // D
  { name: 'Dacia', slug: 'dacia', country: 'Romania' },
  { name: 'Dodge', slug: 'dodge', country: 'USA' },

  // F
  { name: 'Ferrari', slug: 'ferrari', country: 'Italy' },
  { name: 'Fiat', slug: 'fiat', country: 'Italy' },

  // G
  { name: 'Genesis', slug: 'genesis', country: 'South Korea' },
  { name: 'GMC', slug: 'gmc', country: 'USA' },

  // H
  { name: 'Hyundai', slug: 'hyundai', country: 'South Korea' },

  // I
  { name: 'Infiniti', slug: 'infiniti', country: 'Japan' },

  // J
  { name: 'Jaguar', slug: 'jaguar', country: 'UK' },
  { name: 'Jeep', slug: 'jeep', country: 'USA' },

  // K
  { name: 'Kia', slug: 'kia', country: 'South Korea' },

  // L
  { name: 'Lamborghini', slug: 'lamborghini', country: 'Italy' },
  { name: 'Land Rover', slug: 'land-rover', country: 'UK' },
  { name: 'Lexus', slug: 'lexus', country: 'Japan' },
  { name: 'Lincoln', slug: 'lincoln', country: 'USA' },
  { name: 'Lotus', slug: 'lotus', country: 'UK' },

  // M
  { name: 'Maserati', slug: 'maserati', country: 'Italy' },
  { name: 'Mazda', slug: 'mazda', country: 'Japan' },
  { name: 'McLaren', slug: 'mclaren', country: 'UK' },
  { name: 'Mini', slug: 'mini', country: 'UK' },
  { name: 'Mitsubishi', slug: 'mitsubishi', country: 'Japan' },

  // O
  { name: 'Opel', slug: 'opel', country: 'Germany' },

  // P
  { name: 'Peugeot', slug: 'peugeot', country: 'France' },
  { name: 'Polestar', slug: 'polestar', country: 'Sweden' },

  // R
  { name: 'Ram', slug: 'ram', country: 'USA' },
  { name: 'Renault', slug: 'renault', country: 'France' },
  { name: 'Rolls-Royce', slug: 'rolls-royce', country: 'UK' },

  // S
  { name: 'Saab', slug: 'saab', country: 'Sweden' },
  { name: 'Seat', slug: 'seat', country: 'Spain' },
  { name: 'Škoda', slug: 'skoda', country: 'Czech Republic' },
  { name: 'Subaru', slug: 'subaru', country: 'Japan' },
  { name: 'Suzuki', slug: 'suzuki', country: 'Japan' },

  // T
  { name: 'Tesla', slug: 'tesla', country: 'USA' },

  // V
  { name: 'Volvo', slug: 'volvo', country: 'Sweden' },

  // Special/Tuning
  { name: 'Other', slug: 'other', country: null },
]

// Models for popular brands - sourced from brand files where available
const carModels: Record<string, string[]> = {
  'bmw': bmwModels,
  'mercedes-benz': ['A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'AMG GT', 'EQS', 'EQE'],
  'audi': audiModels,
  'volkswagen': volkswagenModels,
  'toyota': ['Corolla', 'Camry', 'Yaris', 'Supra', 'GR86', 'RAV4', 'Land Cruiser', 'Highlander', 'C-HR', 'Prius', 'bZ4X', 'Hilux', 'Tacoma', 'Tundra'],
  'honda': ['Civic', 'Accord', 'Jazz', 'CR-V', 'HR-V', 'Pilot', 'NSX', 'S2000', 'Integra', 'e', 'Civic Type R'],
  'nissan': ['GT-R', '370Z', 'Z', 'Skyline', 'Silvia', 'Qashqai', 'X-Trail', 'Juke', 'Leaf', 'Ariya', 'Patrol', 'Navara'],
  'ford': ['Mustang', 'Focus', 'Fiesta', 'Mondeo', 'Puma', 'Kuga', 'Explorer', 'Bronco', 'F-150', 'Ranger', 'GT', 'Mustang Mach-E'],
  'chevrolet': ['Camaro', 'Corvette', 'Silverado', 'Colorado', 'Tahoe', 'Suburban', 'Blazer', 'Equinox', 'Malibu', 'Bolt'],
  'porsche': ['911', '718 Cayman', '718 Boxster', 'Panamera', 'Cayenne', 'Macan', 'Taycan', '918 Spyder', 'Carrera GT'],
  'tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
  'subaru': ['Impreza', 'WRX', 'BRZ', 'Forester', 'Outback', 'XV', 'Legacy', 'Levorg'],
  'mazda': ['MX-5', 'RX-7', 'RX-8', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-90'],
}

// Helper to create slug from name
const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Combine generations from brand files - sourced from modular brand files
const carGenerations: Record<string, Record<string, GenerationData[]>> = {
  'audi': audiGenerations,
  'bmw': bmwGenerations,
  'volkswagen': volkswagenGenerations,
}

async function main() {
  console.log('Seeding car makes, models, generations, and engines...')

  for (const make of carMakes) {
    const createdMake = await prisma.carMake.upsert({
      where: { slug: make.slug },
      update: {},
      create: make,
    })

    console.log(`Created make: ${createdMake.name}`)

    // Add models if available
    const modelNames = carModels[make.slug]
    if (modelNames) {
      for (const modelName of modelNames) {
        const modelSlug = slugify(modelName)
        const createdModel = await prisma.carModel.upsert({
          where: {
            makeId_slug: {
              makeId: createdMake.id,
              slug: modelSlug,
            },
          },
          update: {},
          create: {
            name: modelName,
            slug: modelSlug,
            makeId: createdMake.id,
          },
        })

        // Add generations if available
        const generations = carGenerations[make.slug]?.[modelName]
        if (generations) {
          for (const gen of generations) {
            const createdGen = await prisma.carGeneration.upsert({
              where: {
                modelId_name: {
                  modelId: createdModel.id,
                  name: gen.name,
                },
              },
              update: {
                displayName: gen.displayName,
                startYear: gen.startYear,
                endYear: gen.endYear || null,
                bodyType: gen.bodyType || null,
              },
              create: {
                name: gen.name,
                displayName: gen.displayName,
                startYear: gen.startYear,
                endYear: gen.endYear || null,
                bodyType: gen.bodyType || null,
                modelId: createdModel.id,
              },
            })

            // Add engines for this generation
            for (const engine of gen.engines) {
              await prisma.engineConfig.upsert({
                where: {
                  id: `${createdGen.id}-${slugify(engine.name)}`,
                },
                update: {
                  displacement: engine.displacement || null,
                  fuelType: engine.fuelType,
                  horsepower: engine.horsepower || null,
                  torque: engine.torque || null,
                  transmission: engine.transmission || null,
                  drivetrain: engine.drivetrain || null,
                },
                create: {
                  id: `${createdGen.id}-${slugify(engine.name)}`,
                  name: engine.name,
                  displacement: engine.displacement || null,
                  fuelType: engine.fuelType,
                  horsepower: engine.horsepower || null,
                  torque: engine.torque || null,
                  transmission: engine.transmission || null,
                  drivetrain: engine.drivetrain || null,
                  generationId: createdGen.id,
                },
              })
            }
            console.log(`    Added generation ${gen.displayName} with ${gen.engines.length} engines`)
          }
        }
      }
      console.log(`  Added ${modelNames.length} models`)
    }
  }

  // Seed popular tracks
  console.log('Seeding tracks...')
  const tracks = [
    { name: 'Nürburgring Nordschleife', slug: 'nurburgring-nordschleife', country: 'Germany', lengthMeters: 20832 },
    { name: 'Spa-Francorchamps', slug: 'spa-francorchamps', country: 'Belgium', lengthMeters: 7004 },
    { name: 'Laguna Seca', slug: 'laguna-seca', country: 'USA', lengthMeters: 3602 },
    { name: 'Tsukuba Circuit', slug: 'tsukuba', country: 'Japan', lengthMeters: 2045 },
    { name: 'Hockenheimring', slug: 'hockenheim', country: 'Germany', lengthMeters: 4574 },
    { name: 'Brands Hatch (GP)', slug: 'brands-hatch-gp', country: 'UK', lengthMeters: 3908 },
    { name: 'Silverstone', slug: 'silverstone', country: 'UK', lengthMeters: 5891 },
    { name: 'Circuit de Barcelona-Catalunya', slug: 'barcelona', country: 'Spain', lengthMeters: 4655 },
    { name: 'Monza', slug: 'monza', country: 'Italy', lengthMeters: 5793 },
    { name: 'Zandvoort', slug: 'zandvoort', country: 'Netherlands', lengthMeters: 4259 },
  ]

  for (const track of tracks) {
    await prisma.track.upsert({
      where: { slug: track.slug },
      update: {},
      create: track,
    })
  }
  console.log(`Added ${tracks.length} tracks`)

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
