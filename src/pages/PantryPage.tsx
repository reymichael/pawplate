import { useState } from 'react'
import { Search, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react'
import {
  TOXIC_FOODS,
  SEVERITY_LABEL,
  SEVERITY_COLOR,
  SEVERITY_DOT,
  type ToxicSeverity,
} from '@/lib/toxicFoods'

type SpeciesFilter = 'all' | 'dog' | 'cat'
type SeverityFilter = 'all' | ToxicSeverity

const SEVERITY_ORDER: ToxicSeverity[] = ['fatal', 'dangerous', 'caution']

export default function PantryPage() {
  const [query, setQuery]       = useState('')
  const [species, setSpecies]   = useState<SpeciesFilter>('all')
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = TOXIC_FOODS.filter(f => {
    if (species !== 'all' && f.affects !== 'both' && f.affects !== species) return false
    if (severity !== 'all' && f.severity !== severity) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      const matchName  = f.name.toLowerCase().includes(q)
      const matchLocal = f.localNames?.some(n => n.toLowerCase().includes(q))
      if (!matchName && !matchLocal) return false
    }
    return true
  })

  const grouped = SEVERITY_ORDER.reduce<Record<ToxicSeverity, typeof filtered>>(
    (acc, sev) => ({ ...acc, [sev]: filtered.filter(f => f.severity === sev) }),
    {} as Record<ToxicSeverity, typeof filtered>,
  )

  function toggle(name: string) {
    setExpanded(prev => (prev === name ? null : name))
  }

  return (
    <div className="p-4 pb-28">
      {/* Header */}
      <div className="pt-2 mb-4">
        <h1 className="text-2xl font-bold text-foreground">Safety Reference</h1>
        <p className="text-sm text-muted-foreground">Foods harmful to dogs and cats</p>
      </div>

      {/* Emergency banner */}
      <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
        <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 leading-relaxed">
          <span className="font-semibold">Pet ingested something harmful?</span>{' '}
          Call your vet immediately or the{' '}
          <a href="tel:+18884264435" className="underline font-medium">
            ASPCA Poison Control: +1-888-426-4435
          </a>
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search food or local name…"
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'dog', 'cat'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSpecies(s)}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
              species === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {s === 'all' ? 'All Pets' : s === 'dog' ? '🐶 Dogs' : '🐱 Cats'}
          </button>
        ))}

        <div className="w-px bg-border self-stretch mx-0.5" />

        {(['all', 'fatal', 'dangerous', 'caution'] as const).map(sv => (
          <button
            key={sv}
            onClick={() => setSeverity(sv)}
            className={`h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
              severity === sv
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {sv === 'all' ? 'All Levels' : SEVERITY_LABEL[sv]}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''} · tap a card to see why it&apos;s harmful
      </p>

      {/* Grouped list */}
      {SEVERITY_ORDER.map(sev => {
        const items = grouped[sev]
        if (!items || items.length === 0) return null

        return (
          <div key={sev} className="mb-5">
            {/* Section label */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${SEVERITY_DOT[sev]}`} />
              <h2 className="text-sm font-semibold text-foreground">{SEVERITY_LABEL[sev]}</h2>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>

            <div className="space-y-2">
              {items.map(food => {
                const isOpen = expanded === food.name
                return (
                  <div
                    key={food.name}
                    className="bg-card rounded-2xl border border-border overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(food.name)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${SEVERITY_DOT[sev]}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {food.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_COLOR[food.severity]}`}>
                            {SEVERITY_LABEL[food.severity]}
                          </span>
                          <span className="text-sm leading-none">
                            {food.affects === 'both' ? '🐶🐱' : food.affects === 'dog' ? '🐶' : '🐱'}
                          </span>
                        </div>
                        {food.localNames && food.localNames.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            aka {food.localNames.join(', ')}
                          </p>
                        )}
                      </div>

                      {isOpen
                        ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                        : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4">
                        <div className="h-px bg-border mb-3" />
                        <p className="text-sm text-foreground leading-relaxed">{food.reason}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <ShieldAlert size={36} className="text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            No results for &quot;{query}&quot; — try a different term or local name.
          </p>
        </div>
      )}

      {/* Footer notes */}
      <div className="mt-6 space-y-3">
        <div className="bg-muted/40 rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            This list is a general reference based on veterinary sources. It is not exhaustive —
            always consult a licensed veterinarian before changing your pet&apos;s diet or if you
            suspect poisoning.
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-dashed border-border p-4 text-center">
          <p className="text-sm font-semibold text-foreground mb-0.5">🧮 Pantry Calculator</p>
          <p className="text-xs text-muted-foreground">
            Batch cook tool and cost tracker — coming in a future update
          </p>
        </div>
      </div>
    </div>
  )
}
