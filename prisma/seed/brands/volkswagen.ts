// Volkswagen car data - models, generations, and engines
import { BrandGenerations } from '../types'

// Models available for Volkswagen
export const volkswagenModels = [
    'Golf', 'Polo', 'Passat', 'Arteon',
    'Tiguan', 'Touareg', 'T-Roc', 'T-Cross',
    'ID.3', 'ID.4', 'ID.Buzz',
    'Scirocco', 'Beetle', 'Jetta'
]

// Generations with real chassis codes/generation names as displayName
export const volkswagenGenerations: BrandGenerations = {
    'Golf': [
        {
            name: 'Mk5',
            displayName: 'Mk5 (2003-2009)',
            startYear: 2003,
            endYear: 2009,
            bodyType: 'hatchback',
            engines: [
                { name: '1.4 TSI', displacement: '1.4L', fuelType: 'petrol', horsepower: 122, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6 FSI', displacement: '1.6L', fuelType: 'petrol', horsepower: 115, torque: 155, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 FSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 150, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TFSI GTI', displacement: '2.0L', fuelType: 'petrol', horsepower: 200, torque: 280, transmission: 'manual', drivetrain: 'fwd' },
                { name: '3.2 VR6 R32', displacement: '3.2L', fuelType: 'petrol', horsepower: 250, torque: 320, transmission: 'dct', drivetrain: 'awd' },
                { name: '1.9 TDI', displacement: '1.9L', fuelType: 'diesel', horsepower: 105, torque: 250, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 140, torque: 320, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'Mk6',
            displayName: 'Mk6 (2008-2013)',
            startYear: 2008,
            endYear: 2013,
            bodyType: 'hatchback',
            engines: [
                { name: '1.2 TSI', displacement: '1.2L', fuelType: 'petrol', horsepower: 105, torque: 175, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4 TSI', displacement: '1.4L', fuelType: 'petrol', horsepower: 160, torque: 240, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI GTI', displacement: '2.0L', fuelType: 'petrol', horsepower: 210, torque: 280, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI R', displacement: '2.0L', fuelType: 'petrol', horsepower: 270, torque: 350, transmission: 'dct', drivetrain: 'awd' },
                { name: '1.6 TDI', displacement: '1.6L', fuelType: 'diesel', horsepower: 105, torque: 250, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 140, torque: 320, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'Mk7',
            displayName: 'Mk7 (2012-2020)',
            startYear: 2012,
            endYear: 2020,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0 TSI', displacement: '1.0L', fuelType: 'petrol', horsepower: 115, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4 TSI', displacement: '1.4L', fuelType: 'petrol', horsepower: 150, torque: 250, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI GTI', displacement: '2.0L', fuelType: 'petrol', horsepower: 230, torque: 350, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI GTI Performance', displacement: '2.0L', fuelType: 'petrol', horsepower: 245, torque: 370, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI R', displacement: '2.0L', fuelType: 'petrol', horsepower: 310, torque: 400, transmission: 'dct', drivetrain: 'awd' },
                { name: '1.6 TDI', displacement: '1.6L', fuelType: 'diesel', horsepower: 115, torque: 250, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 150, torque: 340, transmission: 'dct', drivetrain: 'fwd' },
                { name: 'e-Golf', displacement: 'Electric', fuelType: 'electric', horsepower: 136, torque: 290, transmission: 'automatic', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'Mk8',
            displayName: 'Mk8 (2019-present)',
            startYear: 2019,
            endYear: undefined,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0 eTSI', displacement: '1.0L', fuelType: 'hybrid', horsepower: 110, torque: 200, transmission: 'dct', drivetrain: 'fwd' },
                { name: '1.5 eTSI', displacement: '1.5L', fuelType: 'hybrid', horsepower: 150, torque: 250, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI GTI', displacement: '2.0L', fuelType: 'petrol', horsepower: 245, torque: 370, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI GTI Clubsport', displacement: '2.0L', fuelType: 'petrol', horsepower: 300, torque: 400, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TSI R', displacement: '2.0L', fuelType: 'petrol', horsepower: 333, torque: 420, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 150, torque: 360, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
    ],
}
