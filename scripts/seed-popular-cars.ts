/**
 * Seed popular car makes and models
 * This creates a curated database of enthusiast-focused cars
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

// Popular car makes and models for enthusiasts
const POPULAR_CARS = [
  {
    make: 'BMW',
    logo: '/logos/bmw.svg',
    models: [
      { name: '1 Series', slug: '1-series' },
      { name: '2 Series', slug: '2-series' },
      { name: '3 Series', slug: '3-series' },
      { name: '4 Series', slug: '4-series' },
      { name: '5 Series', slug: '5-series' },
      { name: '6 Series', slug: '6-series' },
      { name: '7 Series', slug: '7-series' },
      { name: '8 Series', slug: '8-series' },
      { name: 'X1', slug: 'x1' },
      { name: 'X3', slug: 'x3' },
      { name: 'X5', slug: 'x5' },
      { name: 'X6', slug: 'x6' },
      { name: 'X7', slug: 'x7' },
      { name: 'Z3', slug: 'z3' },
      { name: 'Z4', slug: 'z4' },
      { name: 'M2', slug: 'm2' },
      { name: 'M3', slug: 'm3' },
      { name: 'M4', slug: 'm4' },
      { name: 'M5', slug: 'm5' },
      { name: 'M6', slug: 'm6' },
      { name: 'M8', slug: 'm8' },
      { name: 'i3', slug: 'i3' },
      { name: 'i4', slug: 'i4' },
      { name: 'i7', slug: 'i7' },
      { name: 'iX', slug: 'ix' },
    ]
  },
  {
    make: 'Mercedes-Benz',
    logo: '/logos/mercedes.svg',
    models: [
      { name: 'A-Class', slug: 'a-class' },
      { name: 'B-Class', slug: 'b-class' },
      { name: 'C-Class', slug: 'c-class' },
      { name: 'E-Class', slug: 'e-class' },
      { name: 'S-Class', slug: 's-class' },
      { name: 'CLA', slug: 'cla' },
      { name: 'CLS', slug: 'cls' },
      { name: 'GLA', slug: 'gla' },
      { name: 'GLB', slug: 'glb' },
      { name: 'GLC', slug: 'glc' },
      { name: 'GLE', slug: 'gle' },
      { name: 'GLS', slug: 'gls' },
      { name: 'G-Class', slug: 'g-class' },
      { name: 'SL', slug: 'sl' },
      { name: 'SLC', slug: 'slc' },
      { name: 'AMG GT', slug: 'amg-gt' },
      { name: 'AMG A 45', slug: 'amg-a45' },
      { name: 'AMG C 63', slug: 'amg-c63' },
      { name: 'AMG E 63', slug: 'amg-e63' },
      { name: 'EQS', slug: 'eqs' },
      { name: 'EQE', slug: 'eqe' },
    ]
  },
  {
    make: 'Audi',
    logo: '/logos/audi.svg',
    models: [
      { name: 'A1', slug: 'a1' },
      { name: 'A3', slug: 'a3' },
      { name: 'A4', slug: 'a4' },
      { name: 'A5', slug: 'a5' },
      { name: 'A6', slug: 'a6' },
      { name: 'A7', slug: 'a7' },
      { name: 'A8', slug: 'a8' },
      { name: 'Q2', slug: 'q2' },
      { name: 'Q3', slug: 'q3' },
      { name: 'Q5', slug: 'q5' },
      { name: 'Q7', slug: 'q7' },
      { name: 'Q8', slug: 'q8' },
      { name: 'TT', slug: 'tt' },
      { name: 'R8', slug: 'r8' },
      { name: 'S3', slug: 's3' },
      { name: 'S4', slug: 's4' },
      { name: 'S5', slug: 's5' },
      { name: 'RS3', slug: 'rs3' },
      { name: 'RS4', slug: 'rs4' },
      { name: 'RS5', slug: 'rs5' },
      { name: 'RS6', slug: 'rs6' },
      { name: 'RS7', slug: 'rs7' },
      { name: 'e-tron', slug: 'e-tron' },
      { name: 'e-tron GT', slug: 'e-tron-gt' },
    ]
  },
  {
    make: 'Volkswagen',
    logo: '/logos/vw.svg',
    models: [
      { name: 'Golf', slug: 'golf' },
      { name: 'Golf GTI', slug: 'golf-gti' },
      { name: 'Golf R', slug: 'golf-r' },
      { name: 'Polo', slug: 'polo' },
      { name: 'Polo GTI', slug: 'polo-gti' },
      { name: 'Passat', slug: 'passat' },
      { name: 'Arteon', slug: 'arteon' },
      { name: 'Tiguan', slug: 'tiguan' },
      { name: 'Touareg', slug: 'touareg' },
      { name: 'T-Roc', slug: 't-roc' },
      { name: 'ID.3', slug: 'id3' },
      { name: 'ID.4', slug: 'id4' },
      { name: 'ID.Buzz', slug: 'id-buzz' },
      { name: 'Scirocco', slug: 'scirocco' },
    ]
  },
  {
    make: 'Porsche',
    logo: '/logos/porsche.svg',
    models: [
      { name: '911', slug: '911' },
      { name: '911 GT3', slug: '911-gt3' },
      { name: '911 Turbo', slug: '911-turbo' },
      { name: '718 Cayman', slug: '718-cayman' },
      { name: '718 Boxster', slug: '718-boxster' },
      { name: 'Cayenne', slug: 'cayenne' },
      { name: 'Macan', slug: 'macan' },
      { name: 'Panamera', slug: 'panamera' },
      { name: 'Taycan', slug: 'taycan' },
    ]
  },
  {
    make: 'Ford',
    logo: '/logos/ford.svg',
    models: [
      { name: 'Mustang', slug: 'mustang' },
      { name: 'Mustang GT', slug: 'mustang-gt' },
      { name: 'Mustang Shelby GT500', slug: 'mustang-shelby-gt500' },
      { name: 'Focus', slug: 'focus' },
      { name: 'Focus ST', slug: 'focus-st' },
      { name: 'Focus RS', slug: 'focus-rs' },
      { name: 'Fiesta', slug: 'fiesta' },
      { name: 'Fiesta ST', slug: 'fiesta-st' },
      { name: 'Ranger', slug: 'ranger' },
      { name: 'F-150', slug: 'f-150' },
      { name: 'F-150 Raptor', slug: 'f-150-raptor' },
      { name: 'Bronco', slug: 'bronco' },
      { name: 'GT', slug: 'gt' },
    ]
  },
  {
    make: 'Chevrolet',
    logo: '/logos/chevrolet.svg',
    models: [
      { name: 'Camaro', slug: 'camaro' },
      { name: 'Camaro ZL1', slug: 'camaro-zl1' },
      { name: 'Corvette', slug: 'corvette' },
      { name: 'Corvette Z06', slug: 'corvette-z06' },
      { name: 'Corvette ZR1', slug: 'corvette-zr1' },
      { name: 'Silverado', slug: 'silverado' },
      { name: 'Tahoe', slug: 'tahoe' },
    ]
  },
  {
    make: 'Dodge',
    logo: '/logos/dodge.svg',
    models: [
      { name: 'Challenger', slug: 'challenger' },
      { name: 'Challenger Hellcat', slug: 'challenger-hellcat' },
      { name: 'Challenger Demon', slug: 'challenger-demon' },
      { name: 'Charger', slug: 'charger' },
      { name: 'Charger Hellcat', slug: 'charger-hellcat' },
      { name: 'Viper', slug: 'viper' },
      { name: 'Durango', slug: 'durango' },
    ]
  },
  {
    make: 'Honda',
    logo: '/logos/honda.svg',
    models: [
      { name: 'Civic', slug: 'civic' },
      { name: 'Civic Type R', slug: 'civic-type-r' },
      { name: 'Civic Si', slug: 'civic-si' },
      { name: 'Accord', slug: 'accord' },
      { name: 'CR-V', slug: 'cr-v' },
      { name: 'HR-V', slug: 'hr-v' },
      { name: 'NSX', slug: 'nsx' },
      { name: 'S2000', slug: 's2000' },
      { name: 'Integra', slug: 'integra' },
    ]
  },
  {
    make: 'Toyota',
    logo: '/logos/toyota.svg',
    models: [
      { name: 'Supra', slug: 'supra' },
      { name: 'GR86', slug: 'gr86' },
      { name: 'GR Corolla', slug: 'gr-corolla' },
      { name: 'GR Yaris', slug: 'gr-yaris' },
      { name: 'Corolla', slug: 'corolla' },
      { name: 'Camry', slug: 'camry' },
      { name: 'RAV4', slug: 'rav4' },
      { name: 'Land Cruiser', slug: 'land-cruiser' },
      { name: 'Hilux', slug: 'hilux' },
      { name: '4Runner', slug: '4runner' },
    ]
  },
  {
    make: 'Nissan',
    logo: '/logos/nissan.svg',
    models: [
      { name: 'GT-R', slug: 'gt-r' },
      { name: '370Z', slug: '370z' },
      { name: 'Z', slug: 'z' },
      { name: 'Skyline', slug: 'skyline' },
      { name: 'Silvia', slug: 'silvia' },
      { name: 'Juke', slug: 'juke' },
      { name: 'Qashqai', slug: 'qashqai' },
      { name: 'X-Trail', slug: 'x-trail' },
      { name: 'Patrol', slug: 'patrol' },
    ]
  },
  {
    make: 'Mazda',
    logo: '/logos/mazda.svg',
    models: [
      { name: 'MX-5 Miata', slug: 'mx-5' },
      { name: 'Mazda3', slug: 'mazda3' },
      { name: 'Mazda6', slug: 'mazda6' },
      { name: 'CX-5', slug: 'cx-5' },
      { name: 'CX-30', slug: 'cx-30' },
      { name: 'RX-7', slug: 'rx-7' },
      { name: 'RX-8', slug: 'rx-8' },
    ]
  },
  {
    make: 'Subaru',
    logo: '/logos/subaru.svg',
    models: [
      { name: 'WRX', slug: 'wrx' },
      { name: 'WRX STI', slug: 'wrx-sti' },
      { name: 'BRZ', slug: 'brz' },
      { name: 'Impreza', slug: 'impreza' },
      { name: 'Legacy', slug: 'legacy' },
      { name: 'Forester', slug: 'forester' },
      { name: 'Outback', slug: 'outback' },
    ]
  },
  {
    make: 'Mitsubishi',
    logo: '/logos/mitsubishi.svg',
    models: [
      { name: 'Lancer Evolution', slug: 'lancer-evo' },
      { name: 'Eclipse', slug: 'eclipse' },
      { name: '3000GT', slug: '3000gt' },
      { name: 'Outlander', slug: 'outlander' },
      { name: 'Pajero', slug: 'pajero' },
    ]
  },
  {
    make: 'Lexus',
    logo: '/logos/lexus.svg',
    models: [
      { name: 'IS', slug: 'is' },
      { name: 'IS F', slug: 'is-f' },
      { name: 'RC', slug: 'rc' },
      { name: 'RC F', slug: 'rc-f' },
      { name: 'LC', slug: 'lc' },
      { name: 'LFA', slug: 'lfa' },
      { name: 'GS', slug: 'gs' },
      { name: 'ES', slug: 'es' },
      { name: 'LS', slug: 'ls' },
      { name: 'RX', slug: 'rx' },
      { name: 'NX', slug: 'nx' },
    ]
  },
  {
    make: 'Alfa Romeo',
    logo: '/logos/alfa-romeo.svg',
    models: [
      { name: 'Giulia', slug: 'giulia' },
      { name: 'Giulia Quadrifoglio', slug: 'giulia-quadrifoglio' },
      { name: 'Stelvio', slug: 'stelvio' },
      { name: '4C', slug: '4c' },
      { name: 'Giulietta', slug: 'giulietta' },
    ]
  },
  {
    make: 'Lamborghini',
    logo: '/logos/lamborghini.svg',
    models: [
      { name: 'Huracán', slug: 'huracan' },
      { name: 'Aventador', slug: 'aventador' },
      { name: 'Urus', slug: 'urus' },
      { name: 'Revuelto', slug: 'revuelto' },
      { name: 'Gallardo', slug: 'gallardo' },
      { name: 'Murciélago', slug: 'murcielago' },
    ]
  },
  {
    make: 'Ferrari',
    logo: '/logos/ferrari.svg',
    models: [
      { name: '488', slug: '488' },
      { name: 'F8', slug: 'f8' },
      { name: '296', slug: '296' },
      { name: 'SF90', slug: 'sf90' },
      { name: 'Roma', slug: 'roma' },
      { name: 'Portofino', slug: 'portofino' },
      { name: '812', slug: '812' },
      { name: 'Purosangue', slug: 'purosangue' },
      { name: 'LaFerrari', slug: 'laferrari' },
    ]
  },
  {
    make: 'McLaren',
    logo: '/logos/mclaren.svg',
    models: [
      { name: '720S', slug: '720s' },
      { name: '765LT', slug: '765lt' },
      { name: 'Artura', slug: 'artura' },
      { name: 'GT', slug: 'gt' },
      { name: 'P1', slug: 'p1' },
      { name: '570S', slug: '570s' },
    ]
  },
  {
    make: 'Aston Martin',
    logo: '/logos/aston-martin.svg',
    models: [
      { name: 'DB11', slug: 'db11' },
      { name: 'DB12', slug: 'db12' },
      { name: 'Vantage', slug: 'vantage' },
      { name: 'DBS', slug: 'dbs' },
      { name: 'DBX', slug: 'dbx' },
      { name: 'Valkyrie', slug: 'valkyrie' },
    ]
  },
  {
    make: 'Jaguar',
    logo: '/logos/jaguar.svg',
    models: [
      { name: 'F-Type', slug: 'f-type' },
      { name: 'XE', slug: 'xe' },
      { name: 'XF', slug: 'xf' },
      { name: 'XJ', slug: 'xj' },
      { name: 'F-PACE', slug: 'f-pace' },
      { name: 'E-PACE', slug: 'e-pace' },
      { name: 'I-PACE', slug: 'i-pace' },
    ]
  },
  {
    make: 'Land Rover',
    logo: '/logos/land-rover.svg',
    models: [
      { name: 'Range Rover', slug: 'range-rover' },
      { name: 'Range Rover Sport', slug: 'range-rover-sport' },
      { name: 'Range Rover Evoque', slug: 'range-rover-evoque' },
      { name: 'Range Rover Velar', slug: 'range-rover-velar' },
      { name: 'Defender', slug: 'defender' },
      { name: 'Discovery', slug: 'discovery' },
    ]
  },
  {
    make: 'Tesla',
    logo: '/logos/tesla.svg',
    models: [
      { name: 'Model S', slug: 'model-s' },
      { name: 'Model 3', slug: 'model-3' },
      { name: 'Model X', slug: 'model-x' },
      { name: 'Model Y', slug: 'model-y' },
      { name: 'Cybertruck', slug: 'cybertruck' },
      { name: 'Roadster', slug: 'roadster' },
    ]
  },
  {
    make: 'Volvo',
    logo: '/logos/volvo.svg',
    models: [
      { name: 'S60', slug: 's60' },
      { name: 'S90', slug: 's90' },
      { name: 'V60', slug: 'v60' },
      { name: 'V90', slug: 'v90' },
      { name: 'XC40', slug: 'xc40' },
      { name: 'XC60', slug: 'xc60' },
      { name: 'XC90', slug: 'xc90' },
      { name: 'Polestar 1', slug: 'polestar-1' },
      { name: 'Polestar 2', slug: 'polestar-2' },
    ]
  },
  {
    make: 'Hyundai',
    logo: '/logos/hyundai.svg',
    models: [
      { name: 'i30 N', slug: 'i30-n' },
      { name: 'Elantra N', slug: 'elantra-n' },
      { name: 'Veloster N', slug: 'veloster-n' },
      { name: 'Kona N', slug: 'kona-n' },
      { name: 'Tucson', slug: 'tucson' },
      { name: 'Santa Fe', slug: 'santa-fe' },
      { name: 'Ioniq 5', slug: 'ioniq-5' },
      { name: 'Ioniq 6', slug: 'ioniq-6' },
    ]
  },
  {
    make: 'Kia',
    logo: '/logos/kia.svg',
    models: [
      { name: 'Stinger', slug: 'stinger' },
      { name: 'Stinger GT', slug: 'stinger-gt' },
      { name: 'EV6', slug: 'ev6' },
      { name: 'EV6 GT', slug: 'ev6-gt' },
      { name: 'Sportage', slug: 'sportage' },
      { name: 'Sorento', slug: 'sorento' },
    ]
  },
  {
    make: 'Genesis',
    logo: '/logos/genesis.svg',
    models: [
      { name: 'G70', slug: 'g70' },
      { name: 'G80', slug: 'g80' },
      { name: 'G90', slug: 'g90' },
      { name: 'GV70', slug: 'gv70' },
      { name: 'GV80', slug: 'gv80' },
    ]
  },
  {
    make: 'Seat',
    logo: '/logos/seat.svg',
    models: [
      { name: 'Leon', slug: 'leon' },
      { name: 'Leon Cupra', slug: 'leon-cupra' },
      { name: 'Ibiza', slug: 'ibiza' },
      { name: 'Ateca', slug: 'ateca' },
      { name: 'Tarraco', slug: 'tarraco' },
    ]
  },
  {
    make: 'Cupra',
    logo: '/logos/cupra.svg',
    models: [
      { name: 'Leon', slug: 'leon' },
      { name: 'Formentor', slug: 'formentor' },
      { name: 'Born', slug: 'born' },
      { name: 'Ateca', slug: 'ateca' },
    ]
  },
  {
    make: 'Skoda',
    logo: '/logos/skoda.svg',
    models: [
      { name: 'Octavia', slug: 'octavia' },
      { name: 'Octavia RS', slug: 'octavia-rs' },
      { name: 'Superb', slug: 'superb' },
      { name: 'Kodiaq', slug: 'kodiaq' },
      { name: 'Enyaq', slug: 'enyaq' },
    ]
  },
  {
    make: 'Renault',
    logo: '/logos/renault.svg',
    models: [
      { name: 'Megane RS', slug: 'megane-rs' },
      { name: 'Clio RS', slug: 'clio-rs' },
      { name: 'Alpine A110', slug: 'alpine-a110' },
      { name: 'Megane E-Tech', slug: 'megane-e-tech' },
    ]
  },
  {
    make: 'Peugeot',
    logo: '/logos/peugeot.svg',
    models: [
      { name: '208 GTi', slug: '208-gti' },
      { name: '308 GTi', slug: '308-gti' },
      { name: '508 PSE', slug: '508-pse' },
    ]
  },
  {
    make: 'Mini',
    logo: '/logos/mini.svg',
    models: [
      { name: 'Cooper', slug: 'cooper' },
      { name: 'Cooper S', slug: 'cooper-s' },
      { name: 'John Cooper Works', slug: 'jcw' },
      { name: 'Countryman', slug: 'countryman' },
    ]
  },
  {
    make: 'Lotus',
    logo: '/logos/lotus.svg',
    models: [
      { name: 'Elise', slug: 'elise' },
      { name: 'Exige', slug: 'exige' },
      { name: 'Evora', slug: 'evora' },
      { name: 'Emira', slug: 'emira' },
      { name: 'Eletre', slug: 'eletre' },
    ]
  },
]

function createSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function seed() {
  console.log('🚗 Seeding popular car makes and models...\n')

  let makesCreated = 0
  let modelsCreated = 0

  for (const carData of POPULAR_CARS) {
    // Create or find make
    let make = await prisma.carMake.findFirst({
      where: { name: carData.make }
    })

    if (!make) {
      make = await prisma.carMake.create({
        data: {
          name: carData.make,
          slug: createSlug(carData.make),
          logo: carData.logo,
        }
      })
      console.log(`✅ Created make: ${carData.make}`)
      makesCreated++
    } else {
      console.log(`⏭️  Make exists: ${carData.make}`)
    }

    // Create models for this make
    for (const modelData of carData.models) {
      const existingModel = await prisma.carModel.findFirst({
        where: {
          makeId: make.id,
          name: modelData.name,
        }
      })

      if (!existingModel) {
        await prisma.carModel.create({
          data: {
            name: modelData.name,
            slug: modelData.slug,
            makeId: make.id,
          }
        })
        modelsCreated++
      }
    }
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`   Created ${makesCreated} makes`)
  console.log(`   Created ${modelsCreated} models`)

  // Show final counts
  const totalMakes = await prisma.carMake.count()
  const totalModels = await prisma.carModel.count()
  console.log(`\n📊 Database now has:`)
  console.log(`   ${totalMakes} makes`)
  console.log(`   ${totalModels} models`)
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
