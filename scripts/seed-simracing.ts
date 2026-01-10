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

const games = [
  {
    name: 'Assetto Corsa Competizione',
    shortName: 'ACC',
    platform: ['PC', 'PlayStation', 'Xbox'],
    tracks: [
      { name: 'Spa-Francorchamps', country: 'Belgium', lengthMeters: 7004 },
      { name: 'Monza', country: 'Italy', lengthMeters: 5793 },
      { name: 'Nürburgring', configuration: 'GP', country: 'Germany', lengthMeters: 5148 },
      { name: 'Brands Hatch', configuration: 'GP', country: 'UK', lengthMeters: 3908 },
      { name: 'Silverstone', country: 'UK', lengthMeters: 5891 },
      { name: 'Barcelona', country: 'Spain', lengthMeters: 4655 },
      { name: 'Imola', country: 'Italy', lengthMeters: 4909 },
      { name: 'Zandvoort', country: 'Netherlands', lengthMeters: 4252 },
      { name: 'Hungaroring', country: 'Hungary', lengthMeters: 4381 },
      { name: 'Paul Ricard', country: 'France', lengthMeters: 5842 },
    ],
    cars: [
      { name: 'BMW M4 GT3', class: 'GT3' },
      { name: 'Porsche 911 GT3 R', class: 'GT3' },
      { name: 'Ferrari 296 GT3', class: 'GT3' },
      { name: 'Mercedes-AMG GT3', class: 'GT3' },
      { name: 'Audi R8 LMS GT3', class: 'GT3' },
      { name: 'Lamborghini Huracan GT3', class: 'GT3' },
      { name: 'McLaren 720S GT3', class: 'GT3' },
      { name: 'Aston Martin V8 Vantage GT3', class: 'GT3' },
    ],
  },
  {
    name: 'iRacing',
    shortName: 'iR',
    platform: ['PC'],
    tracks: [
      { name: 'Spa-Francorchamps', country: 'Belgium', lengthMeters: 7004 },
      { name: 'Nürburgring Nordschleife', country: 'Germany', lengthMeters: 20832 },
      { name: 'Daytona International Speedway', configuration: 'Road Course', country: 'USA', lengthMeters: 5729 },
      { name: 'Road Atlanta', country: 'USA', lengthMeters: 4088 },
      { name: 'Watkins Glen', country: 'USA', lengthMeters: 5472 },
      { name: 'Sebring', country: 'USA', lengthMeters: 6019 },
      { name: 'Laguna Seca', country: 'USA', lengthMeters: 3602 },
      { name: 'Suzuka', country: 'Japan', lengthMeters: 5807 },
    ],
    cars: [
      { name: 'BMW M4 GT3', class: 'GT3' },
      { name: 'Porsche 911 GT3 R', class: 'GT3' },
      { name: 'Ferrari 296 GT3', class: 'GT3' },
      { name: 'Mercedes-AMG GT3', class: 'GT3' },
      { name: 'Dallara P217', class: 'LMP2' },
      { name: 'Porsche 963 GTP', class: 'GTP' },
      { name: 'Cadillac V-Series.R GTP', class: 'GTP' },
    ],
  },
  {
    name: 'F1 24',
    shortName: 'F1',
    platform: ['PC', 'PlayStation', 'Xbox'],
    tracks: [
      { name: 'Monaco', country: 'Monaco', lengthMeters: 3337 },
      { name: 'Spa-Francorchamps', country: 'Belgium', lengthMeters: 7004 },
      { name: 'Monza', country: 'Italy', lengthMeters: 5793 },
      { name: 'Silverstone', country: 'UK', lengthMeters: 5891 },
      { name: 'Suzuka', country: 'Japan', lengthMeters: 5807 },
      { name: 'Singapore', country: 'Singapore', lengthMeters: 5063 },
      { name: 'Abu Dhabi', country: 'UAE', lengthMeters: 5281 },
      { name: 'Jeddah', country: 'Saudi Arabia', lengthMeters: 6174 },
    ],
    cars: [
      { name: 'Red Bull RB20', class: 'F1' },
      { name: 'Ferrari SF-24', class: 'F1' },
      { name: 'Mercedes W15', class: 'F1' },
      { name: 'McLaren MCL38', class: 'F1' },
      { name: 'Aston Martin AMR24', class: 'F1' },
    ],
  },
  {
    name: 'Gran Turismo 7',
    shortName: 'GT7',
    platform: ['PlayStation'],
    tracks: [
      { name: 'Nürburgring Nordschleife', country: 'Germany', lengthMeters: 20832 },
      { name: 'Spa-Francorchamps', country: 'Belgium', lengthMeters: 7004 },
      { name: 'Suzuka', country: 'Japan', lengthMeters: 5807 },
      { name: 'Laguna Seca', country: 'USA', lengthMeters: 3602 },
      { name: 'Deep Forest Raceway', country: 'Fictional', lengthMeters: 3199 },
      { name: 'Trial Mountain', country: 'Fictional', lengthMeters: 4678 },
    ],
    cars: [
      { name: 'Porsche 911 GT3 (992)', class: 'Road' },
      { name: 'Nissan GT-R NISMO', class: 'Road' },
      { name: 'Toyota GR Supra', class: 'Road' },
      { name: 'Mazda RX-7 Spirit R', class: 'Road' },
      { name: 'Toyota AE86', class: 'Classic' },
    ],
  },
  {
    name: 'Assetto Corsa',
    shortName: 'AC',
    platform: ['PC'],
    tracks: [
      { name: 'Nürburgring Nordschleife', country: 'Germany', lengthMeters: 20832 },
      { name: 'Spa-Francorchamps', country: 'Belgium', lengthMeters: 7004 },
      { name: 'Monza', country: 'Italy', lengthMeters: 5793 },
      { name: 'Brands Hatch', configuration: 'GP', country: 'UK', lengthMeters: 3908 },
      { name: 'Imola', country: 'Italy', lengthMeters: 4909 },
      { name: 'Mugello', country: 'Italy', lengthMeters: 5245 },
    ],
    cars: [
      { name: 'Ferrari 488 GT3', class: 'GT3' },
      { name: 'Porsche 911 GT3 R', class: 'GT3' },
      { name: 'BMW M3 E30', class: 'Classic' },
      { name: 'Alfa Romeo 33 Stradale', class: 'Classic' },
      { name: 'Lotus Exige S', class: 'Road' },
    ],
  },
]

async function seed() {
  console.log('Seeding sim racing data...')

  for (const gameData of games) {
    const slug = gameData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Upsert game
    const game = await prisma.simGame.upsert({
      where: { slug },
      create: {
        name: gameData.name,
        slug,
        shortName: gameData.shortName,
        platform: gameData.platform,
      },
      update: {
        shortName: gameData.shortName,
        platform: gameData.platform,
      },
    })

    console.log(`Created/updated game: ${game.name}`)

    // Upsert tracks
    for (const trackData of gameData.tracks) {
      const trackSlug = trackData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      await prisma.simTrack.upsert({
        where: { gameId_slug: { gameId: game.id, slug: trackSlug } },
        create: {
          name: trackData.name,
          slug: trackSlug,
          country: trackData.country,
          lengthMeters: trackData.lengthMeters,
          configuration: (trackData as any).configuration || null,
          gameId: game.id,
        },
        update: {
          country: trackData.country,
          lengthMeters: trackData.lengthMeters,
          configuration: (trackData as any).configuration || null,
        },
      })
    }
    console.log(`  Added ${gameData.tracks.length} tracks`)

    // Upsert cars
    for (const carData of gameData.cars) {
      await prisma.simCar.upsert({
        where: { gameId_name: { gameId: game.id, name: carData.name } },
        create: {
          name: carData.name,
          class: carData.class,
          gameId: game.id,
        },
        update: {
          class: carData.class,
        },
      })
    }
    console.log(`  Added ${gameData.cars.length} cars`)
  }

  console.log('Done!')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
