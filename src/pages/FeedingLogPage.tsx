import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  getLogsForPet,
  addLog,
  deleteLog,
  getTodayKcalForPet,
  type FeedingLog,
} from '@/lib/feedingLog'
import { fetchCustomIngredients } from '@/lib/customIngredients'
import { registerCustomIngredients } from '@/lib/ingredientRegistry'
import { calculateNutrition } from '@/lib/recipeCalculations'
import { calculateMER, formatKcal } from '@/lib/petCalculations'
import type { Pet, Recipe } from '@/types'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ClipboardList,
  UtensilsCrossed,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ── Date/time helpers ─────────────────────────────────────────────────────────

function groupByDate(logs: FeedingLog[]): [string, FeedingLog[]][] {
  const map = new Map<string, FeedingLog[]>()
  for (const log of logs) {
    const key = new Date(log.fed_at).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(log)
  }
  return Array.from(map.entries())
}

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeedingLogPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pet, setPet] = useState<Pet | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [logs, setLogs] = useState<FeedingLog[]>([])
  const [loading, setLoading] = useState(true)

  // Sheet state
  const [showSheet, setShowSheet] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!id || !user) return
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  async function fetchData() {
    try {
      const [petRes, recipesRes, customIngs] = await Promise.all([
        supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user!.id)
          .single(),
        supabase
          .from('recipes')
          .select('*')
          .eq('pet_id', id)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        fetchCustomIngredients(user!.id),
      ])

      registerCustomIngredients(customIngs)

      if (petRes.error || !petRes.data) {
        toast.error('Pet not found.')
        navigate('/')
        return
      }

      setPet(petRes.data as Pet)
      setRecipes((recipesRes.data as Recipe[]) ?? [])
      setLogs(getLogsForPet(id!))
    } catch {
      toast.error('Could not load feeding log.')
    } finally {
      setLoading(false)
    }
  }

  // ── Selected recipe nutrition ────────────────────────────────────────────────
  const selectedRecipe = recipes.find(r => r.id === selectedRecipeId) ?? null
  const selectedNutrition = selectedRecipe
    ? calculateNutrition(selectedRecipe.ingredients)
    : null
  const selectedKcal = selectedNutrition ? Math.round(selectedNutrition.totalKcal) : 0
  const selectedWeightG = selectedNutrition
    ? Math.round(selectedNutrition.totalWeight_g)
    : 0

  // ── Calorie progress ─────────────────────────────────────────────────────────
  const mer = pet ? calculateMER(pet) : 0
  const todayKcal = getTodayKcalForPet(id ?? '')
  const todayPct = mer > 0 ? Math.min(100, Math.round((todayKcal / mer) * 100)) : 0

  // ── Actions ───────────────────────────────────────────────────────────────────
  function handleLog() {
    if (!selectedRecipe || !pet || !id) return
    addLog({
      pet_id: id,
      recipe_id: selectedRecipe.id,
      recipe_name: selectedRecipe.name,
      kcal: selectedKcal,
      weight_g: selectedWeightG,
      notes: notes.trim(),
      fed_at: new Date().toISOString(),
    })
    setLogs(getLogsForPet(id))
    setShowSheet(false)
    setSelectedRecipeId('')
    setNotes('')
    toast.success(`Feeding logged for ${pet.name}!`)
  }

  function handleDelete(logId: string) {
    deleteLog(logId)
    setLogs(getLogsForPet(id!))
    toast.success('Entry removed')
  }

  function openSheet() {
    setSelectedRecipeId('')
    setNotes('')
    setShowSheet(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-6">

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/pets/${id}`)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">
            {pet ? `${pet.name}'s Log` : 'Feeding Log'}
          </h1>
        </div>
        <button
          onClick={openSheet}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform"
        >
          <Plus size={16} />
          Log Feed
        </button>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center mt-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────────────── */}
      {!loading && pet && (
        <div className="p-4 space-y-5">

          {/* Today's Progress */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Today's Intake</h2>
              {todayKcal > 0 && (
                <span className={`text-xs font-bold ${todayPct >= 100 ? 'text-emerald-600' : 'text-primary'}`}>
                  {todayPct}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    todayPct >= 100
                      ? 'bg-emerald-500'
                      : todayPct >= 50
                      ? 'bg-primary'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${todayPct}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatKcal(todayKcal)} kcal fed</span>
              <span>Goal: {formatKcal(mer)} kcal/day</span>
            </div>

            {todayKcal === 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                No feedings logged today yet — tap "Log Feed" to start.
              </p>
            )}
            {todayPct >= 100 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                ✓ Daily calorie goal reached!
              </p>
            )}
          </div>

          {/* Log History */}
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <ClipboardList size={40} className="text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No feedings logged yet</p>
              <p className="text-xs text-muted-foreground">
                Tap "Log Feed" to record what {pet.name} ate.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupByDate(logs).map(([dateStr, dayLogs]) => (
                <div key={dateStr}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                      {formatDateHeading(dateStr)}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatKcal(dayLogs.reduce((s, l) => s + l.kcal, 0))} kcal
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dayLogs.map(log => (
                      <div
                        key={log.id}
                        className="bg-card rounded-2xl border border-border px-4 py-3 flex items-center gap-3"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <UtensilsCrossed size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {log.recipe_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.kcal} kcal · {log.weight_g}g · {formatTime(log.fed_at)}
                          </p>
                          {log.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5 truncate">
                              {log.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          aria-label="Remove entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed pt-2">
            Feeding history is stored on this device only. Based on AAFCO 2016 calorie targets.
          </p>
        </div>
      )}

      {/* ── Log Sheet ─────────────────────────────────────────────────── */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSheet(false)}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-lg mx-auto bg-card rounded-t-3xl p-5 pt-4 shadow-xl border-t border-border">
            {/* Drag handle */}
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full mx-auto mb-4" />

            <h2 className="text-lg font-bold text-foreground mb-4">Log a Feeding</h2>

            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <UtensilsCrossed size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No recipes found for {pet?.name}.
                </p>
                <Link
                  to="/recipes/new"
                  onClick={() => setShowSheet(false)}
                  className="text-sm text-primary font-semibold"
                >
                  Create a Recipe →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Recipe selector */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Recipe
                  </label>
                  <select
                    value={selectedRecipeId}
                    onChange={e => setSelectedRecipeId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Select a recipe…</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Auto-filled energy preview */}
                {selectedRecipe && (
                  <div className="bg-primary/5 rounded-xl border border-primary/15 px-4 py-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">Energy (full batch)</span>
                    <span className="font-semibold text-foreground">
                      {selectedKcal} kcal · {selectedWeightG}g
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    Notes{' '}
                    <span className="font-normal lowercase text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. ate everything, left some…"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleLog}
                  disabled={!selectedRecipeId}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Log It
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
