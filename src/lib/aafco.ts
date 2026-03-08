import type { Species, NutritionSummary, NutrientScore, BalanceScore } from '@/types'

/**
 * AAFCO 2016 Nutrient Profiles for Dogs and Cats (Adult Maintenance).
 * All values expressed per 1,000 kcal ME (metabolizable energy).
 *
 * Source: AAFCO 2016 Official Publication, Table 1 (dogs) & Table 2 (cats).
 */

export interface AafcoTarget {
  key: keyof NutritionSummary
  name: string
  unit: string
  dog_min: number
  dog_max?: number
  cat_min: number
  cat_max?: number
}

/** Nutrients tracked for the Balance Score Card */
export const AAFCO_TARGETS: AafcoTarget[] = [
  {
    key: 'protein_g',
    name: 'Protein',
    unit: 'g',
    dog_min: 45,
    cat_min: 65,
  },
  {
    key: 'fat_g',
    name: 'Fat',
    unit: 'g',
    dog_min: 13.8,
    cat_min: 22.5,
  },
  {
    key: 'calcium_mg',
    name: 'Calcium',
    unit: 'mg',
    dog_min: 1250,
    dog_max: 6250,
    cat_min: 1500,
    cat_max: 10000,
  },
  {
    key: 'phosphorus_mg',
    name: 'Phosphorus',
    unit: 'mg',
    dog_min: 1000,
    dog_max: 4000,
    cat_min: 1250,
    cat_max: 8400,
  },
  {
    key: 'iron_mg',
    name: 'Iron',
    unit: 'mg',
    dog_min: 10,
    cat_min: 20,
  },
  {
    key: 'zinc_mg',
    name: 'Zinc',
    unit: 'mg',
    dog_min: 20,
    cat_min: 18.75,
  },
  {
    key: 'vitamin_a_iu',
    name: 'Vitamin A',
    unit: 'IU',
    dog_min: 1250,
    dog_max: 62500,
    cat_min: 833,
    cat_max: 83300,
  },
  {
    key: 'taurine_mg',
    name: 'Taurine',
    unit: 'mg',
    dog_min: 0,       // not required for dogs
    cat_min: 250,     // AAFCO minimum for cats (dry basis equivalent)
  },
  {
    key: 'omega3_mg',
    name: 'Omega-3 (EPA+DHA)',
    unit: 'mg',
    dog_min: 0,       // no AAFCO minimum but beneficial
    cat_min: 0,
  },
]

/**
 * Normalise a nutrition summary to per-1000-kcal then score against AAFCO.
 * Returns the full BalanceScore with per-nutrient breakdown.
 */
export function scoreRecipe(nutrition: NutritionSummary, species: Species): BalanceScore {
  const { totalKcal } = nutrition
  // Avoid divide-by-zero
  const factor = totalKcal > 0 ? 1000 / totalKcal : 0

  const nutrients: NutrientScore[] = []

  for (const target of AAFCO_TARGETS) {
    const min = species === 'dog' ? target.dog_min : target.cat_min
    const max = species === 'dog' ? target.dog_max : target.cat_max

    // Skip taurine for dogs (not required) and omega3 (informational only)
    if (species === 'dog' && target.key === 'taurine_mg') continue
    if (target.key === 'omega3_mg') continue

    const raw = nutrition[target.key] as number
    const actual = raw * factor  // per 1000 kcal

    let pct = min > 0 ? Math.min((actual / min) * 100, 150) : 100
    let status: NutrientScore['status'] = 'ok'

    if (min > 0 && actual < min * 0.9) status = 'low'
    else if (max !== undefined && actual > max) status = 'high'

    nutrients.push({ name: target.name, unit: target.unit, actual, min, max, pct, status })
  }

  // Overall score = average pct of minimums met (capped at 100 per nutrient)
  const scored = nutrients.filter(n => n.min > 0)
  const overall = scored.length > 0
    ? Math.round(scored.reduce((sum, n) => sum + Math.min(n.pct, 100), 0) / scored.length)
    : 0

  return { overall, species, nutrients }
}

/** Human-readable label for overall score */
export function scoreLabel(overall: number): string {
  if (overall >= 90) return 'Excellent'
  if (overall >= 75) return 'Good'
  if (overall >= 50) return 'Needs Work'
  return 'Incomplete'
}

export function scoreColor(overall: number): string {
  if (overall >= 90) return 'text-emerald-600'
  if (overall >= 75) return 'text-green-600'
  if (overall >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function scoreBg(overall: number): string {
  if (overall >= 90) return 'bg-emerald-500'
  if (overall >= 75) return 'bg-green-500'
  if (overall >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}
