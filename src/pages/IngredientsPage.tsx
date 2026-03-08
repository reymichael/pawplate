import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FlaskConical, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchCustomIngredients, deleteCustomIngredient } from '@/lib/customIngredients'
import { CATEGORY_LABEL } from '@/lib/ingredients'
import type { IngredientData } from '@/types'
import { toast } from 'sonner'

export default function IngredientsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ingredients, setIngredients] = useState<IngredientData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchCustomIngredients(user.id).then(data => {
      setIngredients(data)
      setLoading(false)
    })
  }, [user])

  async function handleDelete(ingredient: IngredientData) {
    if (!user) return
    const uuid = ingredient.id.replace('custom_', '')
    setDeleting(ingredient.id)
    try {
      await deleteCustomIngredient(uuid, user.id)
      setIngredients(prev => prev.filter(i => i.id !== ingredient.id))
      toast.success(`${ingredient.name} deleted`)
    } catch {
      toast.error('Could not delete ingredient')
    }
    setDeleting(null)
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="pt-2 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Ingredients</h1>
          <p className="text-sm text-muted-foreground">Custom ingredients for recipes</p>
        </div>
        <button
          onClick={() => navigate('/ingredients/new')}
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
      ) : ingredients.length === 0 ? (
        <div className="flex flex-col items-center text-center px-6 py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <FlaskConical size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No custom ingredients</h2>
          <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
            Add local brands, wet food, or home-cooked ingredients not in the built-in library.
            Enter values per 100g from the product label.
          </p>
          <button
            onClick={() => navigate('/ingredients/new')}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
          >
            <Plus size={18} />
            Add First Ingredient
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {ingredients.map(ing => (
            <div
              key={ing.id}
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground leading-tight truncate">{ing.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CATEGORY_LABEL[ing.category]} · {ing.kcal} kcal · {ing.protein_g.toFixed(1)}g protein
                  <span className="text-muted-foreground"> per 100g</span>
                </p>
              </div>
              <button
                onClick={() => navigate(`/ingredients/${ing.id.replace('custom_', '')}/edit`)}
                className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="Edit ingredient"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(ing)}
                disabled={deleting === ing.id}
                className="p-2 rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                aria-label="Delete ingredient"
              >
                {deleting === ing.id
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Trash2 size={16} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Built-in library note */}
      <div className="mt-6 bg-muted/40 rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">36 built-in ingredients</span> from the Philippine
          pet ingredient library are automatically available in the recipe builder — no need to add them here.
        </p>
      </div>
    </div>
  )
}
