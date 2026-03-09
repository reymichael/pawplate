import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import PetCard from '@/components/pets/PetCard'
import type { Pet, Recipe } from '@/types'
import {
  Plus,
  PawPrint,
  Loader2,
  UtensilsCrossed,
  ChevronRight,
  ShieldAlert,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

const SPECIES_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱' }

export default function DashboardPage() {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchData() {
    try {
      const [petsRes, recipesRes] = await Promise.all([
        supabase
          .from('pets')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ])
      if (petsRes.error) throw petsRes.error
      if (recipesRes.error) throw recipesRes.error
      setPets(petsRes.data ?? [])
      setRecentRecipes(recipesRes.data ?? [])
    } catch {
      toast.error('Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Quick lookup: pet_id → Pet
  const petMap = Object.fromEntries(pets.map(p => [p.id, p]))

  return (
    <div className="p-4">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Pets</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? 'Loading…'
              : pets.length > 0
              ? `${pets.length} pet${pets.length > 1 ? 's' : ''} registered`
              : 'No pets yet'}
          </p>
        </div>
        <Link
          to="/pets/new"
          aria-label="Add pet"
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Plus size={22} className="text-primary-foreground" />
        </Link>
      </div>

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex justify-center mt-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {!loading && (
        <>
          {/* Empty state — no pets */}
          {pets.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-12 text-center px-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <PawPrint size={36} className="text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">No pets yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Add your first pet to start planning balanced, homemade meals.
              </p>
              <Link
                to="/pets/new"
                className="flex items-center justify-center gap-2 w-full max-w-xs h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
              >
                <Plus size={18} />
                Add Your First Pet
              </Link>
            </div>
          ) : (
            <>
              {/* ── Pet List ──────────────────────────────────────────── */}
              <div className="space-y-3 mb-6">
                {pets.map(pet => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
                <Link
                  to="/pets/new"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus size={16} />
                  Add Another Pet
                </Link>
              </div>

              {/* ── Recent Recipes ────────────────────────────────────── */}
              <section className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                    Recent Recipes
                  </h2>
                  <Link to="/recipes" className="text-xs text-primary font-medium px-1">
                    See all →
                  </Link>
                </div>

                {recentRecipes.length === 0 ? (
                  <div className="bg-card rounded-2xl border border-dashed border-border p-5 text-center">
                    <UtensilsCrossed size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">No recipes yet</p>
                    <Link
                      to="/recipes/new"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                    >
                      <Plus size={14} />
                      Build your first recipe
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentRecipes.map(recipe => {
                      const pet = recipe.pet_id ? petMap[recipe.pet_id] : undefined
                      const ingCount = recipe.ingredients.length
                      return (
                        <Link
                          key={recipe.id}
                          to={`/recipes/${recipe.id}`}
                          className="flex items-center gap-3 bg-card rounded-2xl border border-border px-4 py-3.5 active:scale-[0.98] transition-transform"
                        >
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <UtensilsCrossed size={18} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {recipe.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pet
                                ? `${SPECIES_EMOJI[pet.species]} ${pet.name}`
                                : 'Unknown pet'}
                              {' · '}
                              {ingCount} ingredient{ingCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                        </Link>
                      )
                    })}

                    <Link
                      to="/recipes/new"
                      className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Plus size={16} />
                      Build a Recipe
                    </Link>
                  </div>
                )}
              </section>

              {/* ── Quick Links ───────────────────────────────────────── */}
              <section className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
                  Quick Links
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/pantry"
                    className="flex items-center gap-3 bg-red-50 rounded-2xl border border-red-100 px-4 py-3.5 active:scale-95 transition-transform"
                  >
                    <ShieldAlert size={20} className="text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Safety</p>
                      <p className="text-xs text-muted-foreground">Toxic foods</p>
                    </div>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 bg-muted/40 rounded-2xl border border-border px-4 py-3.5 active:scale-95 transition-transform"
                  >
                    <Settings size={20} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Settings</p>
                      <p className="text-xs text-muted-foreground">Account & info</p>
                    </div>
                  </Link>
                </div>
              </section>

              {/* AAFCO disclaimer */}
              <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
                Calorie targets based on AAFCO 2016 standards. Consult your vet
                before changing your pet's diet.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
