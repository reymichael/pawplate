import { calculateNutrition, macroPercents } from '@/lib/recipeCalculations'
import { scoreRecipe, scoreLabel } from '@/lib/aafco'

interface DraftLine {
  ingredient_id: string
  grams: number
}

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

export default function BalanceScoreCard({ lines, species }: { lines: DraftLine[]; species: 'dog' | 'cat' }) {
  const nutrition = calculateNutrition(lines)
  const score = scoreRecipe(nutrition, species)
  const macros = macroPercents(nutrition)

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
