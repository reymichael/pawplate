import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'welcome' | 'pet' | 'done'

interface PetDraft {
  name: string
  species: 'dog' | 'cat'
  weight_kg: string
  birth_date: string
  sex: 'male' | 'female' | ''
  neutered: boolean
  activity_level: 'sedentary' | 'moderate' | 'active'
}

const INITIAL_PET: PetDraft = {
  name: '',
  species: 'dog',
  weight_kg: '',
  birth_date: '',
  sex: '',
  neutered: false,
  activity_level: 'moderate',
}

/** Mark the user's onboarding as complete in user_profiles */
async function markComplete(userId: string) {
  await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, onboarding_completed: true }, { onConflict: 'user_id' })
}

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [pet, setPet] = useState<PetDraft>(INITIAL_PET)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof PetDraft>(key: K, value: PetDraft[K]) {
    setPet(prev => ({ ...prev, [key]: value }))
  }

  async function handleSavePet() {
    if (!user) return
    if (!pet.name.trim()) { toast.error('Pet name is required'); return }
    if (!pet.weight_kg || parseFloat(pet.weight_kg) <= 0) {
      toast.error('Weight is required'); return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('pets').insert({
        user_id: user.id,
        name: pet.name.trim(),
        species: pet.species,
        weight_kg: parseFloat(pet.weight_kg),
        birth_date: pet.birth_date || null,
        sex: pet.sex || null,
        neutered: pet.neutered,
        activity_level: pet.activity_level,
        body_condition_score: 5,
      })
      if (error) throw error
      await markComplete(user.id)
      await refreshProfile()
      setStep('done')
    } catch {
      toast.error('Could not save pet. Please try again.')
    }
    setSaving(false)
  }

  async function handleSkip() {
    if (!user) return
    await markComplete(user.id)
    await refreshProfile()
    navigate('/', { replace: true })
  }

  // ── Step indicators ──────────────────────────────────────────────────────
  const steps: Step[] = ['welcome', 'pet', 'done']
  const stepIdx = steps.indexOf(step)

  function Dots() {
    return (
      <div className="flex justify-center gap-2 pb-10">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              i === stepIdx ? 'w-6 bg-primary' : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>
    )
  }

  // ── Welcome ──────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-5xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Welcome to PawPlate</h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-2">
            Build balanced, homemade meal recipes for your dog or cat using Philippine ingredients.
          </p>
          <p className="text-muted-foreground text-sm mb-10">
            Powered by AAFCO 2016 nutritional standards.
          </p>
          <div className="w-full space-y-3">
            <button
              onClick={() => setStep('pet')}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Get Started →
            </button>
            <button
              onClick={handleSkip}
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
        <Dots />
      </div>
    )
  }

  // ── Add first pet ────────────────────────────────────────────────────────
  if (step === 'pet') {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Tell us about your pet</h2>
            <p className="text-muted-foreground text-sm mt-1">
              We'll use this to calculate daily calorie needs and serving sizes.
            </p>
          </div>

          <div className="space-y-4">
            {/* Species */}
            <div className="grid grid-cols-2 gap-3">
              {(['dog', 'cat'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setField('species', s)}
                  className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                    pet.species === s
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl">{s === 'dog' ? '🐶' : '🐱'}</span>
                  <span className="text-sm font-medium capitalize">{s}</span>
                </button>
              ))}
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Pet name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pet.name}
                onChange={e => setField('name', e.target.value)}
                placeholder={pet.species === 'dog' ? 'e.g. Doggo' : 'e.g. Neko'}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Weight */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Current weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={pet.weight_kg}
                onChange={e => setField('weight_kg', e.target.value)}
                placeholder="e.g. 5.5"
                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Birthday */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Birthday <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={pet.birth_date}
                onChange={e => setField('birth_date', e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Sex</label>
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setField('sex', pet.sex === s ? '' : s)}
                    className={`h-11 rounded-xl border-2 text-sm font-medium transition-all ${
                      pet.sex === s
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Neutered toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={pet.neutered}
                onClick={() => setField('neutered', !pet.neutered)}
                className={`w-11 h-6 rounded-full transition-colors relative ${pet.neutered ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${pet.neutered ? 'left-6' : 'left-1'}`} />
              </button>
              <span className="text-sm text-foreground">Neutered / Spayed</span>
            </label>

            {/* Activity */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Activity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sedentary', 'moderate', 'active'] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setField('activity_level', a)}
                    className={`h-11 rounded-xl border-2 text-xs font-medium capitalize transition-all ${
                      pet.activity_level === a
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-foreground hover:border-primary/40'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border space-y-3">
          <button
            onClick={handleSavePet}
            disabled={saving}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Add Pet & Continue'}
          </button>
          <button
            onClick={handleSkip}
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip — I'll add a pet later
          </button>
        </div>
        <Dots />
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
          <Heart size={44} className="text-emerald-600" fill="currentColor" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          {pet.name ? `${pet.name} is all set! 🐾` : "You're all set! 🐾"}
        </h2>
        <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
          Now let's build your first balanced meal recipe. You can add more pets, custom ingredients,
          and explore the toxic foods reference from the app.
        </p>
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/recipes/new', { replace: true })}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
          >
            Build First Recipe 🍽️
          </button>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
      <Dots />
    </div>
  )
}
