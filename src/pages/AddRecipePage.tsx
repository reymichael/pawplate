import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  getAllIngredients,
  getIngredientById,
  registerCustomIngredients,
} from '@/lib/ingredientRegistry'
import { fetchCustomIngredients } from '@/lib/customIngredients'
import { calculateNutrition, dailyServingGrams } from '@/lib/recipeCalculations'
import { calculateMER } from '@/lib/petCalculations'
import { autoBalance } from '@/lib/autoBalance'
import type { Pet, IngredientData, RecipeIngredient } from '@/types'
import { ArrowLeft, Plus, ChevronDown, ChevronUp, Trash2, Wand2, PencilLine } from 'lucide-react'
import { toast } from 'sonner'
import IngredientPicker from '@/components/recipes/IngredientPicker'
import BalanceScoreCard from '@/components/recipes/BalanceScoreCard'

// ── Types ────────────────────────────────────────────────────────────────────
interface DraftLine {
  ingredient_id: string
  grams: number
}

type RecipeMode = 'manual' | 'auto'

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AddRecipePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pets, setPets] = useState<Pet[]>([])
  const [recipeName, setRecipeName] = useState('')
  const [selectedPetId, setSelectedPetId] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [notes, setNotes] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [nutritionOpen, setNutritionOpen] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<RecipeMode>('manual')
  const [isBalancing, setIsBalancing] = useState(false)
  /** true after Auto-Balance has been run at least once this session */
  const [hasBalanced, setHasBalanced] = useState(false)

  useEffect(() => {
    if (!user) return

    // Fetch pets + custom ingredients in parallel
    Promise.all([
      supabase.from('pets').select('*').eq('user_id', user.id).order('created_at'),
      fetchCustomIngredients(user.id),
    ]).then(([petsRes, customIngs]) => {
      if (petsRes.data) {
        setPets(petsRes.data as Pet[])
        if (petsRes.data.length === 1) setSelectedPetId(petsRes.data[0].id)
      }
      // Register custom ingredients so calculateNutrition can resolve them
      registerCustomIngredients(customIngs)
    })
  }, [user])

  const selectedPet = pets.find(p => p.id === selectedPetId) ?? null
  const allIngredients = getAllIngredients()

  function addIngredient(ing: IngredientData, grams: number) {
    setLines(prev => {
      const existing = prev.findIndex(l => l.ingredient_id === ing.id)
      if (existing >= 0) {
        // In auto mode we don't overwrite — just keep existing (already selected)
        if (mode === 'auto') return prev
        return prev.map((l, i) => i === existing ? { ...l, grams } : l)
      }
      return [...prev, { ingredient_id: ing.id, grams }]
    })
    // Manual mode: close picker after each addition
    // Auto mode: keep picker open for multi-select (handled by IngredientPicker)
    if (mode === 'manual') setPickerOpen(false)
    // Reset the "has balanced" flag when new ingredients are added in auto mode
    if (mode === 'auto') setHasBalanced(false)
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.ingredient_id !== id))
    if (mode === 'auto') setHasBalanced(false)
  }

  function updateGrams(id: string, grams: number) {
    setLines(prev => prev.map(l => l.ingredient_id === id ? { ...l, grams } : l))
  }

  /** Switch modes — keep existing lines but reset balanced flag */
  function switchMode(next: RecipeMode) {
    setMode(next)
    setHasBalanced(false)
  }

  /** Run the auto-balance calculation and fill in gram values */
  function handleAutoBalance() {
    if (lines.length === 0) {
      toast.error('Select at least one ingredient first.')
      return
    }

    const species = selectedPet?.species ?? 'dog'
    const petMer = selectedPet ? calculateMER(selectedPet) : 0

    setIsBalancing(true)
    // Short tick so the spinner renders before the calculation
    setTimeout(() => {
      const balanced = autoBalance(
        lines.map(l => l.ingredient_id),
        species,
        petMer,
      )

      if (balanced.length === 0) {
        toast.error('Could not balance this combination. Try adding more ingredients.')
        setIsBalancing(false)
        return
      }

      setLines(balanced)
      setHasBalanced(true)
      setIsBalancing(false)
      setNutritionOpen(true) // show the score card
      if (!selectedPet) {
        toast.success('Amounts calculated! Select a pet to scale to their daily energy needs.')
      } else {
        toast.success(`Balanced for ${selectedPet.name}! Scaled to ${Math.round(petMer)} kcal/day.`)
      }
    }, 50)
  }

  async function handleSave() {
    if (!recipeName.trim()) {
      toast.error('Give your recipe a name.')
      return
    }
    if (lines.length === 0) {
      toast.error('Add at least one ingredient.')
      return
    }
    // Warn if auto mode but hasn't balanced yet (all grams are still placeholders)
    if (mode === 'auto' && !hasBalanced) {
      toast.error('Tap ⚡ Auto-Balance first to calculate ingredient amounts.')
      return
    }
    setSaving(true)
    try {
      const payload: RecipeIngredient[] = lines.map(l => ({
        ingredient_id: l.ingredient_id,
        grams: l.grams,
      }))
      const { error } = await supabase.from('recipes').insert({
        user_id: user!.id,
        pet_id: selectedPetId || null,
        name: recipeName.trim(),
        ingredients: payload,
        notes: notes.trim() || null,
      })
      if (error) throw error
      toast.success('Recipe saved!')
      navigate('/recipes')
    } catch {
      toast.error('Could not save recipe. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const nutrition = calculateNutrition(lines)
  const existingIds = new Set(lines.map(l => l.ingredient_id))
  const petMer = selectedPet ? calculateMER(selectedPet) : 0
  const servingG = dailyServingGrams(nutrition, petMer)

  // In auto mode, lines with grams=1 are "pending" (not yet balanced)
  const pendingBalance = mode === 'auto' && lines.length > 0 && !hasBalanced

  return (
    <>
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background border-b flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/recipes')}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-semibold text-lg">New Recipe</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !recipeName.trim() || lines.length === 0}
            className="px-4 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Recipe name */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Recipe Name</label>
            <input
              value={recipeName}
              onChange={e => setRecipeName(e.target.value)}
              placeholder="e.g. Chicken & Rice Bowl"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Pet selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">For Which Pet?</label>
            <select
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
            >
              <option value="">Select pet (optional)</option>
              {pets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.species === 'dog' ? '🐶' : '🐱'} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Mode toggle ─────────────────────────────────────────────────── */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Recipe Mode</label>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => switchMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium transition-colors ${
                  mode === 'manual'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <PencilLine size={14} />
                Manual
              </button>
              <button
                onClick={() => switchMode('auto')}
                className={`flex-1 flex items-center justify-center gap-2 h-10 text-sm font-medium transition-colors ${
                  mode === 'auto'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <Wand2 size={14} />
                Auto-Balance
              </button>
            </div>
            {/* Auto-mode description */}
            {mode === 'auto' && (
              <div className="mt-2 px-3 py-2.5 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-xs text-primary leading-relaxed">
                  <strong>Auto-Balance mode:</strong> Select the ingredients you want, then tap{' '}
                  <strong>⚡ Auto-Balance</strong> to automatically compute the ideal gram amounts
                  based on AAFCO 2016 nutritional standards.
                  {selectedPet
                    ? ` Amounts will be scaled to ${selectedPet.name}'s daily energy needs.`
                    : ' Select a pet above to scale amounts to their daily energy needs.'}
                </p>
              </div>
            )}
          </div>

          {/* ── Ingredients section ──────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Ingredients{lines.length > 0 && ` (${lines.length})`}
              </h2>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1.5 text-sm text-primary font-medium hover:opacity-80"
              >
                <Plus size={16} />
                {mode === 'auto' ? 'Select' : 'Add'}
              </button>
            </div>

            {lines.length === 0 ? (
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full h-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={20} />
                <span className="text-sm">
                  {mode === 'auto' ? 'Tap to select ingredients' : 'Tap to add first ingredient'}
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                {lines.map(line => {
                  const ing = getIngredientById(line.ingredient_id)
                  if (!ing) return null
                  const lineKcal = (ing.kcal * line.grams) / 100

                  return (
                    <div
                      key={line.ingredient_id}
                      className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ing.name}</p>
                        {pendingBalance ? (
                          <p className="text-xs text-primary/70 italic">Waiting for auto-balance…</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {Math.round(lineKcal)} kcal · {(ing.protein_g * line.grams / 100).toFixed(1)}g protein
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {pendingBalance ? (
                          <span className="w-16 h-8 flex items-center justify-center text-xs text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                            auto
                          </span>
                        ) : (
                          <input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            value={line.grams}
                            onChange={e => updateGrams(line.ingredient_id, parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 px-2 text-center rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        )}
                        <span className="text-xs text-muted-foreground">g</span>
                        <button
                          onClick={() => removeLine(line.ingredient_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Add more / Select more button */}
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full h-10 rounded-xl border border-dashed border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={14} />
                  {mode === 'auto' ? 'Select more ingredients' : 'Add ingredient'}
                </button>
              </div>
            )}

            {/* ── Auto-Balance button ────────────────────────────────────────── */}
            {mode === 'auto' && lines.length > 0 && (
              <button
                onClick={handleAutoBalance}
                disabled={isBalancing}
                className="w-full mt-3 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {isBalancing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Wand2 size={16} />
                    ⚡ Auto-Balance{hasBalanced ? ' Again' : ''}
                  </>
                )}
              </button>
            )}

            {/* Hint if balanced but no pet selected */}
            {mode === 'auto' && hasBalanced && !selectedPet && (
              <p className="mt-2 text-xs text-amber-600 text-center">
                💡 Select a pet above to scale amounts to their specific calorie needs.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Cooking Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instructions, storage tips, portion notes…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Nutrition + Balance Score (shown when ingredients are added and not pending) */}
          {lines.length > 0 && !pendingBalance && (
            <div>
              <button
                onClick={() => setNutritionOpen(o => !o)}
                className="flex items-center justify-between w-full mb-3"
              >
                <h2 className="text-sm font-semibold text-foreground">Nutrition & Balance</h2>
                {nutritionOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {nutritionOpen && (
                <div className="space-y-3">
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Total kcal', value: `${Math.round(nutrition.totalKcal)}` },
                      { label: 'Protein', value: `${nutrition.protein_g.toFixed(1)}g` },
                      { label: 'Total weight', value: `${Math.round(nutrition.totalWeight_g)}g` },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className="text-base font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Daily serving */}
                  {selectedPet && nutrition.totalKcal > 0 && (
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Feed {selectedPet.name} ~{servingG}g/day</span>
                        {' '}<span className="text-muted-foreground text-xs">to meet daily energy needs ({Math.round(petMer)} kcal)</span>
                      </p>
                    </div>
                  )}

                  {/* Balance Score */}
                  {selectedPet ? (
                    <BalanceScoreCard lines={lines} species={selectedPet.species} />
                  ) : (
                    <div className="bg-muted/30 rounded-2xl border border-border p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Select a pet above to see the AAFCO Balance Score
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ingredient Picker overlay */}
      {pickerOpen && (
        <IngredientPicker
          allIngredients={allIngredients}
          onAdd={addIngredient}
          onClose={() => setPickerOpen(false)}
          existingIds={existingIds}
          autoMode={mode === 'auto'}
        />
      )}
    </>
  )
}
