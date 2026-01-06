// Audi car data - models, generations, and engines
import { BrandGenerations } from '../types'

// Models available for Audi
export const audiModels = [
    'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
    'Q2', 'Q3', 'Q5', 'Q7', 'Q8',
    'TT', 'R8', 'RS3', 'RS6',
    'e-tron', 'e-tron GT'
]

// Generations with real chassis codes as displayName
export const audiGenerations: BrandGenerations = {
    'TT': [
        {
            name: '8N',
            displayName: '8N (1998-2006)',
            startYear: 1998,
            endYear: 2006,
            bodyType: 'coupe',
            engines: [
                { name: '1.8T 150', displacement: '1.8L', fuelType: 'petrol', horsepower: 150, torque: 210, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.8T 180', displacement: '1.8L', fuelType: 'petrol', horsepower: 180, torque: 235, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.8T 225 quattro', displacement: '1.8L', fuelType: 'petrol', horsepower: 225, torque: 280, transmission: 'manual', drivetrain: 'awd' },
                { name: '3.2 VR6 quattro', displacement: '3.2L', fuelType: 'petrol', horsepower: 250, torque: 320, transmission: 'dct', drivetrain: 'awd' },
            ],
        },
        {
            name: '8J',
            displayName: '8J (2006-2014)',
            startYear: 2006,
            endYear: 2014,
            bodyType: 'coupe',
            engines: [
                { name: '1.8 TFSI', displacement: '1.8L', fuelType: 'petrol', horsepower: 160, torque: 250, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TFSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 200, torque: 280, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TFSI quattro', displacement: '2.0L', fuelType: 'petrol', horsepower: 211, torque: 350, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.5 TFSI (TT RS)', displacement: '2.5L', fuelType: 'petrol', horsepower: 340, torque: 450, transmission: 'manual', drivetrain: 'awd' },
                { name: '3.2 VR6 quattro', displacement: '3.2L', fuelType: 'petrol', horsepower: 250, torque: 320, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 170, torque: 350, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: '8S',
            displayName: '8S (2014-2024)',
            startYear: 2014,
            endYear: 2024,
            bodyType: 'coupe',
            engines: [
                { name: '1.8 TFSI', displacement: '1.8L', fuelType: 'petrol', horsepower: 180, torque: 250, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TFSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 230, torque: 370, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TFSI quattro', displacement: '2.0L', fuelType: 'petrol', horsepower: 245, torque: 370, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.5 TFSI (TT RS)', displacement: '2.5L', fuelType: 'petrol', horsepower: 400, torque: 480, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 184, torque: 380, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
    ],
    'A3': [
        {
            name: '8L',
            displayName: '8L (1996-2003)',
            startYear: 1996,
            endYear: 2003,
            bodyType: 'hatchback',
            engines: [
                { name: '1.6', displacement: '1.6L', fuelType: 'petrol', horsepower: 101, torque: 145, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.8T', displacement: '1.8L', fuelType: 'petrol', horsepower: 150, torque: 210, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.8T quattro', displacement: '1.8L', fuelType: 'petrol', horsepower: 180, torque: 235, transmission: 'manual', drivetrain: 'awd' },
                { name: '1.9 TDI', displacement: '1.9L', fuelType: 'diesel', horsepower: 110, torque: 235, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: '8P',
            displayName: '8P (2003-2012)',
            startYear: 2003,
            endYear: 2012,
            bodyType: 'hatchback',
            engines: [
                { name: '1.6 FSI', displacement: '1.6L', fuelType: 'petrol', horsepower: 115, torque: 155, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 FSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 150, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '2.0 TFSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 200, torque: 280, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TFSI quattro (S3)', displacement: '2.0L', fuelType: 'petrol', horsepower: 265, torque: 350, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.5 TFSI (RS3)', displacement: '2.5L', fuelType: 'petrol', horsepower: 340, torque: 450, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 140, torque: 320, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: '8V',
            displayName: '8V (2012-2020)',
            startYear: 2012,
            endYear: 2020,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0 TFSI', displacement: '1.0L', fuelType: 'petrol', horsepower: 116, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4 TFSI', displacement: '1.4L', fuelType: 'petrol', horsepower: 150, torque: 250, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TFSI', displacement: '2.0L', fuelType: 'petrol', horsepower: 190, torque: 320, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TFSI quattro (S3)', displacement: '2.0L', fuelType: 'petrol', horsepower: 310, torque: 400, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.5 TFSI (RS3)', displacement: '2.5L', fuelType: 'petrol', horsepower: 400, torque: 480, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 150, torque: 340, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
        {
            name: '8Y',
            displayName: '8Y (2020-present)',
            startYear: 2020,
            endYear: undefined,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0 TFSI', displacement: '1.0L', fuelType: 'petrol', horsepower: 110, torque: 200, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.5 TFSI', displacement: '1.5L', fuelType: 'petrol', horsepower: 150, torque: 250, transmission: 'dct', drivetrain: 'fwd' },
                { name: '2.0 TFSI quattro (S3)', displacement: '2.0L', fuelType: 'petrol', horsepower: 333, torque: 420, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.5 TFSI (RS3)', displacement: '2.5L', fuelType: 'petrol', horsepower: 400, torque: 500, transmission: 'dct', drivetrain: 'awd' },
                { name: '2.0 TDI', displacement: '2.0L', fuelType: 'diesel', horsepower: 150, torque: 360, transmission: 'dct', drivetrain: 'fwd' },
            ],
        },
    ],
}
