import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import PetForm from '@/components/pets/PetForm'
import type { PetFormValues } from '@/components/pets/PetForm'
import {
  calculateMER,
  calculateRER,
  getLifeStage,
  getAgeMonths,
  getBCSLabel,
  getBCSColor,
  formatKcal,
  formatLifeStage,
} from '@/lib/petCalculations'
import type { Pet } from '@/types'
import { ArrowLeft, Pencil, Trash2, Flame, Scale, Calendar, Activity } from 'lucide-react'
import { toast } from 'sonner'

const SPECIES_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱' }

const LIFE_STAGE_COLOR: Record<string, string> = {
  puppy: 'bg-blue-100 text-blue-700',
  junior: 'bg-purple-100 text-purple-700',
  adult: 'bg-green-100 text-green-700',
  senior: 'bg-amber-100 text-amber-700',
}

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id || !user) return
    fetchPet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  async function fetchPet() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user!.id)
      .single()

    if (error || !data) {
      toast.error('Pet not found.')
      navigate('/')
      return
    }
    setPet(data as Pet)
    setLoading(false)
  }

  async function handleEdit(values: PetFormValues) {
    try {
      const { error } = await supabase
        .from('pets')
        .update({
          name: values.name,
          species: values.species,
          breed: values.breed || null,
          birth_date: values.birth_date || null,
          weight_kg: values.weight_kg,
          sex: values.sex || null,
          neutered: values.neutered,
          activity_level: values.activity_level,
          body_condition_score: values.body_condition_score,
          health_notes: values.health_notes || null,
        })
        .eq('id', id)
        .eq('user_id', user!.id)

      if (error) throw error
      toast.success('Profile updated!')
      setEditing(false)
      fetchPet()
    } catch {
      toast.error('Could not update pet. Please try again.')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)

      if (error) throw error
      toast.success(`${pet?.name} removed.`)
      navigate('/')
    } catch {
      toast.error('Could not delete pet. Please try again.')
      setDeleting(false)
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!pet) return null

  /* ── Edit mode ── */
  if (editing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setEditing(false)}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">Edit {pet.name}</h1>
        </div>
        <div className="p-4">
          <PetForm
            defaultValues={pet}
            onSubmit={handleEdit}
            onCancel={() => setEditing(false)}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    )
  }

  /* ── Detail view ── */
  const mer = calculateMER(pet)
  const rer = calculateRER(pet.weight_kg)
  const lifeStage = getLifeStage(pet)
  const ageMonths = getAgeMonths(pet.birth_date)

  function formatAge(months: number | null): string {
    if (months === null) return 'Unknown age'
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`
    const yrs = Math.floor(months / 12)
    const mo = months % 12
    if (mo === 0) return `${yrs} year${yrs !== 1 ? 's' : ''} old`
    return `${yrs}y ${mo}mo old`
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">{pet.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Edit pet"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-full hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
            aria-label="Delete pet"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hero card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className={`h-2 w-full ${pet.species === 'dog' ? 'bg-primary' : 'bg-violet-400'}`} />
          <div className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl">{SPECIES_EMOJI[pet.species]}</span>
              <div>
                <h2 className="text-xl font-bold text-foreground">{pet.name}</h2>
                {pet.breed && (
                  <p className="text-sm text-muted-foreground">{pet.breed}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LIFE_STAGE_COLOR[lifeStage]}`}>
                    {formatLifeStage(lifeStage)}
                  </span>
                  {pet.neutered && (
                    <span className="text-xs text-muted-foreground">
                      {pet.sex === 'female' ? 'Spayed' : 'Neutered'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame size={14} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Daily Energy</span>
                </div>
                <p className="text-lg font-bold text-foreground">{formatKcal(mer)}</p>
                <p className="text-xs text-muted-foreground">kcal / day</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Scale size={14} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Weight</span>
                </div>
                <p className="text-lg font-bold text-foreground">{pet.weight_kg}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Age</span>
                </div>
                <p className="text-sm font-bold text-foreground leading-tight">
                  {formatAge(ageMonths)}
                </p>
                {pet.birth_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(pet.birth_date).toLocaleDateString('en-PH', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity size={14} className="text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">Activity</span>
                </div>
                <p className="text-sm font-bold text-foreground capitalize">{pet.activity_level}</p>
                <p className="text-xs text-muted-foreground">
                  {pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : 'Sex not set'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body Condition */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Body Condition Score</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(pet.body_condition_score / 9) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-foreground w-6 text-right">
              {pet.body_condition_score}
            </span>
            <span className={`text-sm font-medium ${getBCSColor(pet.body_condition_score)}`}>
              {getBCSLabel(pet.body_condition_score)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">BCS scale: 1 (very thin) → 9 (obese)</p>
        </div>

        {/* Energy breakdown */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Energy Calculation</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Resting Energy (RER)</span>
              <span className="font-medium text-foreground">{formatKcal(rer)} kcal</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Life stage / activity</span>
              <span className="font-medium text-foreground">× {(mer / rer).toFixed(1)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Daily MER</span>
              <span className="font-bold text-primary">{formatKcal(mer)} kcal</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Based on AAFCO 2016 guidelines. RER = 70 × weight_kg^0.75
          </p>
        </div>

        {/* Health notes */}
        {pet.health_notes && (
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Health Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{pet.health_notes}</p>
          </div>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-8">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-xl border border-border">
            <h2 className="text-lg font-bold text-foreground mb-1">Remove {pet.name}?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will permanently delete {pet.name}'s profile and all associated data.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
