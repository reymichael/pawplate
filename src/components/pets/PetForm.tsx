import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SelectNative } from '@/components/ui/select-native'
import { getBCSLabel, getBCSColor } from '@/lib/petCalculations'
import type { Pet } from '@/types'
import { Loader2 } from 'lucide-react'

export type PetFormValues = {
  name: string
  species: 'dog' | 'cat'
  breed: string
  birth_date: string
  weight_kg: number
  sex: 'male' | 'female' | ''
  neutered: boolean
  activity_level: 'sedentary' | 'moderate' | 'active' | 'working'
  body_condition_score: number
  health_notes: string
}

interface PetFormProps {
  defaultValues?: Partial<Pet>
  onSubmit: (values: PetFormValues) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function PetForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save Pet' }: PetFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PetFormValues>({
    defaultValues: {
      name: defaultValues?.name ?? '',
      species: defaultValues?.species ?? 'dog',
      breed: defaultValues?.breed ?? '',
      birth_date: defaultValues?.birth_date ?? '',
      weight_kg: defaultValues?.weight_kg ?? ('' as unknown as number),
      sex: defaultValues?.sex ?? '',
      neutered: defaultValues?.neutered ?? false,
      activity_level: defaultValues?.activity_level ?? 'moderate',
      body_condition_score: defaultValues?.body_condition_score ?? 5,
      health_notes: defaultValues?.health_notes ?? '',
    },
  })

  const bcs = watch('body_condition_score')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-6">
      {/* ── Section 1: Basic Info ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Basic Info
        </h2>
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Pet Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Buddy"
              className="h-11"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          {/* Species */}
          <div className="space-y-1.5">
            <Label htmlFor="species">Species <span className="text-destructive">*</span></Label>
            <SelectNative id="species" className="h-11" {...register('species', { required: true })}>
              <option value="dog">🐶 Dog</option>
              <option value="cat">🐱 Cat</option>
            </SelectNative>
          </div>

          {/* Breed */}
          <div className="space-y-1.5">
            <Label htmlFor="breed">Breed <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="breed"
              placeholder="e.g. Aspin, Labrador, Puspin"
              className="h-11"
              {...register('breed')}
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-1.5">
            <Label htmlFor="birth_date">Birth Date <span className="text-muted-foreground text-xs">(optional — used for life stage)</span></Label>
            <Input
              id="birth_date"
              type="date"
              className="h-11"
              {...register('birth_date')}
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Body & Activity ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Body & Activity
        </h2>
        <div className="space-y-4">
          {/* Weight */}
          <div className="space-y-1.5">
            <Label htmlFor="weight_kg">Weight (kg) <span className="text-destructive">*</span></Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              placeholder="e.g. 5.5"
              className="h-11"
              {...register('weight_kg', {
                required: 'Weight is required',
                min: { value: 0.1, message: 'Must be at least 0.1 kg' },
                max: { value: 100, message: 'Must be 100 kg or less' },
                valueAsNumber: true,
              })}
            />
            {errors.weight_kg && <p className="text-destructive text-xs">{errors.weight_kg.message}</p>}
          </div>

          {/* Sex */}
          <div className="space-y-1.5">
            <Label htmlFor="sex">Sex</Label>
            <SelectNative id="sex" className="h-11" {...register('sex')}>
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </SelectNative>
          </div>

          {/* Neutered */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-medium">Neutered / Spayed?</p>
              <p className="text-xs text-muted-foreground">Affects daily calorie target</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('neutered')} />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Activity Level */}
          <div className="space-y-1.5">
            <Label htmlFor="activity_level">Activity Level</Label>
            <SelectNative id="activity_level" className="h-11" {...register('activity_level')}>
              <option value="sedentary">Sedentary (mostly indoors, little exercise)</option>
              <option value="moderate">Moderate (daily walks)</option>
              <option value="active">Active (runs, agility, outdoor)</option>
              <option value="working">Working (farm dog, herding, sport)</option>
            </SelectNative>
          </div>

          {/* Body Condition Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body_condition_score">Body Condition Score (BCS)</Label>
              <span className={`text-sm font-semibold ${getBCSColor(Number(bcs))}`}>
                {bcs} — {getBCSLabel(Number(bcs))}
              </span>
            </div>
            <input
              id="body_condition_score"
              type="range"
              min={1}
              max={9}
              step={1}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              {...register('body_condition_score', { valueAsNumber: true })}
            />
            <div className="flex justify-between text-xs text-muted-foreground px-0.5">
              <span>1 Underweight</span>
              <span>5 Ideal</span>
              <span>9 Obese</span>
            </div>
            {/* BCS Quick Guide */}
            <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1 text-muted-foreground">
              <p><span className="font-medium text-foreground">1–2:</span> Ribs, spine, and hip bones very visible</p>
              <p><span className="font-medium text-foreground">3–4:</span> Ribs easily felt, waist visible from above</p>
              <p><span className="font-medium text-foreground">5 ✓:</span> Ribs felt but not seen — ideal weight</p>
              <p><span className="font-medium text-foreground">6–7:</span> Ribs hard to feel under fat cover</p>
              <p><span className="font-medium text-foreground">8–9:</span> Ribs cannot be felt, heavy fat deposits</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Health ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Health Notes
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="health_notes">Allergies, conditions, or notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Textarea
            id="health_notes"
            placeholder="e.g. Allergic to chicken, has joint issues, on medication..."
            rows={3}
            {...register('health_notes')}
          />
        </div>
      </div>

      {/* ── Footer Buttons ── */}
      {/* In-flow (not fixed) so they stay above the bottom nav bar */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" className="flex-1 h-12" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1 h-12" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : submitLabel}
        </Button>
      </div>
    </form>
  )
}
