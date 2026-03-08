import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  INGREDIENTS,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  getIngredientById,
} from '@/lib/ingredients'
import { calculateNutrition, macroPercents, dailyServingGrams } from '@/lib/recipeCalculations'
import { scoreRecipe, scoreLabel } from '@/lib/aafco'
import { calculateMER } from '@/lib/petCalculations'
import type { Pet, IngredientData, RecipeIngredient } from '@/types'
import { ArrowLeft, Plus, Search, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface DraftLine {
  ingredient_id: string
  grams: number
}

// ── Ingredient Picker Overlay ─────────────────────────────────────────────────
function IngredientPicker({
  onAdd,
  onClose,
  existingIds,
}: {
  onAdd: (ing: IngredientData, grams: number) => void
  onClose: () => void
  existingIds: Set<string>
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<IngredientData | null>(null)
  const [gramStr, setGramStr] = useState('')

  const filtered = query.trim()
    ? INGREDIENTS.filter(i =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        CATEGORY_LABEL[i.category]?.toLowerCase().includes(query.toLowerCase())
      )
    : INGREDIENTS

  // Group by category
  const grouped: Record<string, IngredientData[]> = {}
  for (const cat of CATEGORY_ORDER) {
    const items = filtered.filter(i => i.category === cat)
    if (items.length > 0) grouped[cat] = items
  }

  function confirm() {
    const grams = parseFloat(gramStr)
    if (!selected || isNaN(grams) || grams <= 0) return
    onAdd(selected, grams)
    setSelected(null)
    setGramStr('')
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b bg-background">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <X size={20} />
        </button>
        <h2 className="font-semibold text-lg">Add Ingredient</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ingredients…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-8">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div className="px-4 py-2 bg-muted/40">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {CATEGORY_LABEL[cat]}
              </span>
            </div>
            {items.map(ing => (
              <button
                key={ing.id}
                onClick={() => { setSelected(ing); setGramStr('') }}
                className={`w-full flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-muted/40 active:bg-muted text-left transition-colors ${existingIds.has(ing.id) ? 'opacity-40' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{ing.name}</p>
                  {ing.notes && (
                    <p className="text-xs text-amber-600 mt-0.5 line-clamp-1">{ing.notes}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {ing.kcal} kcal/100g
                </span>
              </button>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-muted-foreground text-sm">No ingredients found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Grams input modal */}
      {selected && (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-xl border">
            <h3 className="font-semibold text-foreground mb-1">{selected.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {selected.kcal} kcal · {selected.protein_g}g protein · {selected.fat_g}g fat per 100g
            </p>
            <label className="text-sm font-medium text-foreground mb-1 block">Amount (grams)</label>
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min="1"
              step="1"
              value={gramStr}
              onChange={e => setGramStr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirm()}
              placeholder="e.g. 150"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={!gramStr || parseFloat(gramStr) <= 0}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Balance Score Card ────────────────────────────────────────────────────────
function BalanceScoreCard({ lines, species }: { lines: DraftLine[]; species: 'dog' | 'cat' }) {
  const nutrition = calculateNutrition(lines)
  const score = scoreRecipe(nutrition, species)
  const macros = macroPercents(nutrition)

  const STATUS_BAR: Record<string, string> = {
    low: 'bg-red-400',
    ok: 'bg-emerald-400',
    high: 'bg-amber-400',
  }
  const STATUS_TEXT: Record<string, string> = {
    low: 'text-red-600',
    ok: 'text-emerald-600',
    high: 'text-amber-600',
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 space-y-4">
      {/* Overall */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke="currentColor"
              className={score.overall >= 90 ? 'text-emerald-500' : score.overall >= 75 ? 'text-green-500' : score.overall >= 50 ? 'text-amber-500' : 'text-red-500'}
              strokeWidth="3"
              strokeDasharray={`${score.overall} 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
            {score.overall}
          </span>
        </div>
        <div>
          <p className="font-bold text-foreground">{scoreLabel(score.overall)}</p>
          <p className="text-xs text-muted-foreground">AAFCO Balance Score</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {Math.round(nutrition.totalKcal)} kcal total
          </p>
        </div>
      </div>

      {/* Macro splits */}
      <div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden mb-2">
          <div className="bg-primary transition-all" style={{ width: `${macros.protein}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${macros.fat}%` }} />
          <div className="bg-blue-400 transition-all" style={{ width: `${macros.carbs}%` }} />
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span><span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />Protein {macros.protein}%</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Fat {macros.fat}%</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />Carbs {macros.carbs}%</span>
        </div>
      </div>

      {/* Per-nutrient bars */}
      <div className="space-y-2">
        {score.nutrients.map(n => (
          <div key={n.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{n.name}</span>
              <span className={STATUS_TEXT[n.status]}>
                {n.actual >= 1000 && n.unit === 'mg'
                  ? `${(n.actual / 1000).toFixed(1)}g`
                  : n.actual >= 100
                    ? `${Math.round(n.actual)}${n.unit}`
                    : `${n.actual.toFixed(1)}${n.unit}`
                } / {n.min >= 1000 && n.unit === 'mg'
                  ? `${(n.min / 1000).toFixed(1)}g`
                  : `${Math.round(n.min)}${n.unit}`
                } min
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${STATUS_BAR[n.status]}`}
                style={{ width: `${Math.min(n.pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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

  useEffect(() => {
    if (!user) return
    supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
      .then(({ data }) => {
        if (data) {
          setPets(data as Pet[])
          if (data.length === 1) setSelectedPetId(data[0].id)
        }
      })
  }, [user])

  const selectedPet = pets.find(p => p.id === selectedPetId) ?? null

  function addIngredient(ing: IngredientData, grams: number) {
    setLines(prev => {
      const existing = prev.findIndex(l => l.ingredient_id === ing.id)
      if (existing >= 0) {
        // Update grams if already added
        return prev.map((l, i) => i === existing ? { ...l, grams } : l)
      }
      return [...prev, { ingredient_id: ing.id, grams }]
    })
    setPickerOpen(false)
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l.ingredient_id !== id))
  }

  function updateGrams(id: string, grams: number) {
    setLines(prev => prev.map(l => l.ingredient_id === id ? { ...l, grams } : l))
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

          {/* Ingredients section */}
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
                Add
              </button>
            </div>

            {lines.length === 0 ? (
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full h-20 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={20} />
                <span className="text-sm">Tap to add first ingredient</span>
              </button>
            ) : (
              <div className="space-y-2">
                {lines.map(line => {
                  const ing = getIngredientById(line.ingredient_id)!
                  const lineKcal = (ing.kcal * line.grams) / 100
                  return (
                    <div
                      key={line.ingredient_id}
                      className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ing.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(lineKcal)} kcal · {(ing.protein_g * line.grams / 100).toFixed(1)}g protein
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          inputMode="decimal"
                          min="1"
                          value={line.grams}
                          onChange={e => updateGrams(line.ingredient_id, parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 px-2 text-center rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
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

                {/* Add more button inline */}
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full h-10 rounded-xl border border-dashed border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={14} />
                  Add ingredient
                </button>
              </div>
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

          {/* Nutrition + Balance Score (shown when ingredients added) */}
          {lines.length > 0 && (
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
          onAdd={addIngredient}
          onClose={() => setPickerOpen(false)}
          existingIds={existingIds}
        />
      )}
    </>
  )
}
