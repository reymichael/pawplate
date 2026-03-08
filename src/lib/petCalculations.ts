import type { Pet, LifeStage } from '@/types'

/** Returns age in months, or null if no birth date */
export function getAgeMonths(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  return Math.max(0, months)
}

/** Life stage based on age */
export function getLifeStage(pet: Pet): LifeStage {
  const months = getAgeMonths(pet.birth_date)
  if (months === null) return 'adult'
  if (months < 12) return 'puppy'
  if (months < 24) return 'junior'
  const years = months / 12
  if (years >= 7) return 'senior'
  return 'adult'
}

/** Resting Energy Requirement: RER = 70 × weight_kg^0.75 */
export function calculateRER(weightKg: number): number {
  return 70 * Math.pow(weightKg, 0.75)
}

/** Maintenance Energy Requirement with activity & life-stage multipliers */
export function calculateMER(pet: Pet): number {
  const rer = calculateRER(pet.weight_kg)
  const lifeStage = getLifeStage(pet)
  const ageMonths = getAgeMonths(pet.birth_date)

  // Puppy multipliers
  if (lifeStage === 'puppy') {
    if (ageMonths !== null && ageMonths < 4) return rer * 3.0
    return rer * 2.5
  }

  // Neutered adult — overrides activity level
  if (pet.neutered) return rer * 1.6

  // Intact adult by activity level
  if (pet.activity_level === 'active' || pet.activity_level === 'working') return rer * 3.0
  if (pet.activity_level === 'sedentary') return rer * 1.8
  return rer * 2.0 // moderate
}

/** Body Condition Score label */
export function getBCSLabel(bcs: number): string {
  if (bcs <= 2) return 'Very Underweight'
  if (bcs <= 4) return 'Lean'
  if (bcs === 5) return 'Ideal'
  if (bcs <= 7) return 'Overweight'
  return 'Obese'
}

export function getBCSColor(bcs: number): string {
  if (bcs <= 2) return 'text-blue-600'
  if (bcs <= 4) return 'text-green-600'
  if (bcs === 5) return 'text-emerald-600'
  if (bcs <= 7) return 'text-amber-600'
  return 'text-red-600'
}

/** Format kcal for display */
export function formatKcal(kcal: number): string {
  return Math.round(kcal).toLocaleString()
}

/** Format life stage for display */
export function formatLifeStage(stage: LifeStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1)
}
