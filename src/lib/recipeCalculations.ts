import type { RecipeIngredient, NutritionSummary } from '@/types'
import { getIngredientById } from '@/lib/ingredients'

/** Aggregate all ingredient lines into a single NutritionSummary */
export function calculateNutrition(ingredients: RecipeIngredient[]): NutritionSummary {
  const totals = {
    totalKcal: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    fiber_g: 0,
    calcium_mg: 0,
    phosphorus_mg: 0,
    iron_mg: 0,
    zinc_mg: 0,
    vitamin_a_iu: 0,
    vitamin_d_iu: 0,
    taurine_mg: 0,
    omega3_mg: 0,
    totalWeight_g: 0,
  }

  for (const line of ingredients) {
    const ing = getIngredientById(line.ingredient_id)
    if (!ing) continue
    const factor = line.grams / 100

    totals.totalKcal     += ing.kcal        * factor
    totals.protein_g     += ing.protein_g   * factor
    totals.fat_g         += ing.fat_g       * factor
    totals.carbs_g       += ing.carbs_g     * factor
    totals.fiber_g       += ing.fiber_g     * factor
    totals.calcium_mg    += ing.calcium_mg  * factor
    totals.phosphorus_mg += ing.phosphorus_mg * factor
    totals.iron_mg       += ing.iron_mg     * factor
    totals.zinc_mg       += ing.zinc_mg     * factor
    totals.vitamin_a_iu  += ing.vitamin_a_iu * factor
    totals.vitamin_d_iu  += ing.vitamin_d_iu * factor
    totals.taurine_mg    += ing.taurine_mg  * factor
    totals.omega3_mg     += ing.omega3_mg   * factor
    totals.totalWeight_g += line.grams
  }

  const ca_p_ratio = totals.phosphorus_mg > 0
    ? parseFloat((totals.calcium_mg / totals.phosphorus_mg).toFixed(2))
    : 0

  return { ...totals, ca_p_ratio }
}

/** Grams of protein/fat/carbs as % of total macros (for display donut) */
export function macroPercents(n: NutritionSummary) {
  const total = n.protein_g + n.fat_g + n.carbs_g
  if (total === 0) return { protein: 0, fat: 0, carbs: 0 }
  return {
    protein: Math.round((n.protein_g / total) * 100),
    fat: Math.round((n.fat_g / total) * 100),
    carbs: Math.round((n.carbs_g / total) * 100),
  }
}

/**
 * How many grams to feed per day for this pet.
 * = totalWeight_g × (petMerKcal / totalKcal)
 */
export function dailyServingGrams(n: NutritionSummary, petMerKcal: number): number {
  if (n.totalKcal === 0) return 0
  return Math.round((n.totalWeight_g * petMerKcal) / n.totalKcal)
}

/** Format a nutrient value for display */
export function fmtNutrient(value: number, unit: string): string {
  if (unit === 'g') return `${value.toFixed(1)} g`
  if (unit === 'mg') return value >= 1000
    ? `${(value / 1000).toFixed(2)} g`
    : `${Math.round(value)} mg`
  if (unit === 'IU') return `${Math.round(value).toLocaleString()} IU`
  return `${value.toFixed(1)} ${unit}`
}
