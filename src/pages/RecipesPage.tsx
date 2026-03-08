import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { calculateNutrition } from '@/lib/recipeCalculations'
import { registerCustomIngredients } from '@/lib/ingredientRegistry'
import { fetchCustomIngredients } from '@/lib/customIngredients'
import { TOXIC_FOODS, SEVERITY_DOT, SEVERITY_LABEL } from '@/lib/toxicFoods'
import type { Recipe, Pet } from '@/types'
import { Plus, UtensilsCrossed, ChevronRight, Flame, AlertTriangle } from 'lucide-react'

// ── Recipe Card ───────────────────────────────────────────────────────────────
function RecipeCard({ recipe, pets }: { recipe: Recipe; pets: Pet[] }) {
  const nutrition = calculateNutrition(recipe.ingredients)
  const pet = pets.find(p => p.id === recipe.pet_id)

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block bg-card rounded-2xl border border-border shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60" />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground leading-tight line-clamp-1">{recipe.name}</h3>
            {pet && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {pet.species === 'dog' ? '🐶' : '🐱'} {pet.name}
              </p>
            )}
          </div>
          <ChevronRight size={18} className="text-muted-foreground mt-0.5 shrink-0 ml-2" />
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame size={12} className="text-primary" />
            {Math.round(nutrition.totalKcal)} kcal
          </span>
          <span>·</span>
          <span>{recipe.ingredients.length} ingredients</span>
          <span>·</span>
          <span>{nutrition.protein_g.toFixed(1)}g protein</span>
        </div>
      </div>
    </Link>
  )
}

// ── Toxic Foods quick-reference ───────────────────────────────────────────────
function ToxicQuickList() {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? TOXIC_FOODS : TOXIC_FOODS.slice(0, 5)

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600 shrink-0" />
        <h3 className="text-sm font-semibold text-red-700">Foods to Avoid</h3>
      </div>
      <div className="p-2">
        {shown.map(food => (
          <div key={food.name} className="flex items-start gap-3 px-2 py-2.5">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[food.severity]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">{food.name}</span>
                {food.localNames && food.localNames.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({food.localNames.join(', ')})
                  </span>
                )}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  food.severity === 'fatal'
                    ? 'bg-red-100 text-red-700'
                    : food.severity === 'dangerous'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {SEVERITY_LABEL[food.severity]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{food.reason}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-3 text-sm text-primary font-medium border-t border-border hover:bg-muted/30 transition-colors"
      >
        {expanded ? 'Show less' : `Show all ${TOXIC_FOODS.length} foods to avoid`}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecipesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('pets').select('*').eq('user_id', user.id),
      fetchCustomIngredients(user.id),
    ]).then(([recipesRes, petsRes, customIngs]) => {
      if (recipesRes.data) setRecipes(recipesRes.data as Recipe[])
      if (petsRes.data) setPets(petsRes.data as Pet[])
      // Register custom ingredients so recipe card nutrition calculations work
      registerCustomIngredients(customIngs)
      setLoading(false)
    })
  }, [user])

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="pt-2 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
          <p className="text-sm text-muted-foreground">Build and save meal recipes</p>
        </div>
        <button
          onClick={() => navigate('/recipes/new')}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        >
          <Plus size={16} />
          New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recipe list */}
          {recipes.length > 0 ? (
            <div className="space-y-3">
              {recipes.map(r => (
                <RecipeCard key={r.id} recipe={r} pets={pets} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center px-6 py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <UtensilsCrossed size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No recipes yet</h2>
              <p className="text-muted-foreground text-sm mb-5">
                Build a balanced meal recipe using Philippine ingredients with AAFCO nutrition scoring.
              </p>
              <button
                onClick={() => navigate('/recipes/new')}
                className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
              >
                <Plus size={18} />
                Create First Recipe
              </button>
            </div>
          )}

          {/* Toxic foods reference card */}
          <ToxicQuickList />
        </div>
      )}
    </div>
  )
}
