import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface NHTSAModel {
  Make_ID: number
  Make_Name: string
  Model_ID: number
  Model_Name: string
}

interface NHTSAResponse {
  Count: number
  Message: string
  Results: NHTSAModel[]
}

// GET /api/nhtsa/models?make=BMW&year=2024 - Get models for a make and year
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const make = searchParams.get('make')
    const year = searchParams.get('year')

    if (!make) {
      return NextResponse.json({ error: 'Make is required' }, { status: 400 })
    }

    // Build URL based on whether year is provided
    let url: string
    if (year) {
      url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    } else {
      url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
    }

    const response = await fetch(url, { next: { revalidate: 86400 } })

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data: NHTSAResponse = await response.json()

    // Transform and deduplicate (API can return duplicates)
    const modelsMap = new Map<string, { name: string; id: number }>()
    for (const model of data.Results) {
      if (!modelsMap.has(model.Model_Name)) {
        modelsMap.set(model.Model_Name, {
          name: model.Model_Name,
          id: model.Model_ID
        })
      }
    }

    const models = Array.from(modelsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
      make,
      year: year || null,
      models
    })
  } catch (error) {
    console.error('[api.nhtsa.models.GET] failed', error)
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
  }
}
