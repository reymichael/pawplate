export interface UserProfile {
  id: string
  user_id: string
  onboarding_completed: boolean
  created_at: string
}

export type Species = 'dog' | 'cat'
export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'moderate' | 'active' | 'working'
export type LifeStage = 'puppy' | 'junior' | 'adult' | 'senior'
export type IngredientCategory = 'protein' | 'organ' | 'fish' | 'egg' | 'vegetable' | 'grain' | 'fruit' | 'fat' | 'supplement'

export interface Pet {
  id: string
  user_id: string
  name: string
  species: Species
  breed?: string | null
  birth_date?: string | null
  weight_kg: number
  sex?: Sex | null
  neutered: boolean
  activity_level: ActivityLevel
  body_condition_score: number
  health_notes?: string | null
  created_at: string
}

/** Static ingredient from the built-in Philippine library */
export interface IngredientData {
  id: string
  name: string
  category: IngredientCategory
  // all values per 100 g (cooked / as-fed)
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
  taurine_mg: number   // critical for cats
  omega3_mg: number
  notes?: string       // e.g. safety notes
  isPhIngredient?: boolean
}

/** One ingredient line inside a recipe */
export interface RecipeIngredient {
  ingredient_id: string
  grams: number
}

/** Full recipe row from Supabase */
export interface Recipe {
  id: string
  user_id: string
  pet_id?: string | null
  name: string
  ingredients: RecipeIngredient[]
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

/** Calculated totals for a full recipe (all ingredients combined) */
export interface NutritionSummary {
  totalKcal: number
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
  totalWeight_g: number
  ca_p_ratio: number
}

/** Per-nutrient AAFCO compliance result */
export interface NutrientScore {
  name: string
  unit: string
  actual: number       // per 1000 kcal
  min: number          // AAFCO minimum per 1000 kcal
  max?: number         // AAFCO maximum (if set)
  pct: number          // % of minimum met (capped display at 150%)
  status: 'low' | 'ok' | 'high'
}

/** Full balance score card */
export interface BalanceScore {
  overall: number          // 0–100 average across tracked nutrients
  species: Species
  nutrients: NutrientScore[]
}
