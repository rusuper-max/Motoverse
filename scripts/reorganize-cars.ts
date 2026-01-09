/**
 * Reorganize car database into proper model families
 *
 * Problem: Import created entries like "1926 Mercedes-Benz 8/38" as separate models
 * Solution: Extract actual model families (C-Class, E-Class, 3 Series, etc.) and reorganize
 *
 * Usage: npx tsx scripts/reorganize-cars.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
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

// Known model family patterns for major brands
// These will be used to extract the actual model name from entries
const MODEL_PATTERNS: Record<string, RegExp[]> = {
  'mercedes-benz': [
    /\b(A-Class|B-Class|C-Class|E-Class|S-Class|G-Class|V-Class|X-Class)\b/i,
    /\b(CLA|CLS|GLA|GLB|GLC|GLE|GLS|GLK|ML|GL)\b/i,
    /\b(SL|SLC|SLK|SLR|SLS|AMG GT)\b/i,
    /\b(Maybach)\b/i,
    /\b(Sprinter|Vito|Citan|Metris)\b/i,
    /\b(EQ[A-Z])\b/i,
    /\b(CLK|CL)\b/i,
  ],
  'bmw': [
    /\b([1-8] Series)\b/i,
    /\b(X[1-7]|Z[1-4]|i[3-8]|iX[1-3]?)\b/i,
    /\b(M[1-8]|M[2-8] (?:CS|Competition|GTS))\b/i,
    /\b(i\d+)\b/i,
  ],
  'audi': [
    /\b(A[1-8]|S[1-8]|RS[1-7])\b/i,
    /\b(Q[2-8]|SQ[2-8]|RSQ[3-8])\b/i,
    /\b(TT|R8|e-tron)\b/i,
    /\b(Quattro)\b/i,
  ],
  'volkswagen': [
    /\b(Golf|Polo|Passat|Arteon|Jetta|Beetle|Scirocco)\b/i,
    /\b(Tiguan|Touareg|T-Roc|T-Cross|Atlas|Taos)\b/i,
    /\b(ID\.[1-9]|ID\.\d+)\b/i,
    /\b(Transporter|Multivan|Caravelle|California)\b/i,
    /\b(Up|UP!|e-Up)\b/i,
    /\b(Phaeton|Eos|CC)\b/i,
  ],
  'porsche': [
    /\b(911|Carrera|Turbo|GT[2-4]|Targa)\b/i,
    /\b(Cayenne|Macan|Panamera|Taycan)\b/i,
    /\b(Boxster|Cayman)\b/i,
    /\b(918|Carrera GT)\b/i,
  ],
  'toyota': [
    /\b(Corolla|Camry|Avalon|Crown)\b/i,
    /\b(RAV4|Highlander|4Runner|Land Cruiser|Sequoia)\b/i,
    /\b(Prius|Yaris|Supra|GR86|Celica|MR2)\b/i,
    /\b(Tacoma|Tundra|Hilux)\b/i,
    /\b(Sienna|Venza|bZ4X)\b/i,
  ],
  'honda': [
    /\b(Civic|Accord|Insight)\b/i,
    /\b(CR-V|HR-V|Pilot|Passport|Ridgeline)\b/i,
    /\b(Fit|Jazz|City)\b/i,
    /\b(NSX|S2000|Integra|Prelude)\b/i,
    /\b(Odyssey|Element)\b/i,
  ],
  'nissan': [
    /\b(Sentra|Altima|Maxima)\b/i,
    /\b(Rogue|Pathfinder|Armada|Murano|Kicks|X-Trail)\b/i,
    /\b(GT-R|370Z|350Z|Z)\b/i,
    /\b(Leaf|Ariya)\b/i,
    /\b(Frontier|Titan|Navara)\b/i,
    /\b(Juke|Qashqai)\b/i,
    /\b(Skyline|Silvia)\b/i,
  ],
  'ford': [
    /\b(Mustang|Focus|Fiesta|Fusion|Taurus)\b/i,
    /\b(F-150|F-250|F-350|Ranger|Maverick)\b/i,
    /\b(Explorer|Expedition|Bronco|Escape|Edge)\b/i,
    /\b(GT|GT40)\b/i,
    /\b(Mach-E|Lightning)\b/i,
    /\b(Transit|E-Series)\b/i,
  ],
  'chevrolet': [
    /\b(Camaro|Corvette|Malibu|Impala)\b/i,
    /\b(Silverado|Colorado|Avalanche)\b/i,
    /\b(Tahoe|Suburban|Traverse|Equinox|Trailblazer|Blazer)\b/i,
    /\b(Bolt|Volt)\b/i,
    /\b(Spark|Cruze|Sonic)\b/i,
  ],
  'ferrari': [
    /\b(F[1-9]\d*|SF\d+)\b/i,
    /\b(458|488|296|Roma|Portofino|812|F8)\b/i,
    /\b(California|LaFerrari|Enzo|Testarossa)\b/i,
    /\b(Purosangue|Daytona|Monza)\b/i,
    /\b(GTC4|FF|612|599|575|550)\b/i,
  ],
  'lamborghini': [
    /\b(Huracán|Huracan|Gallardo)\b/i,
    /\b(Aventador|Murciélago|Murcielago|Diablo|Countach)\b/i,
    /\b(Urus|LM002)\b/i,
    /\b(Revuelto|Sián|Sian|Centenario)\b/i,
  ],
  'mazda': [
    /\b(Mazda[2-6]|MX-5|MX-30|CX-[3-9]0?)\b/i,
    /\b(RX-[7-8])\b/i,
    /\b(Miata)\b/i,
  ],
  'subaru': [
    /\b(Impreza|WRX|STI|Legacy|Outback)\b/i,
    /\b(Forester|Crosstrek|Ascent|Solterra)\b/i,
    /\b(BRZ)\b/i,
  ],
  'hyundai': [
    /\b(Elantra|Sonata|Accent)\b/i,
    /\b(Tucson|Santa Fe|Palisade|Venue|Kona)\b/i,
    /\b(Ioniq|Genesis|Veloster)\b/i,
    /\b(i\d+|i\d+ N)\b/i,
  ],
  'kia': [
    /\b(Rio|Forte|K5|Optima|Stinger)\b/i,
    /\b(Sportage|Sorento|Telluride|Seltos|Soul)\b/i,
    /\b(EV[6-9]|Niro)\b/i,
  ],
  'tesla': [
    /\b(Model [SX3Y]|Roadster|Cybertruck|Semi)\b/i,
  ],
  'volvo': [
    /\b(S[4-9]0|V[4-9]0|XC[4-9]0)\b/i,
    /\b(C[34]0|EX[39]0)\b/i,
    /\b(Polestar)\b/i,
  ],
  'jaguar': [
    /\b(XE|XF|XJ|F-Type|F-Pace|E-Pace|I-Pace)\b/i,
    /\b(S-Type|X-Type)\b/i,
    /\b(E-Type|XK|XKR)\b/i,
  ],
  'land rover': [
    /\b(Range Rover|Defender|Discovery|Freelander)\b/i,
    /\b(Evoque|Velar|Sport)\b/i,
  ],
  'lexus': [
    /\b(IS|ES|GS|LS)\b/i,
    /\b(NX|RX|GX|LX|UX)\b/i,
    /\b(LC|RC|SC|LFA)\b/i,
    /\b(RZ)\b/i,
  ],
  'alfa romeo': [
    /\b(Giulia|Stelvio|Giulietta|MiTo)\b/i,
    /\b(4C|8C|Tonale)\b/i,
    /\b(Spider|GTV|Brera)\b/i,
  ],
  'maserati': [
    /\b(Ghibli|Quattroporte|Levante|GranTurismo|MC20)\b/i,
  ],
  'aston martin': [
    /\b(DB[579]|DB1[012]|DBS)\b/i,
    /\b(Vantage|Vanquish|Rapide|DBX)\b/i,
    /\b(Valkyrie|Valhalla)\b/i,
  ],
  'bentley': [
    /\b(Continental|Flying Spur|Bentayga|Mulsanne)\b/i,
  ],
  'rolls-royce': [
    /\b(Phantom|Ghost|Wraith|Dawn|Cullinan|Spectre)\b/i,
  ],
  'mclaren': [
    /\b(720S|750S|765LT|570S|600LT|540C)\b/i,
    /\b(P1|Senna|Speedtail|Elva|Artura)\b/i,
    /\b(GT)\b/i,
  ],
  'dodge': [
    /\b(Charger|Challenger|Viper|Dart)\b/i,
    /\b(Durango|Journey|Hornet)\b/i,
    /\b(Ram)\b/i,
  ],
  'jeep': [
    /\b(Wrangler|Grand Cherokee|Cherokee|Compass|Renegade)\b/i,
    /\b(Gladiator|Wagoneer|Commander)\b/i,
  ],
  'cadillac': [
    /\b(CT[4-6]|CTS|ATS|XTS)\b/i,
    /\b(XT[4-6]|Escalade|Lyriq)\b/i,
    /\b(Eldorado|DeVille|Seville)\b/i,
  ],
  'mini': [
    /\b(Cooper|Countryman|Clubman|Paceman)\b/i,
    /\b(Convertible|Hardtop|Hatchback)\b/i,
  ],
  'mitsubishi': [
    /\b(Lancer|Galant|Eclipse)\b/i,
    /\b(Outlander|Pajero|Montero|ASX)\b/i,
    /\b(Evolution|Evo)\b/i,
  ],
  'infiniti': [
    /\b(Q[35-7]0|QX[5-8]0)\b/i,
    /\b(G[35-7]|M[35-7]|FX[35-7])\b/i,
  ],
  'acura': [
    /\b(TLX|ILX|RLX|Integra)\b/i,
    /\b(MDX|RDX|ZDX)\b/i,
    /\b(NSX)\b/i,
  ],
  'genesis': [
    /\b(G[78]0|G[89]0|GV[78]0)\b/i,
  ],
  'peugeot': [
    /\b(\d{3,4})\b/,
  ],
  'renault': [
    /\b(Clio|Megane|Captur|Kadjar|Koleos|Scenic)\b/i,
    /\b(Twingo|Zoe|Talisman|Arkana)\b/i,
  ],
  'citroen': [
    /\b(C[1-6]|DS[3-9])\b/i,
    /\b(Berlingo|C3 Aircross|C5 Aircross)\b/i,
  ],
  'fiat': [
    /\b(500|Panda|Tipo|Punto)\b/i,
    /\b(500X|500L|124 Spider)\b/i,
  ],
  'seat': [
    /\b(Ibiza|Leon|Arona|Ateca|Tarraco)\b/i,
    /\b(Cupra)\b/i,
  ],
  'skoda': [
    /\b(Octavia|Superb|Fabia|Scala)\b/i,
    /\b(Kodiaq|Karoq|Kamiq|Enyaq)\b/i,
  ],
  'opel': [
    /\b(Corsa|Astra|Insignia|Mokka|Crossland|Grandland)\b/i,
  ],
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Extract model family from a car name
function extractModelFamily(brandSlug: string, carName: string): string | null {
  const patterns = MODEL_PATTERNS[brandSlug]
  if (!patterns) return null

  for (const pattern of patterns) {
    const match = carName.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  return null
}

// Parse year from generation name (e.g., "2019-2023" or "2020+")
function parseYearFromGen(genName: string): number | null {
  const match = genName.match(/(\d{4})/)
  return match ? parseInt(match[1]) : null
}

async function main() {
  console.log('=== CAR DATABASE REORGANIZATION ===\n')

  // Get all makes
  const makes = await prisma.carMake.findMany({
    select: { id: true, slug: true, name: true }
  })
  console.log(`Found ${makes.length} makes\n`)

  let totalMerged = 0
  let totalNewFamilies = 0

  for (const make of makes) {
    const patterns = MODEL_PATTERNS[make.slug]
    if (!patterns) continue  // Skip brands without patterns

    // Get all models for this make
    const models = await prisma.carModel.findMany({
      where: { makeId: make.id },
      include: {
        generations: {
          include: { engines: true }
        }
      }
    })

    if (models.length === 0) continue

    console.log(`\n--- ${make.name} (${models.length} models) ---`)

    // Group models by extracted family
    const familyGroups = new Map<string, typeof models>()
    const unmatchedModels: typeof models = []

    for (const model of models) {
      // Try to match from model name or any generation's displayName
      let familyName = extractModelFamily(make.slug, model.name)

      if (!familyName) {
        // Try from generation display names
        for (const gen of model.generations) {
          if (gen.displayName) {
            familyName = extractModelFamily(make.slug, gen.displayName)
            if (familyName) break
          }
        }
      }

      if (familyName) {
        const normalized = familyName.trim()
        if (!familyGroups.has(normalized)) {
          familyGroups.set(normalized, [])
        }
        familyGroups.get(normalized)!.push(model)
      } else {
        unmatchedModels.push(model)
      }
    }

    // Process each family group
    for (const [familyName, familyModels] of familyGroups) {
      if (familyModels.length <= 1) continue  // Nothing to merge

      const familySlug = slugify(familyName)

      // Check if a proper model family already exists
      let targetModel = await prisma.carModel.findFirst({
        where: { makeId: make.id, slug: familySlug }
      })

      if (!targetModel) {
        // Create the family model
        targetModel = await prisma.carModel.create({
          data: {
            name: familyName,
            slug: familySlug,
            makeId: make.id,
          }
        })
        totalNewFamilies++
        console.log(`  Created family: ${familyName}`)
      }

      // Move generations from all matched models to the family model
      for (const sourceModel of familyModels) {
        if (sourceModel.id === targetModel.id) continue  // Don't process self

        // Get existing generation names in target model
        const existingGens = await prisma.carGeneration.findMany({
          where: { modelId: targetModel.id },
          select: { name: true }
        })
        const existingGenNames = new Set(existingGens.map(g => g.name))

        // Move generations one by one to handle name conflicts
        let movedCount = 0
        for (const gen of sourceModel.generations) {
          let newName = gen.name

          // If name already exists, append variant info
          if (existingGenNames.has(newName)) {
            // Try to make unique by adding source model info
            const suffix = sourceModel.name.replace(/^\d{4}\s+/, '').trim()
            newName = `${gen.name} (${suffix})`

            // If still conflicts, add a counter
            let counter = 2
            while (existingGenNames.has(newName)) {
              newName = `${gen.name} (${suffix} #${counter})`
              counter++
            }
          }

          try {
            await prisma.carGeneration.update({
              where: { id: gen.id },
              data: {
                modelId: targetModel.id,
                name: newName
              }
            })
            existingGenNames.add(newName)
            movedCount++
          } catch (error) {
            // Skip if still fails
          }
        }

        if (movedCount > 0) {
          totalMerged += movedCount
          console.log(`    Merged ${movedCount} gens from "${sourceModel.name}" → ${familyName}`)
        }

        // Delete the now-empty source model
        await prisma.carModel.delete({
          where: { id: sourceModel.id }
        }).catch(() => {
          // May fail if generations weren't all moved (constraints)
        })
      }
    }

    // Report unmatched
    if (unmatchedModels.length > 0) {
      console.log(`  Unmatched: ${unmatchedModels.length} models (historic/rare variants)`)
    }
  }

  // Clean up empty models
  console.log('\n--- Cleaning up empty models ---')
  const emptyModels = await prisma.carModel.findMany({
    where: {
      generations: { none: {} }
    }
  })

  if (emptyModels.length > 0) {
    await prisma.carModel.deleteMany({
      where: {
        id: { in: emptyModels.map(m => m.id) }
      }
    })
    console.log(`Deleted ${emptyModels.length} empty models`)
  }

  // Final counts
  const [makeCount, modelCount, genCount, engineCount] = await Promise.all([
    prisma.carMake.count(),
    prisma.carModel.count(),
    prisma.carGeneration.count(),
    prisma.engineConfig.count(),
  ])

  console.log('\n=== REORGANIZATION COMPLETE ===')
  console.log(`New families created: ${totalNewFamilies}`)
  console.log(`Generations merged: ${totalMerged}`)
  console.log(`\nDatabase totals:`)
  console.log(`  Makes:       ${makeCount}`)
  console.log(`  Models:      ${modelCount}`)
  console.log(`  Generations: ${genCount}`)
  console.log(`  Engines:     ${engineCount}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
