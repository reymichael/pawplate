/**
 * Ingredient Registry — merges the static Philippine library with the user's
 * custom ingredients fetched from Supabase.
 *
 * Call `registerCustomIngredients(list)` after fetching from Supabase so that
 * `calculateNutrition` and `RecipeDetailPage` can resolve custom ingredient IDs.
 */
import { INGREDIENTS } from './ingredients'
import type { IngredientData } from '@/types'

export { CATEGORY_LABEL, CATEGORY_ORDER } from './ingredients'

// Module-level runtime cache — safe for SPA (single user per session)
let _custom: IngredientData[] = []

/** Register the current user's custom ingredients into the runtime cache */
export function registerCustomIngredients(list: IngredientData[]): void {
  _custom = list
}

/** Returns built-in + custom ingredients merged */
export function getAllIngredients(): IngredientData[] {
  return [...INGREDIENTS, ..._custom]
}

/** Look up an ingredient by ID (built-in first, then custom cache) */
export function getIngredientById(id: string): IngredientData | undefined {
  return INGREDIENTS.find(i => i.id === id) ?? _custom.find(i => i.id === id)
}
