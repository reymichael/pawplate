import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/ingredientRegistry'
import type { IngredientData } from '@/types'

interface Props {
  allIngredients: IngredientData[]
  onAdd: (ing: IngredientData, grams: number) => void
  onClose: () => void
  existingIds: Set<string>
}

export default function IngredientPicker({ allIngredients, onAdd, onClose, existingIds }: Props) {
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
            <div className={`px-4 py-2 ${cat === '_custom' ? 'bg-primary/5' : 'bg-muted/40'}`}>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {cat === '_custom' ? '⭐ My Custom Ingredients' : CATEGORY_LABEL[cat]}
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
