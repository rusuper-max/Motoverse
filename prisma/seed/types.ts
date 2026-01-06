// Type definitions for car seed data

export interface EngineData {
    name: string
    displacement?: string
    fuelType: string
    horsepower?: number
    torque?: number
    transmission?: string
    drivetrain?: string
}

export interface GenerationData {
    name: string           // Internal chassis code (8N, E90, etc.)
    displayName: string    // User-friendly display with chassis code
    startYear: number
    endYear?: number
    bodyType?: string
    engines: EngineData[]
}

export type BrandGenerations = Record<string, GenerationData[]>
