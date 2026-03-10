import { useState } from 'react'
import { Search, X, CheckCircle2 } from 'lucide-react'
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/ingredientRegistry'
import type { IngredientData } from '@/types'

interface Props {
  allIngredients: IngredientData[]
  onAdd: (ing: IngredientData, grams: number) => void
  onClose: () => void
  existingIds: Set<string>
  /**
   * autoMode = true  →  Multi-select mode used by Auto-Balance.
   *   • Tapping an ingredient immediately adds it (grams placeholder = 1)
   *     without opening a gram-entry dialog.
   *   • The picker stays open so the user can select multiple ingredients.
   *   • Already-added ingredients show a ✓ checkmark instead of going dim.
   * autoMode = false (default)  →  Manual mode — tap opens gram-entry dialog.
   */
  autoMode?: boolean
}

export default function IngredientPicker({
  allIngredients,
  onAdd,
  onClose,
  existingIds,
  autoMode = false,
}: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<IngredientData | null>(null)
  const [gramStr, setGramStr] = useState('')

  const matches = (i: IngredientData) =>
    !query.trim() ||
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    CATEGORY_LABEL[i.category]?.toLowerCase().includes(query.toLowerCase())

  const customFiltered = allIngredients.filter(i => i.id.startsWith('custom_') && matches(i))
  const builtInFiltered = allIngredients.filter(i => !i.id.startsWith('custom_') && matches(i))

  const grouped: Record<string, IngredientData[]> = {}
  if (customFiltered.length > 0) grouped['_custom'] = customFiltered
  for (const cat of CATEGORY_ORDER) {
    const items = builtInFiltered.filter(i => i.category === cat)
    if (items.length > 0) grouped[cat] = items
  }

  function confirm() {
    const grams = parseFloat(gramStr)
    if (!selected || isNaN(grams) || grams <= 0) return
    onAdd(selected, grams)
    setSelected(null)
    setGramStr('')
  }

  function handleIngredientClick(ing: IngredientData) {
    if (autoMode) {
      // Multi-select: toggle in-place, stay open for more selections
      if (!existingIds.has(ing.id)) {
        onAdd(ing, 1) // placeholder gram value; auto-balance will fill it in
      }
      // If already added, do nothing (user can remove from the recipe list)
    } else {
      // Manual mode: open gram entry dialog
      setSelected(ing)
      setGramStr('')
    }
  }

  const addedCount = existingIds.size

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b bg-background">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <X size={20} />
        </button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">
            {autoMode ? 'Select Ingredients' : 'Add Ingredient'}
          </h2>
        </div>
        {autoMode && addedCount > 0 && (
          <button
            onClick={onClose}
            className="px-3 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
          >
            Done ({addedCount})
          </button>
        )}
      </div>

      {/* Auto-mode banner */}
      {autoMode && (
        <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20">
          <p className="text-xs text-primary font-medium">
            ⚡ Tap to select — amounts will be calculated automatically when you tap Auto-Balance.
          </p>
        </div>
      )}

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
            <div className={`px-4 py-2 ${cat === '_custom' ? 'bg-primary/5' : 'bg-muted/40'}`}>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cat === '_custom' ? '⭐ My Custom Ingredients' : CATEGORY_LABEL[cat]}
              </span>
            </div>
            {items.map(ing => {
              const isAdded = existingIds.has(ing.id)
              return (
                <button
                  key={ing.id}
                  onClick={() => handleIngredientClick(ing)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-muted/40 active:bg-muted text-left transition-colors ${
                    !autoMode && isAdded ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isAdded && autoMode ? 'text-primary' : 'text-foreground'}`}>
                      {ing.name}
                    </p>
                    {ing.notes && (
                      <p className="text-xs text-amber-600 mt-0.5 line-clamp-1">{ing.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {ing.kcal} kcal/100g
                    </span>
                    {autoMode && isAdded && (
                      <CheckCircle2 size={16} className="text-primary" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <p className="text-muted-foreground text-sm">No ingredients found for "{query}"</p>
          </div>
        )}
      </div>

      {/* Grams input modal — only shown in manual mode */}
      {!autoMode && selected && (
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
