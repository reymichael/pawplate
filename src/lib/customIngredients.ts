/**
 * Helpers for user-created custom ingredients stored in Supabase.
 * Custom ingredient IDs use the prefix "custom_" + UUID.
 */
import type { IngredientData } from '@/types'
import { supabase } from '@/lib/supabase'

export interface CustomIngredientRow {
  id: string
  user_id: string
  name: string
  category: string
  kcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
  fiber_g: number
  calcium_mg: number
  phosphorus_mg: number
  iron_mg: number
  zinc_mg: number
  vitamin_a_iu: number
  vitamin_d_iu: number
  taurine_mg: number
  omega3_mg: number
  notes: string | null
  created_at: string
}

/** Convert a Supabase row to the shared IngredientData interface */
export function rowToIngredient(row: CustomIngredientRow): IngredientData {
  return {
    id: `custom_${row.id}`,
    name: row.name,
    category: row.category as IngredientData['category'],
    kcal: Number(row.kcal),
    protein_g: Number(row.protein_g),
    fat_g: Number(row.fat_g),
    carbs_g: Number(row.carbs_g),
    fiber_g: Number(row.fiber_g),
    calcium_mg: Number(row.calcium_mg),
    phosphorus_mg: Number(row.phosphorus_mg),
    iron_mg: Number(row.iron_mg),
    zinc_mg: Number(row.zinc_mg),
    vitamin_a_iu: Number(row.vitamin_a_iu),
    vitamin_d_iu: Number(row.vitamin_d_iu),
    taurine_mg: Number(row.taurine_mg),
    omega3_mg: Number(row.omega3_mg),
    notes: row.notes ?? undefined,
    isPhIngredient: false,
  }
}

/** Fetch all custom ingredients for a user and return as IngredientData[] */
export async function fetchCustomIngredients(userId: string): Promise<IngredientData[]> {
  const { data, error } = await supabase
    .from('custom_ingredients')
    .select('*')
    .eq('user_id', userId)
    .order('name')
  if (error || !data) return []
  return (data as CustomIngredientRow[]).map(rowToIngredient)
}

/** Delete a custom ingredient by its UUID (without the "custom_" prefix) */
export async function deleteCustomIngredient(uuid: string, userId: string): Promise<void> {
  await supabase
    .from('custom_ingredients')
    .delete()
    .eq('id', uuid)
    .eq('user_id', userId)
}
