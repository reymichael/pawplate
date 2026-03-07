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

export interface Pet {
  id: string
  user_id: string
  name: string
  species: Species
  breed?: string
  birth_date?: string
  weight_kg: number
  sex?: Sex
  neutered: boolean
  activity_level: ActivityLevel
  body_condition_score: number
  health_notes?: string
  created_at: string
}

export interface IngredientData {
  id: string
  name: string
  category: 'protein' | 'carb' | 'veggie' | 'supplement'
  kcalPer100g: number
  protein_g: number
  fat_g: number
  carb_g: number
  calcium_mg: number
  phosphorus_mg: number
  cookYieldFactor: number
  isPhIngredient: boolean
  isCustom?: boolean
}

export interface RecipeIngredient {
  ingredient: IngredientData
  grams: number
}

export interface NutritionSummary {
  totalKcal: number
  proteinG: number
  fatG: number
  carbG: number
  calciumMg: number
  phosphorusMg: number
  totalWeightG: number
  proteinPctDM: number
  fatPctDM: number
  carbPctDM: number
  caPRatio: number
}
