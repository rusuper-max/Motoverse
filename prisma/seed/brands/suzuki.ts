// Suzuki car data - models, generations, and engines
import { BrandGenerations } from '../types'

// Models available for Suzuki
export const suzukiModels = [
    'Swift', 'Swift Sport', 'Jimny', 'Vitara', 'SX4', 'S-Cross', 'Ignis', 'Baleno', 'Celerio', 'Alto'
]

// Generations with chassis codes
export const suzukiGenerations: BrandGenerations = {
    'Swift': [
        {
            name: 'SF',
            displayName: 'SF/SA (1st Gen, 1983-1989)',
            startYear: 1983,
            endYear: 1989,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0L G10', displacement: '1.0L', fuelType: 'petrol', horsepower: 50, torque: 75, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.3L G13A', displacement: '1.3L', fuelType: 'petrol', horsepower: 70, torque: 103, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.0L GTi', displacement: '1.0L', fuelType: 'petrol', horsepower: 73, torque: 87, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'EA',
            displayName: 'EA (2nd Gen, 1989-1994)',
            startYear: 1989,
            endYear: 1994,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0L G10', displacement: '1.0L', fuelType: 'petrol', horsepower: 53, torque: 78, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.3L G13B', displacement: '1.3L', fuelType: 'petrol', horsepower: 72, torque: 106, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.3L GTi', displacement: '1.3L', fuelType: 'petrol', horsepower: 101, torque: 118, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'HT',
            displayName: 'HT (3rd Gen, 2004-2010)',
            startYear: 2004,
            endYear: 2010,
            bodyType: 'hatchback',
            engines: [
                { name: '1.3L M13A', displacement: '1.3L', fuelType: 'petrol', horsepower: 92, torque: 118, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.5L M15A', displacement: '1.5L', fuelType: 'petrol', horsepower: 102, torque: 133, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.5L M15A (Auto)', displacement: '1.5L', fuelType: 'petrol', horsepower: 102, torque: 133, transmission: 'automatic', drivetrain: 'fwd' },
                { name: '1.3L DDiS', displacement: '1.3L', fuelType: 'diesel', horsepower: 75, torque: 190, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'FZ/NZ',
            displayName: 'FZ/NZ (4th Gen, 2010-2017)',
            startYear: 2010,
            endYear: 2017,
            bodyType: 'hatchback',
            engines: [
                { name: '1.2L K12B', displacement: '1.2L', fuelType: 'petrol', horsepower: 94, torque: 118, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L K12B (CVT)', displacement: '1.2L', fuelType: 'petrol', horsepower: 94, torque: 118, transmission: 'cvt', drivetrain: 'fwd' },
                { name: '1.2L DualJet', displacement: '1.2L', fuelType: 'petrol', horsepower: 90, torque: 120, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14B', displacement: '1.4L', fuelType: 'petrol', horsepower: 95, torque: 130, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.3L DDiS', displacement: '1.3L', fuelType: 'diesel', horsepower: 75, torque: 190, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L DualJet SHVS (Mild Hybrid)', displacement: '1.2L', fuelType: 'hybrid', horsepower: 90, torque: 120, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'AZ',
            displayName: 'AZ (5th Gen, 2017-present)',
            startYear: 2017,
            endYear: undefined,
            bodyType: 'hatchback',
            engines: [
                { name: '1.0L K10C BoosterJet', displacement: '1.0L', fuelType: 'petrol', horsepower: 111, torque: 170, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L K12C DualJet', displacement: '1.2L', fuelType: 'petrol', horsepower: 90, torque: 120, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L K12C DualJet (CVT)', displacement: '1.2L', fuelType: 'petrol', horsepower: 90, torque: 120, transmission: 'cvt', drivetrain: 'fwd' },
                { name: '1.2L K12C SHVS (Mild Hybrid)', displacement: '1.2L', fuelType: 'hybrid', horsepower: 83, torque: 107, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L K12C SHVS AWD', displacement: '1.2L', fuelType: 'hybrid', horsepower: 83, torque: 107, transmission: 'cvt', drivetrain: 'awd' },
            ],
        },
    ],
    'Swift Sport': [
        {
            name: 'HT',
            displayName: 'HT Sport (2005-2011)',
            startYear: 2005,
            endYear: 2011,
            bodyType: 'hatchback',
            engines: [
                { name: '1.6L M16A', displacement: '1.6L', fuelType: 'petrol', horsepower: 125, torque: 148, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'ZC32S',
            displayName: 'ZC32S (2011-2017)',
            startYear: 2011,
            endYear: 2017,
            bodyType: 'hatchback',
            engines: [
                { name: '1.6L M16A', displacement: '1.6L', fuelType: 'petrol', horsepower: 136, torque: 160, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6L M16A (CVT)', displacement: '1.6L', fuelType: 'petrol', horsepower: 136, torque: 160, transmission: 'cvt', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'ZC33S',
            displayName: 'ZC33S (2017-present)',
            startYear: 2017,
            endYear: undefined,
            bodyType: 'hatchback',
            engines: [
                { name: '1.4L K14C BoosterJet', displacement: '1.4L', fuelType: 'petrol', horsepower: 140, torque: 230, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14D BoosterJet SHVS', displacement: '1.4L', fuelType: 'hybrid', horsepower: 129, torque: 235, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
    ],
    'Jimny': [
        {
            name: 'SJ',
            displayName: 'SJ (2nd Gen, 1981-1998)',
            startYear: 1981,
            endYear: 1998,
            bodyType: 'suv',
            engines: [
                { name: '1.0L F10A', displacement: '1.0L', fuelType: 'petrol', horsepower: 45, torque: 72, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.3L G13A', displacement: '1.3L', fuelType: 'petrol', horsepower: 70, torque: 103, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.3L G13BA', displacement: '1.3L', fuelType: 'petrol', horsepower: 80, torque: 110, transmission: 'manual', drivetrain: '4wd' },
            ],
        },
        {
            name: 'JB23/JB43',
            displayName: 'JB23/JB43 (3rd Gen, 1998-2018)',
            startYear: 1998,
            endYear: 2018,
            bodyType: 'suv',
            engines: [
                { name: '0.66L K6A Turbo', displacement: '0.66L', fuelType: 'petrol', horsepower: 64, torque: 103, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.3L G13BB', displacement: '1.3L', fuelType: 'petrol', horsepower: 85, torque: 110, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.3L M13A', displacement: '1.3L', fuelType: 'petrol', horsepower: 85, torque: 110, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.3L M13A (Auto)', displacement: '1.3L', fuelType: 'petrol', horsepower: 85, torque: 110, transmission: 'automatic', drivetrain: '4wd' },
                { name: '1.5L DDiS', displacement: '1.5L', fuelType: 'diesel', horsepower: 86, torque: 200, transmission: 'manual', drivetrain: '4wd' },
            ],
        },
        {
            name: 'JB64/JB74',
            displayName: 'JB64/JB74 (4th Gen, 2018-present)',
            startYear: 2018,
            endYear: undefined,
            bodyType: 'suv',
            engines: [
                { name: '0.66L R06A Turbo', displacement: '0.66L', fuelType: 'petrol', horsepower: 64, torque: 96, transmission: 'manual', drivetrain: '4wd' },
                { name: '0.66L R06A Turbo (Auto)', displacement: '0.66L', fuelType: 'petrol', horsepower: 64, torque: 96, transmission: 'automatic', drivetrain: '4wd' },
                { name: '1.5L K15B', displacement: '1.5L', fuelType: 'petrol', horsepower: 102, torque: 130, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.5L K15B (Auto)', displacement: '1.5L', fuelType: 'petrol', horsepower: 102, torque: 130, transmission: 'automatic', drivetrain: '4wd' },
                { name: '1.5L K15B SHVS', displacement: '1.5L', fuelType: 'hybrid', horsepower: 102, torque: 130, transmission: 'automatic', drivetrain: '4wd' },
            ],
        },
    ],
    'Vitara': [
        {
            name: 'ET/TA',
            displayName: 'ET/TA (1st Gen, 1988-1998)',
            startYear: 1988,
            endYear: 1998,
            bodyType: 'suv',
            engines: [
                { name: '1.6L G16A', displacement: '1.6L', fuelType: 'petrol', horsepower: 80, torque: 134, transmission: 'manual', drivetrain: '4wd' },
                { name: '1.6L G16B', displacement: '1.6L', fuelType: 'petrol', horsepower: 97, torque: 134, transmission: 'manual', drivetrain: '4wd' },
                { name: '2.0L V6', displacement: '2.0L', fuelType: 'petrol', horsepower: 136, torque: 176, transmission: 'automatic', drivetrain: '4wd' },
                { name: '2.0L TD', displacement: '2.0L', fuelType: 'diesel', horsepower: 87, torque: 190, transmission: 'manual', drivetrain: '4wd' },
            ],
        },
        {
            name: 'LY',
            displayName: 'LY (4th Gen, 2015-present)',
            startYear: 2015,
            endYear: undefined,
            bodyType: 'suv',
            engines: [
                { name: '1.4L K14C BoosterJet', displacement: '1.4L', fuelType: 'petrol', horsepower: 140, torque: 220, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14C BoosterJet (Auto)', displacement: '1.4L', fuelType: 'petrol', horsepower: 140, torque: 220, transmission: 'automatic', drivetrain: 'fwd' },
                { name: '1.4L K14C BoosterJet AWD', displacement: '1.4L', fuelType: 'petrol', horsepower: 140, torque: 220, transmission: 'automatic', drivetrain: 'awd' },
                { name: '1.6L D16AA DDiS', displacement: '1.6L', fuelType: 'diesel', horsepower: 120, torque: 320, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6L D16AA DDiS AWD', displacement: '1.6L', fuelType: 'diesel', horsepower: 120, torque: 320, transmission: 'automatic', drivetrain: 'awd' },
                { name: '1.0L K10C BoosterJet', displacement: '1.0L', fuelType: 'petrol', horsepower: 111, torque: 170, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14D BoosterJet SHVS', displacement: '1.4L', fuelType: 'hybrid', horsepower: 129, torque: 235, transmission: 'automatic', drivetrain: 'fwd' },
                { name: '1.5L K15C DualJet SHVS', displacement: '1.5L', fuelType: 'hybrid', horsepower: 102, torque: 138, transmission: 'automatic', drivetrain: 'fwd' },
            ],
        },
    ],
    'SX4': [
        {
            name: 'GY',
            displayName: 'GY (1st Gen, 2006-2014)',
            startYear: 2006,
            endYear: 2014,
            bodyType: 'hatchback',
            engines: [
                { name: '1.5L M15A', displacement: '1.5L', fuelType: 'petrol', horsepower: 112, torque: 145, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6L M16A', displacement: '1.6L', fuelType: 'petrol', horsepower: 107, torque: 145, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6L M16A AWD', displacement: '1.6L', fuelType: 'petrol', horsepower: 107, torque: 145, transmission: 'manual', drivetrain: 'awd' },
                { name: '2.0L J20A', displacement: '2.0L', fuelType: 'petrol', horsepower: 145, torque: 190, transmission: 'automatic', drivetrain: 'awd' },
                { name: '1.6L DDiS', displacement: '1.6L', fuelType: 'diesel', horsepower: 90, torque: 215, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.9L DDiS', displacement: '1.9L', fuelType: 'diesel', horsepower: 120, torque: 280, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
    ],
    'S-Cross': [
        {
            name: 'YA',
            displayName: 'YA (1st Gen, 2013-2021)',
            startYear: 2013,
            endYear: 2021,
            bodyType: 'suv',
            engines: [
                { name: '1.6L M16A', displacement: '1.6L', fuelType: 'petrol', horsepower: 120, torque: 156, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.6L M16A AWD', displacement: '1.6L', fuelType: 'petrol', horsepower: 120, torque: 156, transmission: 'cvt', drivetrain: 'awd' },
                { name: '1.0L K10C BoosterJet', displacement: '1.0L', fuelType: 'petrol', horsepower: 111, torque: 170, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14C BoosterJet', displacement: '1.4L', fuelType: 'petrol', horsepower: 140, torque: 220, transmission: 'automatic', drivetrain: 'awd' },
                { name: '1.6L DDiS', displacement: '1.6L', fuelType: 'diesel', horsepower: 120, torque: 320, transmission: 'manual', drivetrain: 'fwd' },
            ],
        },
        {
            name: 'YB',
            displayName: 'YB (2nd Gen, 2021-present)',
            startYear: 2021,
            endYear: undefined,
            bodyType: 'suv',
            engines: [
                { name: '1.4L K14D BoosterJet SHVS', displacement: '1.4L', fuelType: 'hybrid', horsepower: 129, torque: 235, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.4L K14D BoosterJet SHVS (Auto)', displacement: '1.4L', fuelType: 'hybrid', horsepower: 129, torque: 235, transmission: 'automatic', drivetrain: 'fwd' },
                { name: '1.4L K14D BoosterJet SHVS AWD', displacement: '1.4L', fuelType: 'hybrid', horsepower: 129, torque: 235, transmission: 'automatic', drivetrain: 'awd' },
                { name: '1.5L K15C DualJet SHVS', displacement: '1.5L', fuelType: 'hybrid', horsepower: 102, torque: 138, transmission: 'automatic', drivetrain: 'fwd' },
            ],
        },
    ],
    'Ignis': [
        {
            name: 'MF',
            displayName: 'MF (2nd Gen, 2016-present)',
            startYear: 2016,
            endYear: undefined,
            bodyType: 'hatchback',
            engines: [
                { name: '1.2L K12C DualJet', displacement: '1.2L', fuelType: 'petrol', horsepower: 90, torque: 120, transmission: 'manual', drivetrain: 'fwd' },
                { name: '1.2L K12C DualJet (CVT)', displacement: '1.2L', fuelType: 'petrol', horsepower: 90, torque: 120, transmission: 'cvt', drivetrain: 'fwd' },
                { name: '1.2L K12C SHVS', displacement: '1.2L', fuelType: 'hybrid', horsepower: 83, torque: 107, transmission: 'cvt', drivetrain: 'fwd' },
                { name: '1.2L K12C SHVS AWD', displacement: '1.2L', fuelType: 'hybrid', horsepower: 83, torque: 107, transmission: 'cvt', drivetrain: 'awd' },
            ],
        },
    ],
}
