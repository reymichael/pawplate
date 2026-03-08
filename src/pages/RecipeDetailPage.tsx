import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { getIngredientById, registerCustomIngredients } from '@/lib/ingredientRegistry'
import { fetchCustomIngredients } from '@/lib/customIngredients'
import { calculateNutrition, macroPercents, dailyServingGrams, fmtNutrient } from '@/lib/recipeCalculations'
import { scoreRecipe, scoreLabel, scoreColor } from '@/lib/aafco'
import { calculateMER } from '@/lib/petCalculations'
import type { Recipe, Pet } from '@/types'
import { ArrowLeft, Pencil, Trash2, Flame, Scale } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_BAR: Record<string, string> = {
  low: 'bg-red-400',
  ok: 'bg-emerald-400',
  high: 'bg-amber-400',
}
const STATUS_LABEL: Record<string, string> = {
  low: 'Low',
  ok: '✓',
  high: 'High',
}
const STATUS_TEXT: Record<string, string> = {
  low: 'text-red-600',
  ok: 'text-emerald-600',
  high: 'text-amber-600',
}

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    fetchRecipe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  async function fetchRecipe() {
    setLoading(true)

    // Fetch recipe + custom ingredients in parallel
    const [{ data, error }, customIngs] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).eq('user_id', user!.id).single(),
      fetchCustomIngredients(user!.id),
    ])

    // Register custom ingredients so calculateNutrition can resolve their IDs
    registerCustomIngredients(customIngs)

    if (error || !data) {
      toast.error('Recipe not found.')
      navigate('/recipes')
      return
    }
    const r = data as Recipe
    setRecipe(r)

    // Fetch associated pet
    if (r.pet_id) {
      const { data: petData } = await supabase
        .from('pets')
        .select('*')
        .eq('id', r.pet_id)
        .single()
      if (petData) setPet(petData as Pet)
    }
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)

      if (error) throw error
      toast.success('Recipe deleted.')
      navigate('/recipes')
    } catch {
      toast.error('Could not delete recipe.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!recipe) return null

  const nutrition = calculateNutrition(recipe.ingredients)
  const macros = macroPercents(nutrition)
  const petMer = pet ? calculateMER(pet) : 0
  const servingG = pet ? dailyServingGrams(nutrition, petMer) : 0
  const score = pet ? scoreRecipe(nutrition, pet.species) : null

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/recipes')}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg line-clamp-1">{recipe.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Edit recipe"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-full hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
            aria-label="Delete recipe"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Pet badge */}
        {pet && (
          <div className="flex items-center gap-2">
            <span className="text-xl">{pet.species === 'dog' ? '🐶' : '🐱'}</span>
            <span className="text-sm text-muted-foreground">For {pet.name}</span>
          </div>
        )}

        {/* Energy overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Total Recipe</span>
            </div>
            <p className="text-xl font-bold text-foreground">{Math.round(nutrition.totalKcal)}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Scale size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Total Weight</span>
            </div>
            <p className="text-xl font-bold text-foreground">{Math.round(nutrition.totalWeight_g)}</p>
            <p className="text-xs text-muted-foreground">grams</p>
          </div>
        </div>

        {/* Daily serving */}
        {pet && servingG > 0 && (
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4">
            <p className="text-sm font-semibold text-foreground">
              Feed {pet.name} ~{servingG}g/day
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Covers daily energy needs ({Math.round(petMer)} kcal/day)
            </p>
          </div>
        )}

        {/* Macro bar */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Macronutrients</h3>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-3">
            <div className="bg-primary" style={{ width: `${macros.protein}%` }} />
            <div className="bg-amber-400" style={{ width: `${macros.fat}%` }} />
            <div className="bg-blue-400" style={{ width: `${macros.carbs}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Protein', value: nutrition.protein_g.toFixed(1), unit: 'g', color: 'text-primary' },
              { label: 'Fat', value: nutrition.fat_g.toFixed(1), unit: 'g', color: 'text-amber-600' },
              { label: 'Carbs', value: nutrition.carbs_g.toFixed(1), unit: 'g', color: 'text-blue-600' },
            ].map(m => (
              <div key={m.label}>
                <p className={`text-base font-bold ${m.color}`}>{m.value}{m.unit}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ca:P Ratio</span>
              <span className={`font-medium ${
                nutrition.ca_p_ratio >= 1 && nutrition.ca_p_ratio <= 2
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}>
                {nutrition.ca_p_ratio.toFixed(2)} : 1
                {nutrition.ca_p_ratio >= 1 && nutrition.ca_p_ratio <= 2 ? ' ✓' : ' (target 1–2:1)'}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Score Card */}
        {score && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">AAFCO Balance Score</h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${scoreColor(score.overall)}`}>
                  {score.overall}
                </span>
                <span className={`text-sm font-medium ${scoreColor(score.overall)}`}>
                  {scoreLabel(score.overall)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {score.nutrients.map(n => (
                <div key={n.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground font-medium">{n.name}</span>
                    <span className={`font-medium ${STATUS_TEXT[n.status]}`}>
                      {fmtNutrient(n.actual, n.unit)} / {fmtNutrient(n.min, n.unit)} min
                      {' '}{STATUS_LABEL[n.status]}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_BAR[n.status]}`}
                      style={{ width: `${Math.min(n.pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Values shown per 1,000 kcal. Targets based on AAFCO 2016 adult maintenance.
            </p>
          </div>
        )}

        {/* Micronutrients */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Micronutrients (total recipe)</h3>
          <div className="space-y-2">
            {[
              { label: 'Calcium', value: nutrition.calcium_mg, unit: 'mg' },
              { label: 'Phosphorus', value: nutrition.phosphorus_mg, unit: 'mg' },
              { label: 'Iron', value: nutrition.iron_mg, unit: 'mg' },
              { label: 'Zinc', value: nutrition.zinc_mg, unit: 'mg' },
              { label: 'Vitamin A', value: nutrition.vitamin_a_iu, unit: 'IU' },
              { label: 'Vitamin D', value: nutrition.vitamin_d_iu, unit: 'IU' },
              { label: 'Taurine', value: nutrition.taurine_mg, unit: 'mg' },
              { label: 'Omega-3', value: nutrition.omega3_mg, unit: 'mg' },
            ].map(m => (
              <div key={m.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="font-medium text-foreground">{fmtNutrient(m.value, m.unit)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredients list */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Ingredients ({recipe.ingredients.length})
          </h3>
          <div className="space-y-2">
            {recipe.ingredients.map(line => {
              const ing = getIngredientById(line.ingredient_id)
              if (!ing) return null
              const lineKcal = (ing.kcal * line.grams) / 100
              return (
                <div key={line.ingredient_id} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-foreground">{ing.name}</span>
                  <div className="text-right">
                    <span className="font-medium text-foreground">{line.grams}g</span>
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ({Math.round(lineKcal)} kcal)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Cooking Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{recipe.notes}</p>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-xl border">
            <h2 className="text-lg font-bold text-foreground mb-1">Delete "{recipe.name}"?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete this recipe. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
