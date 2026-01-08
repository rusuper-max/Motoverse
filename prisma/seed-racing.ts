import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Racing Calendar 2026 (approximate dates)
const racingEvents = {
    f1: [
        { title: 'F1 Bahrain Grand Prix', date: '2026-03-15', location: 'Bahrain International Circuit', city: 'Sakhir', country: 'Bahrain' },
        { title: 'F1 Saudi Arabian Grand Prix', date: '2026-03-22', location: 'Jeddah Corniche Circuit', city: 'Jeddah', country: 'Saudi Arabia' },
        { title: 'F1 Australian Grand Prix', date: '2026-04-05', location: 'Albert Park Circuit', city: 'Melbourne', country: 'Australia' },
        { title: 'F1 Japanese Grand Prix', date: '2026-04-12', location: 'Suzuka Circuit', city: 'Suzuka', country: 'Japan' },
        { title: 'F1 Chinese Grand Prix', date: '2026-04-19', location: 'Shanghai International Circuit', city: 'Shanghai', country: 'China' },
        { title: 'F1 Miami Grand Prix', date: '2026-05-03', location: 'Miami International Autodrome', city: 'Miami', country: 'USA' },
        { title: 'F1 Emilia Romagna Grand Prix', date: '2026-05-17', location: 'Autodromo Enzo e Dino Ferrari', city: 'Imola', country: 'Italy' },
        { title: 'F1 Monaco Grand Prix', date: '2026-05-24', location: 'Circuit de Monaco', city: 'Monte Carlo', country: 'Monaco' },
        { title: 'F1 Spanish Grand Prix', date: '2026-06-07', location: 'Circuit de Barcelona-Catalunya', city: 'Barcelona', country: 'Spain' },
        { title: 'F1 Canadian Grand Prix', date: '2026-06-14', location: 'Circuit Gilles Villeneuve', city: 'Montreal', country: 'Canada' },
        { title: 'F1 Austrian Grand Prix', date: '2026-06-28', location: 'Red Bull Ring', city: 'Spielberg', country: 'Austria' },
        { title: 'F1 British Grand Prix', date: '2026-07-05', location: 'Silverstone Circuit', city: 'Silverstone', country: 'UK' },
        { title: 'F1 Hungarian Grand Prix', date: '2026-07-19', location: 'Hungaroring', city: 'Budapest', country: 'Hungary' },
        { title: 'F1 Belgian Grand Prix', date: '2026-07-26', location: 'Circuit de Spa-Francorchamps', city: 'Spa', country: 'Belgium' },
        { title: 'F1 Dutch Grand Prix', date: '2026-08-30', location: 'Circuit Zandvoort', city: 'Zandvoort', country: 'Netherlands' },
        { title: 'F1 Italian Grand Prix', date: '2026-09-06', location: 'Autodromo Nazionale Monza', city: 'Monza', country: 'Italy' },
        { title: 'F1 Azerbaijan Grand Prix', date: '2026-09-20', location: 'Baku City Circuit', city: 'Baku', country: 'Azerbaijan' },
        { title: 'F1 Singapore Grand Prix', date: '2026-10-04', location: 'Marina Bay Street Circuit', city: 'Singapore', country: 'Singapore' },
        { title: 'F1 United States Grand Prix', date: '2026-10-18', location: 'Circuit of the Americas', city: 'Austin', country: 'USA' },
        { title: 'F1 Mexico City Grand Prix', date: '2026-10-25', location: 'Autódromo Hermanos Rodríguez', city: 'Mexico City', country: 'Mexico' },
        { title: 'F1 São Paulo Grand Prix', date: '2026-11-08', location: 'Autódromo José Carlos Pace', city: 'São Paulo', country: 'Brazil' },
        { title: 'F1 Las Vegas Grand Prix', date: '2026-11-22', location: 'Las Vegas Street Circuit', city: 'Las Vegas', country: 'USA' },
        { title: 'F1 Qatar Grand Prix', date: '2026-11-29', location: 'Lusail International Circuit', city: 'Lusail', country: 'Qatar' },
        { title: 'F1 Abu Dhabi Grand Prix', date: '2026-12-06', location: 'Yas Marina Circuit', city: 'Abu Dhabi', country: 'UAE' },
    ],
    wrc: [
        { title: 'WRC Rallye Monte-Carlo', date: '2026-01-22', location: 'Monaco & French Alps', city: 'Monte Carlo', country: 'Monaco' },
        { title: 'WRC Rally Sweden', date: '2026-02-12', location: 'Umeå', city: 'Umeå', country: 'Sweden' },
        { title: 'WRC Safari Rally Kenya', date: '2026-03-19', location: 'Naivasha', city: 'Naivasha', country: 'Kenya' },
        { title: 'WRC Croatia Rally', date: '2026-04-23', location: 'Zagreb Region', city: 'Zagreb', country: 'Croatia' },
        { title: 'WRC Rally Portugal', date: '2026-05-14', location: 'Porto Region', city: 'Porto', country: 'Portugal' },
        { title: 'WRC Rally Italia Sardegna', date: '2026-06-04', location: 'Sardinia', city: 'Alghero', country: 'Italy' },
        { title: 'WRC Rally Poland', date: '2026-06-25', location: 'Mikołajki', city: 'Mikołajki', country: 'Poland' },
        { title: 'WRC Rally Finland', date: '2026-07-30', location: 'Jyväskylä', city: 'Jyväskylä', country: 'Finland' },
        { title: 'WRC Acropolis Rally Greece', date: '2026-09-03', location: 'Lamia', city: 'Lamia', country: 'Greece' },
        { title: 'WRC Rally Chile', date: '2026-09-24', location: 'Concepción', city: 'Concepción', country: 'Chile' },
        { title: 'WRC Central European Rally', date: '2026-10-15', location: 'Germany/Austria/Czech', city: 'Passau', country: 'Germany' },
        { title: 'WRC Rally Japan', date: '2026-11-19', location: 'Aichi Prefecture', city: 'Toyota City', country: 'Japan' },
    ],
    gt3: [
        { title: 'GT World Challenge Europe - Monza', date: '2026-04-11', location: 'Autodromo Nazionale Monza', city: 'Monza', country: 'Italy' },
        { title: 'GT World Challenge Europe - Brands Hatch', date: '2026-05-02', location: 'Brands Hatch Circuit', city: 'Kent', country: 'UK' },
        { title: 'GT World Challenge Europe - Paul Ricard', date: '2026-05-30', location: 'Circuit Paul Ricard', city: 'Le Castellet', country: 'France' },
        { title: 'GT World Challenge Europe - Zandvoort', date: '2026-06-20', location: 'Circuit Zandvoort', city: 'Zandvoort', country: 'Netherlands' },
        { title: '24 Hours of Spa', date: '2026-07-25', location: 'Circuit de Spa-Francorchamps', city: 'Spa', country: 'Belgium' },
        { title: 'GT World Challenge Europe - Nürburgring', date: '2026-08-29', location: 'Nürburgring', city: 'Nürburg', country: 'Germany' },
        { title: 'GT World Challenge Europe - Barcelona', date: '2026-09-26', location: 'Circuit de Barcelona-Catalunya', city: 'Barcelona', country: 'Spain' },
        { title: '24 Hours of Nürburgring', date: '2026-05-28', location: 'Nürburgring Nordschleife', city: 'Nürburg', country: 'Germany' },
        { title: 'Bathurst 12 Hour', date: '2026-02-01', location: 'Mount Panorama Circuit', city: 'Bathurst', country: 'Australia' },
    ],
}

async function seedRacingEvents() {
    console.log('Seeding racing events...')

    // Create a system user for official events
    let systemUser = await prisma.user.findUnique({
        where: { username: 'motoverse' },
    })

    if (!systemUser) {
        systemUser = await prisma.user.create({
            data: {
                email: 'system@motoverse.app',
                username: 'motoverse',
                passwordHash: 'system-account-no-login',
                name: 'Motoverse Official',
                bio: 'Official racing calendar events',
            },
        })
        console.log('Created system user: motoverse')
    }

    // Seed F1 races
    console.log('Adding F1 races...')
    for (const race of racingEvents.f1) {
        await prisma.event.upsert({
            where: {
                id: `f1-${race.date}`,
            },
            update: {},
            create: {
                id: `f1-${race.date}`,
                title: race.title,
                description: `Watch the ${race.title} live! Join the Motoverse community to discuss the race.`,
                type: 'watching',
                location: race.location,
                city: race.city,
                country: race.country,
                date: new Date(race.date + 'T14:00:00Z'),
                coverImage: 'https://images.unsplash.com/photo-1504707748692-419802f44579?w=800',
                organizerId: systemUser.id,
                isPublic: true,
            },
        })
    }
    console.log(`Added ${racingEvents.f1.length} F1 races`)

    // Seed WRC rallies
    console.log('Adding WRC rallies...')
    for (const race of racingEvents.wrc) {
        await prisma.event.upsert({
            where: {
                id: `wrc-${race.date}`,
            },
            update: {},
            create: {
                id: `wrc-${race.date}`,
                title: race.title,
                description: `Follow the ${race.title}! Rally fans, unite!`,
                type: 'watching',
                location: race.location,
                city: race.city,
                country: race.country,
                date: new Date(race.date + 'T08:00:00Z'),
                coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
                organizerId: systemUser.id,
                isPublic: true,
            },
        })
    }
    console.log(`Added ${racingEvents.wrc.length} WRC rallies`)

    // Seed GT3 races
    console.log('Adding GT3 races...')
    for (const race of racingEvents.gt3) {
        await prisma.event.upsert({
            where: {
                id: `gt3-${race.date}`,
            },
            update: {},
            create: {
                id: `gt3-${race.date}`,
                title: race.title,
                description: `GT3 action at ${race.location}!`,
                type: 'watching',
                location: race.location,
                city: race.city,
                country: race.country,
                date: new Date(race.date + 'T13:00:00Z'),
                coverImage: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800',
                organizerId: systemUser.id,
                isPublic: true,
            },
        })
    }
    console.log(`Added ${racingEvents.gt3.length} GT3 races`)

    console.log('Racing calendar seeded!')
}

seedRacingEvents()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
