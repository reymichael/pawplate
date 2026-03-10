/**
 * autoBalance.ts
 *
 * Automatically computes gram amounts for a set of selected ingredients so
 * that the recipe:
 *  1. Follows AAFCO-informed category weight ratios for homemade pet diets.
 *  2. Scales the total recipe so its caloric content matches the pet's daily
 *     Maintenance Energy Requirement (MER).
 *
 * Category ratio reference:
 *  - Dogs: omnivores — protein ~40%, organ ~10%, vegetables ~22%, grain ~8%
 *  - Cats: obligate carnivores — protein ~50%, organ ~10%, vegetables ~12%,
 *    grains minimal (2%)
 *
 * Algorithm:
 *  1. Separate supplements (calcium sources etc.) — given a small fixed dose.
 *  2. Group remaining ingredients by category.
 *  3. Apply species-appropriate target weight fractions per category.
 *  4. Normalize fractions to the categories actually present (so they sum to 1).
 *  5. Distribute grams equally within each category.
 *  6. Compute kcal for the resulting base recipe.
 *  7. Scale all main-ingredient grams so total kcal ≈ petMerKcal.
 *     (Supplements are NOT scaled — they stay at a safe fixed dose.)
 */

import type { IngredientData, IngredientCategory } from '@/types'
import { getIngredientById } from '@/lib/ingredientRegistry'
import { calculateNutrition } from '@/lib/recipeCalculations'

export interface DraftLine {
  ingredient_id: string
  grams: number
}

// ---------------------------------------------------------------------------
// Category weight targets
// ---------------------------------------------------------------------------

/**
 * Target proportion of total recipe weight for each ingredient category.
 * These reflect veterinary nutrition guidelines for complete homemade diets
 * based on AAFCO 2016 Adult Maintenance profiles.
 */
const CATEGORY_TARGETS: Record<IngredientCategory, { dog: number; cat: number }> = {
  protein:    { dog: 0.40, cat: 0.50 },  // Muscle meat — main protein source
  organ:      { dog: 0.10, cat: 0.10 },  // Organs — nutrient-dense; capped to avoid toxicity
  fish:       { dog: 0.12, cat: 0.12 },  // Fish — omega-3, taurine for cats
  egg:        { dog: 0.05, cat: 0.05 },  // Eggs — high-quality complete protein
  vegetable:  { dog: 0.22, cat: 0.12 },  // Vegetables — fiber, vitamins, minerals
  grain:      { dog: 0.08, cat: 0.02 },  // Grains — energy; cats don't need much
  fruit:      { dog: 0.03, cat: 0.02 },  // Fruit — treat-level only
  fat:        { dog: 0.02, cat: 0.03 },  // Added fats — omega-3 sources etc.
  supplement: { dog: 0.00, cat: 0.00 },  // Calcium supplements — fixed dose only
}

/**
 * Supplements (eggshell powder, bone meal) are calcium / mineral boosters.
 * They are dosed by nutritional need, not by recipe weight — so we give
 * a small fixed amount rather than scaling them with the rest of the recipe.
 *
 * ~3g eggshell powder ≈ 690 mg calcium (modest top-up).
 * ~5g bone meal ≈ 150 mg calcium + balanced Ca:P.
 */
const SUPPLEMENT_FIXED_G: Record<string, number> = {
  eggshell_powder: 3,
  bone_meal: 5,
}
const DEFAULT_SUPPLEMENT_G = 3

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Auto-balance a selection of ingredients to AAFCO-aligned category ratios,
 * scaled so total recipe kcal ≈ the pet's daily MER.
 *
 * @param selectedIds   Ingredient IDs chosen by the user
 * @param species       'dog' | 'cat' (determines category ratios)
 * @param petMerKcal    Pet's daily energy requirement in kcal.
 *                      Pass 0 or omit if no pet is selected — in that case the
 *                      function still balances proportions but doesn't scale.
 * @returns             DraftLine[] with computed gram values (min 1 g each)
 */
export function autoBalance(
  selectedIds: string[],
  species: 'dog' | 'cat',
  petMerKcal = 0,
): DraftLine[] {
  if (selectedIds.length === 0) return []

  // ── 1. Resolve ingredient objects ─────────────────────────────────────────
  const ingredients = selectedIds
    .map(id => getIngredientById(id))
    .filter((ing): ing is IngredientData => Boolean(ing))

  if (ingredients.length === 0) return []

  // ── 2. Separate supplements from main ingredients ─────────────────────────
  const supplements = ingredients.filter(i => i.category === 'supplement')
  const main = ingredients.filter(i => i.category !== 'supplement')

  // ── 3. Group main ingredients by category ─────────────────────────────────
  const groups = new Map<IngredientCategory, IngredientData[]>()
  for (const ing of main) {
    if (!groups.has(ing.category)) groups.set(ing.category, [])
    groups.get(ing.category)!.push(ing)
  }

  // Edge case: only supplements selected — return them at fixed dose
  if (groups.size === 0) {
    return supplements.map(s => ({
      ingredient_id: s.id,
      grams: SUPPLEMENT_FIXED_G[s.id] ?? DEFAULT_SUPPLEMENT_G,
    }))
  }

  // ── 4. Gather raw fractions for present categories ────────────────────────
  let fractionSum = 0
  const rawFractions = new Map<IngredientCategory, number>()
  for (const [cat] of groups) {
    const target = CATEGORY_TARGETS[cat][species]
    rawFractions.set(cat, target)
    fractionSum += target
  }

  // ── 5. Normalize fractions to sum to 1.0 ──────────────────────────────────
  const normalizedFractions = new Map<IngredientCategory, number>()
  for (const [cat, frac] of rawFractions) {
    normalizedFractions.set(
      cat,
      fractionSum > 0 ? frac / fractionSum : 1 / groups.size,
    )
  }

  // ── 6. Assign grams for a base 1 000 g recipe (main ingredients only) ─────
  const BASE_TOTAL_G = 1000
  const baseGrams = new Map<string, number>()

  for (const [cat, catIngredients] of groups) {
    const fraction = normalizedFractions.get(cat) ?? 0
    const categoryGrams = BASE_TOTAL_G * fraction
    const perIngredient = categoryGrams / catIngredients.length

    for (const ing of catIngredients) {
      baseGrams.set(ing.id, perIngredient)
    }
  }

  // ── 7. Compute base kcal ──────────────────────────────────────────────────
  const baseLines: DraftLine[] = [
    ...[...baseGrams.entries()].map(([id, g]) => ({ ingredient_id: id, grams: g })),
    ...supplements.map(s => ({
      ingredient_id: s.id,
      grams: SUPPLEMENT_FIXED_G[s.id] ?? DEFAULT_SUPPLEMENT_G,
    })),
  ]

  const baseKcal = calculateNutrition(baseLines).totalKcal

  // ── 8. Scale to petMerKcal ────────────────────────────────────────────────
  // If no pet is selected (petMerKcal=0) or base has no kcal, keep scale = 1.
  const scaleFactor =
    petMerKcal > 0 && baseKcal > 0 ? petMerKcal / baseKcal : 1

  // ── 9. Build final lines ──────────────────────────────────────────────────
  const result: DraftLine[] = []

  for (const [id, g] of baseGrams) {
    result.push({
      ingredient_id: id,
      grams: Math.max(1, Math.round(g * scaleFactor)),
    })
  }

  // Supplements keep their fixed dose — not scaled with caloric content
  for (const sup of supplements) {
    result.push({
      ingredient_id: sup.id,
      grams: SUPPLEMENT_FIXED_G[sup.id] ?? DEFAULT_SUPPLEMENT_G,
    })
  }

  return result
}
