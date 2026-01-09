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

async function seedPeugeot() {
    console.log('🚗 Seeding Peugeot data...')

    // Cleanup: Delete incorrect separate models that should be merged
    const badModels = ['208 GTi', '308 GTi', '508 PSE', 'RCZ R', '2008 DKR', '3008 DKR']
    const badSlugs = badModels.map(name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))

    await prisma.carModel.deleteMany({
        where: {
            OR: [
                { name: { in: badModels } },
                { slug: { in: badSlugs } }
            ]
        }
    })
    console.log(`🧹 Cleaned up ${badModels.length} redundant models`)

    // Get or create Peugeot make
    const peugeot = await prisma.carMake.upsert({
        where: { slug: 'peugeot' },
        update: {},
        create: {
            name: 'Peugeot',
            slug: 'peugeot',
            country: 'France',
            logo: null,
            isPopular: false,
        },
    })

    console.log('✅ Make: Peugeot')

    // Define models with bodyTypes
    const models = [
        {
            name: '208',
            slug: '208',
            generations: [
                {
                    name: 'A9',
                    displayName: 'Mk1 (2012-2019)',
                    startYear: 2012,
                    endYear: 2019,
                    bodyType: 'hatchback',
                    engines: [
                        { name: '1.0 VTi 68hp', fuelType: 'Petrol', horsepower: 68, torque: 95 },
                        { name: '1.2 VTi 82hp', fuelType: 'Petrol', horsepower: 82, torque: 118 },
                        { name: '1.2 PureTech 82hp', fuelType: 'Petrol', horsepower: 82, torque: 118 },
                        { name: '1.2 PureTech Turbo 110hp', fuelType: 'Petrol', horsepower: 110, torque: 205 },
                        { name: '1.6 THP 156hp', fuelType: 'Petrol', horsepower: 156, torque: 240 },
                        { name: '1.6 THP GTi 200hp', fuelType: 'Petrol', horsepower: 200, torque: 275 },
                        { name: '1.6 THP GTi 30th 208hp', fuelType: 'Petrol', horsepower: 208, torque: 300 },
                        { name: '1.4 HDi 68hp', fuelType: 'Diesel', horsepower: 68, torque: 160 },
                        { name: '1.6 HDi 92hp', fuelType: 'Diesel', horsepower: 92, torque: 230 },
                        { name: '1.6 BlueHDi 100hp', fuelType: 'Diesel', horsepower: 100, torque: 254 },
                    ],
                },
                {
                    name: 'P21',
                    displayName: 'Mk2 (2019-Present)',
                    startYear: 2019,
                    endYear: null,
                    bodyType: 'hatchback',
                    engines: [
                        { name: '1.2 PureTech 75hp', fuelType: 'Petrol', horsepower: 75, torque: 118 },
                        { name: '1.2 PureTech 100hp', fuelType: 'Petrol', horsepower: 100, torque: 205 },
                        { name: '1.2 PureTech 130hp GT', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.5 BlueHDi 100hp', fuelType: 'Diesel', horsepower: 100, torque: 250 },
                        { name: 'e-208 Electric 136hp', fuelType: 'Electric', horsepower: 136, torque: 260 },
                        { name: 'e-208 Electric GT 156hp', fuelType: 'Electric', horsepower: 156, torque: 260 },
                    ],
                },
            ],
        },
        {
            name: '308',
            slug: '308',
            generations: [
                {
                    name: 'T7',
                    displayName: 'Mk1 (2007-2014)',
                    startYear: 2007,
                    endYear: 2014,
                    bodyType: 'hatchback',
                    engines: [
                        { name: '1.4 VTi 98hp', fuelType: 'Petrol', horsepower: 98, torque: 127 },
                        { name: '1.6 VTi 120hp', fuelType: 'Petrol', horsepower: 120, torque: 160 },
                        { name: '1.6 THP 150hp', fuelType: 'Petrol', horsepower: 150, torque: 240 },
                        { name: '1.6 THP GTi 200hp', fuelType: 'Petrol', horsepower: 200, torque: 275 },
                        { name: '1.6 HDi 92hp', fuelType: 'Diesel', horsepower: 92, torque: 230 },
                        { name: '2.0 HDi 150hp', fuelType: 'Diesel', horsepower: 150, torque: 340 },
                    ],
                },
                {
                    name: 'T9',
                    displayName: 'Mk2 (2014-2021)',
                    startYear: 2014,
                    endYear: 2021,
                    bodyType: 'hatchback',
                    engines: [
                        { name: '1.2 PureTech 110hp', fuelType: 'Petrol', horsepower: 110, torque: 205 },
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.6 THP 205hp', fuelType: 'Petrol', horsepower: 205, torque: 285 },
                        { name: '1.6 THP GTi 250hp', fuelType: 'Petrol', horsepower: 250, torque: 330 },
                        { name: '1.6 THP GTi 270hp', fuelType: 'Petrol', horsepower: 270, torque: 330 },
                        { name: '1.5 BlueHDi 130hp', fuelType: 'Diesel', horsepower: 130, torque: 300 },
                        { name: '2.0 BlueHDi 180hp', fuelType: 'Diesel', horsepower: 180, torque: 400 },
                    ],
                },
                {
                    name: 'P51',
                    displayName: 'Mk3 (2021-Present)',
                    startYear: 2021,
                    endYear: null,
                    bodyType: 'hatchback',
                    engines: [
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.5 BlueHDi 130hp', fuelType: 'Diesel', horsepower: 130, torque: 300 },
                        { name: 'Hybrid 180hp', fuelType: 'Hybrid', horsepower: 180, torque: 360 },
                        { name: 'Hybrid 225hp', fuelType: 'Hybrid', horsepower: 225, torque: 360 },
                        { name: 'e-308 Electric 156hp', fuelType: 'Electric', horsepower: 156, torque: 260 },
                    ],
                },
            ],
        },
        {
            name: '508',
            slug: '508',
            generations: [
                {
                    name: 'Mk1',
                    displayName: 'Mk1 (2010-2018)',
                    startYear: 2010,
                    endYear: 2018,
                    bodyType: 'sedan',
                    engines: [
                        { name: '1.6 VTi 120hp', fuelType: 'Petrol', horsepower: 120, torque: 160 },
                        { name: '1.6 THP 156hp', fuelType: 'Petrol', horsepower: 156, torque: 240 },
                        { name: '1.6 THP 165hp', fuelType: 'Petrol', horsepower: 165, torque: 240 },
                        { name: '1.6 HDi 115hp', fuelType: 'Diesel', horsepower: 115, torque: 270 },
                        { name: '2.0 HDi 140hp', fuelType: 'Diesel', horsepower: 140, torque: 320 },
                        { name: '2.0 HDi 163hp', fuelType: 'Diesel', horsepower: 163, torque: 340 },
                        { name: '2.2 HDi 204hp', fuelType: 'Diesel', horsepower: 204, torque: 450 },
                        { name: 'HYbrid4 200hp', fuelType: 'Hybrid', horsepower: 200, torque: 450 },
                    ],
                },
                {
                    name: 'Mk2',
                    displayName: 'Mk2 (2018-Present)',
                    startYear: 2018,
                    endYear: null,
                    bodyType: 'sedan',
                    engines: [
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.6 PureTech 180hp', fuelType: 'Petrol', horsepower: 180, torque: 250 },
                        { name: '1.6 PureTech 225hp', fuelType: 'Petrol', horsepower: 225, torque: 300 },
                        { name: '1.5 BlueHDi 130hp', fuelType: 'Diesel', horsepower: 130, torque: 300 },
                        { name: '2.0 BlueHDi 163hp', fuelType: 'Diesel', horsepower: 163, torque: 400 },
                        { name: '2.0 BlueHDi 180hp', fuelType: 'Diesel', horsepower: 180, torque: 400 },
                        { name: 'Hybrid 225hp', fuelType: 'Hybrid', horsepower: 225, torque: 360 },
                        { name: 'PSE Hybrid 360hp', fuelType: 'Hybrid', horsepower: 360, torque: 520 },
                    ],
                },
            ],
        },
        {
            name: '3008',
            slug: '3008',
            generations: [
                {
                    name: 'Mk1',
                    displayName: 'Mk1 (2009-2016)',
                    startYear: 2009,
                    endYear: 2016,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.6 VTi 120hp', fuelType: 'Petrol', horsepower: 120, torque: 160 },
                        { name: '1.6 THP 156hp', fuelType: 'Petrol', horsepower: 156, torque: 240 },
                        { name: '1.6 HDi 112hp', fuelType: 'Diesel', horsepower: 112, torque: 270 },
                        { name: '2.0 HDi 150hp', fuelType: 'Diesel', horsepower: 150, torque: 340 },
                        { name: '2.0 HDi 163hp', fuelType: 'Diesel', horsepower: 163, torque: 340 },
                        { name: 'HYbrid4 200hp', fuelType: 'Hybrid', horsepower: 200, torque: 450 },
                    ],
                },
                {
                    name: 'Mk2',
                    displayName: 'Mk2 (2016-2024)',
                    startYear: 2016,
                    endYear: 2024,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.6 PureTech 180hp', fuelType: 'Petrol', horsepower: 180, torque: 250 },
                        { name: '1.5 BlueHDi 130hp', fuelType: 'Diesel', horsepower: 130, torque: 300 },
                        { name: '2.0 BlueHDi 180hp', fuelType: 'Diesel', horsepower: 180, torque: 400 },
                        { name: 'Hybrid 225hp', fuelType: 'Hybrid', horsepower: 225, torque: 360 },
                        { name: 'Hybrid4 300hp', fuelType: 'Hybrid', horsepower: 300, torque: 520 },
                    ],
                },
            ],
        },
        {
            name: '5008',
            slug: '5008',
            generations: [
                {
                    name: 'Mk1',
                    displayName: 'Mk1 (2009-2016)',
                    startYear: 2009,
                    endYear: 2016,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.6 VTi 120hp', fuelType: 'Petrol', horsepower: 120, torque: 160 },
                        { name: '1.6 THP 156hp', fuelType: 'Petrol', horsepower: 156, torque: 240 },
                        { name: '1.6 HDi 112hp', fuelType: 'Diesel', horsepower: 112, torque: 270 },
                        { name: '2.0 HDi 150hp', fuelType: 'Diesel', horsepower: 150, torque: 340 },
                    ],
                },
                {
                    name: 'Mk2',
                    displayName: 'Mk2 (2017-2024)',
                    startYear: 2017,
                    endYear: 2024,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.6 PureTech 180hp', fuelType: 'Petrol', horsepower: 180, torque: 250 },
                        { name: '1.5 BlueHDi 130hp', fuelType: 'Diesel', horsepower: 130, torque: 300 },
                        { name: '2.0 BlueHDi 180hp', fuelType: 'Diesel', horsepower: 180, torque: 400 },
                        { name: 'Hybrid 195hp', fuelType: 'Hybrid', horsepower: 195, torque: 360 },
                    ],
                },
            ],
        },
        {
            name: '2008',
            slug: '2008',
            generations: [
                {
                    name: 'Mk1',
                    displayName: 'Mk1 (2013-2019)',
                    startYear: 2013,
                    endYear: 2019,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.2 VTi 82hp', fuelType: 'Petrol', horsepower: 82, torque: 118 },
                        { name: '1.2 PureTech 110hp', fuelType: 'Petrol', horsepower: 110, torque: 205 },
                        { name: '1.6 THP 165hp', fuelType: 'Petrol', horsepower: 165, torque: 240 },
                        { name: '1.6 BlueHDi 100hp', fuelType: 'Diesel', horsepower: 100, torque: 254 },
                    ],
                },
                {
                    name: 'Mk2',
                    displayName: 'Mk2 (2019-Present)',
                    startYear: 2019,
                    endYear: null,
                    bodyType: 'suv',
                    engines: [
                        { name: '1.2 PureTech 100hp', fuelType: 'Petrol', horsepower: 100, torque: 205 },
                        { name: '1.2 PureTech 130hp', fuelType: 'Petrol', horsepower: 130, torque: 230 },
                        { name: '1.5 BlueHDi 110hp', fuelType: 'Diesel', horsepower: 110, torque: 250 },
                        { name: 'e-2008 Electric 136hp', fuelType: 'Electric', horsepower: 136, torque: 260 },
                    ],
                },
            ],
        },
        {
            name: '406',
            slug: '406',
            generations: [
                {
                    name: 'D8/D9',
                    displayName: '(1995-2004)',
                    startYear: 1995,
                    endYear: 2004,
                    bodyType: 'sedan',
                    engines: [
                        { name: '1.8 16V 110hp', fuelType: 'Petrol', horsepower: 110, torque: 165 },
                        { name: '2.0 16V 135hp', fuelType: 'Petrol', horsepower: 135, torque: 190 },
                        { name: '2.0 HPi 140hp', fuelType: 'Petrol', horsepower: 140, torque: 200 },
                        { name: '2.2 16V 158hp', fuelType: 'Petrol', horsepower: 158, torque: 218 },
                        { name: '3.0 V6 190hp', fuelType: 'Petrol', horsepower: 190, torque: 267 },
                        { name: '3.0 V6 24V 210hp', fuelType: 'Petrol', horsepower: 210, torque: 285 },
                        { name: '2.0 HDi 109hp', fuelType: 'Diesel', horsepower: 109, torque: 250 },
                        { name: '2.2 HDi 136hp', fuelType: 'Diesel', horsepower: 136, torque: 314 },
                    ],
                },
            ],
        },
        {
            name: 'RCZ',
            slug: 'rcz',
            generations: [
                {
                    name: 'Mk1',
                    displayName: '(2010-2015)',
                    startYear: 2010,
                    endYear: 2015,
                    bodyType: 'coupe',
                    engines: [
                        { name: '1.6 THP 156hp', fuelType: 'Petrol', horsepower: 156, torque: 240 },
                        { name: '1.6 THP 200hp', fuelType: 'Petrol', horsepower: 200, torque: 275 },
                        { name: '1.6 THP R 270hp', fuelType: 'Petrol', horsepower: 270, torque: 330 },
                        { name: '2.0 HDi 163hp', fuelType: 'Diesel', horsepower: 163, torque: 340 },
                    ],
                },
            ],
        },
    ]

    // Helper to create slug from name
    const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    // Create models, generations, and engine configs
    for (const modelData of models) {
        const model = await prisma.carModel.upsert({
            where: {
                makeId_slug: {
                    makeId: peugeot.id,
                    slug: modelData.slug,
                },
            },
            update: {},
            create: {
                name: modelData.name,
                slug: modelData.slug,
                makeId: peugeot.id,
            },
        })

        console.log(`  ✅ Model: ${modelData.name}`)

        for (const genData of modelData.generations) {
            const generation = await prisma.carGeneration.upsert({
                where: {
                    modelId_name: {
                        modelId: model.id,
                        name: genData.name,
                    },
                },
                update: {
                    displayName: genData.displayName,
                    startYear: genData.startYear,
                    endYear: genData.endYear,
                    bodyType: genData.bodyType || null,
                },
                create: {
                    name: genData.name,
                    displayName: genData.displayName,
                    modelId: model.id,
                    startYear: genData.startYear,
                    endYear: genData.endYear,
                    bodyType: genData.bodyType || null,
                },
            })

            console.log(`    ✅ Generation: ${genData.displayName} (${genData.bodyType})`)

            for (const engineData of genData.engines) {
                const engineId = `${generation.id}-${slugify(engineData.name)}`
                await prisma.engineConfig.upsert({
                    where: { id: engineId },
                    update: {
                        horsepower: engineData.horsepower,
                        torque: engineData.torque,
                        fuelType: engineData.fuelType,
                    },
                    create: {
                        id: engineId,
                        name: engineData.name,
                        generationId: generation.id,
                        horsepower: engineData.horsepower,
                        torque: engineData.torque,
                        fuelType: engineData.fuelType,
                    },
                })
            }

            console.log(`      ✅ ${genData.engines.length} engine configs`)
        }
    }

    console.log('\n🎉 Peugeot data cleaned and updated successfully!')
}

seedPeugeot()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
