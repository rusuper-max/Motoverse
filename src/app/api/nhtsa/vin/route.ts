import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface NHTSAVinResult {
  Variable: string
  Value: string | null
  ValueId: string | null
}

interface NHTSAVinResponse {
  Count: number
  Message: string
  Results: NHTSAVinResult[]
}

// Variable names we care about from NHTSA
const VARIABLE_MAPPING: Record<string, string> = {
  'Make': 'make',
  'Model': 'model',
  'Model Year': 'year',
  'Body Class': 'bodyType',
  'Engine Number of Cylinders': 'cylinders',
  'Displacement (L)': 'displacementL',
  'Displacement (CC)': 'displacementCC',
  'Engine Brake (hp) From': 'horsepowerMin',
  'Engine Brake (hp) To': 'horsepowerMax',
  'Fuel Type - Primary': 'fuelType',
  'Transmission Style': 'transmission',
  'Drive Type': 'drivetrain',
  'Doors': 'doors',
  'Trim': 'trim',
  'Series': 'series',
  'Vehicle Type': 'vehicleType',
  'Plant City': 'plantCity',
  'Plant Country': 'plantCountry',
  'Error Code': 'errorCode',
  'Error Text': 'errorText',
}

// GET /api/nhtsa/vin?vin=WBAPH5C55BA123456 - Decode a VIN
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vin = searchParams.get('vin')

    if (!vin) {
      return NextResponse.json({ error: 'VIN is required' }, { status: 400 })
    }

    // Basic VIN validation (17 characters, alphanumeric)
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return NextResponse.json(
        { error: 'Invalid VIN format. VIN must be 17 alphanumeric characters.' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`)
    }

    const data: NHTSAVinResponse = await response.json()

    // Transform results into a clean object
    const decoded: Record<string, string | number | null> = {}

    for (const result of data.Results) {
      const mappedKey = VARIABLE_MAPPING[result.Variable]
      if (mappedKey && result.Value) {
        // Convert numeric values
        if (['year', 'cylinders', 'doors'].includes(mappedKey)) {
          const num = parseInt(result.Value, 10)
          decoded[mappedKey] = isNaN(num) ? null : num
        } else if (['displacementL', 'horsepowerMin', 'horsepowerMax'].includes(mappedKey)) {
          const num = parseFloat(result.Value)
          decoded[mappedKey] = isNaN(num) ? null : num
        } else {
          decoded[mappedKey] = result.Value
        }
      }
    }

    // Check for errors from NHTSA
    if (decoded.errorCode && decoded.errorCode !== '0') {
      return NextResponse.json({
        vin,
        valid: false,
        error: decoded.errorText || 'Invalid VIN',
        decoded: null
      })
    }

    // Calculate best horsepower estimate (use max or min if only one available)
    let horsepower: number | null = null
    if (decoded.horsepowerMax && typeof decoded.horsepowerMax === 'number') {
      horsepower = decoded.horsepowerMax
    } else if (decoded.horsepowerMin && typeof decoded.horsepowerMin === 'number') {
      horsepower = decoded.horsepowerMin
    }

    // Build formatted displacement string
    let displacement: string | null = null
    if (decoded.displacementL) {
      displacement = `${decoded.displacementL}L`
      if (decoded.cylinders) {
        displacement += ` ${decoded.cylinders}-cyl`
      }
    } else if (decoded.displacementCC) {
      displacement = `${decoded.displacementCC}cc`
      if (decoded.cylinders) {
        displacement += ` ${decoded.cylinders}-cyl`
      }
    }

    return NextResponse.json({
      vin,
      valid: true,
      decoded: {
        make: decoded.make || null,
        model: decoded.model || null,
        year: decoded.year || null,
        bodyType: decoded.bodyType || null,
        trim: decoded.trim || null,
        series: decoded.series || null,
        horsepower,
        displacement,
        cylinders: decoded.cylinders || null,
        fuelType: decoded.fuelType || null,
        transmission: decoded.transmission || null,
        drivetrain: decoded.drivetrain || null,
        doors: decoded.doors || null,
        vehicleType: decoded.vehicleType || null,
        plantCity: decoded.plantCity || null,
        plantCountry: decoded.plantCountry || null,
      }
    })
  } catch (error) {
    console.error('[api.nhtsa.vin.GET] failed', error)
    return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 500 })
  }
}
