import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface NHTSAMake {
  Make_ID: number
  Make_Name: string
}

interface NHTSAResponse {
  Count: number
  Message: string
  Results: NHTSAMake[]
}

// Cache popular makes to reduce API calls
let cachedMakes: { name: string; id: number }[] | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// GET /api/nhtsa/makes - Get all vehicle makes
export async function GET() {
  try {
    // Check cache first
    if (cachedMakes && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json({ makes: cachedMakes })
    }

    const response = await fetch(
      'https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json',
      { next: { revalidate: 86400 } } // Cache for 24 hours
    )

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data: NHTSAResponse = await response.json()

    // Transform and sort alphabetically
    const makes = data.Results
      .map(make => ({
        name: make.Make_Name,
        id: make.Make_ID
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    // Update cache
    cachedMakes = makes
    cacheTimestamp = Date.now()

    return NextResponse.json({ makes })
  } catch (error) {
    console.error('[api.nhtsa.makes.GET] failed', error)
    return NextResponse.json({ error: 'Failed to fetch makes' }, { status: 500 })
  }
}
