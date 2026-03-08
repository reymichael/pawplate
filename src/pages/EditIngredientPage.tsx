import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/ingredients'
import { toast } from 'sonner'

// ── Field descriptors ─────────────────────────────────────────────────────────
interface FieldDef {
  label: string
  key: string
  unit: string
  required?: boolean
}

const MACRO_FIELDS: FieldDef[] = [
  { label: 'Calories', key: 'kcal', unit: 'kcal', required: true },
  { label: 'Protein', key: 'protein_g', unit: 'g' },
  { label: 'Fat', key: 'fat_g', unit: 'g' },
  { label: 'Carbs', key: 'carbs_g', unit: 'g' },
  { label: 'Fiber', key: 'fiber_g', unit: 'g' },
]

const MINERAL_FIELDS: FieldDef[] = [
  { label: 'Calcium', key: 'calcium_mg', unit: 'mg' },
  { label: 'Phosphorus', key: 'phosphorus_mg', unit: 'mg' },
  { label: 'Iron', key: 'iron_mg', unit: 'mg' },
  { label: 'Zinc', key: 'zinc_mg', unit: 'mg' },
]

const VITAMIN_FIELDS: FieldDef[] = [
  { label: 'Vitamin A', key: 'vitamin_a_iu', unit: 'IU' },
  { label: 'Vitamin D', key: 'vitamin_d_iu', unit: 'IU' },
  { label: 'Taurine', key: 'taurine_mg', unit: 'mg' },
  { label: 'Omega-3', key: 'omega3_mg', unit: 'mg' },
]

type FormValues = Record<string, string>

// ── Sub-component: nutrient field group ───────────────────────────────────────
function FieldGroup({
  label,
  fields,
  values,
  onChange,
}: {
  label: string
  fields: FieldDef[]
  values: FormValues
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs text-muted-foreground block mb-1">
              {f.label} ({f.unit})
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values[f.key] ?? ''}
              onChange={e => onChange(f.key, e.target.value)}
              placeholder="0"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EditIngredientPage() {
  const { id } = useParams<{ id: string }>()   // raw UUID (no custom_ prefix)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !id) return
    supabase
      .from('custom_ingredients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Ingredient not found.')
          navigate('/ingredients')
          return
        }
        // Populate form with existing values (convert numbers to strings for inputs)
        setForm({
          name:           data.name,
          category:       data.category,
          kcal:           String(data.kcal),
          protein_g:      String(data.protein_g),
          fat_g:          String(data.fat_g),
          carbs_g:        String(data.carbs_g),
          fiber_g:        String(data.fiber_g),
          calcium_mg:     String(data.calcium_mg),
          phosphorus_mg:  String(data.phosphorus_mg),
          iron_mg:        String(data.iron_mg),
          zinc_mg:        String(data.zinc_mg),
          vitamin_a_iu:   String(data.vitamin_a_iu),
          vitamin_d_iu:   String(data.vitamin_d_iu),
          taurine_mg:     String(data.taurine_mg),
          omega3_mg:      String(data.omega3_mg),
          notes:          data.notes ?? '',
        })
        setLoading(false)
      })
  }, [user, id]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function num(key: string): number {
    const n = parseFloat(form[key] ?? '')
    return isNaN(n) ? 0 : n
  }

  async function handleSave() {
    if (!user) return
    if (!form.name?.trim()) { toast.error('Name is required'); return }
    if (num('kcal') <= 0) { toast.error('Calories (kcal) must be greater than 0'); return }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('custom_ingredients')
        .update({
          name:           form.name.trim(),
          category:       form.category,
          kcal:           num('kcal'),
          protein_g:      num('protein_g'),
          fat_g:          num('fat_g'),
          carbs_g:        num('carbs_g'),
          fiber_g:        num('fiber_g'),
          calcium_mg:     num('calcium_mg'),
          phosphorus_mg:  num('phosphorus_mg'),
          iron_mg:        num('iron_mg'),
          zinc_mg:        num('zinc_mg'),
          vitamin_a_iu:   num('vitamin_a_iu'),
          vitamin_d_iu:   num('vitamin_d_iu'),
          taurine_mg:     num('taurine_mg'),
          omega3_mg:      num('omega3_mg'),
          notes:          form.notes?.trim() || null,
        })
        .eq('id', id!)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success(`${form.name.trim()} updated!`)
      navigate('/ingredients')
    } catch {
      toast.error('Could not update ingredient. Please try again.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ingredients')}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-lg">Edit Ingredient</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><Save size={15} /> Save</>}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Info tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-700 leading-relaxed">
            Enter values <strong>per 100g</strong> (as-fed / cooked). Check the product label or
            use a nutrition database like{' '}
            <span className="font-medium">USDA FoodData Central</span>.
          </p>
        </div>

        {/* Name + Category */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Ingredient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Royal Canin Wet (Chicken)"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <select
              value={form.category ?? 'protein'}
              onChange={e => set('category', e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORY_ORDER.map(cat => (
                <option key={cat} value={cat}>{CATEGORY_LABEL[cat]}</option>
              ))}
            </select>
          </div>
        </div>

        <FieldGroup
          label="Macronutrients (per 100g)"
          fields={MACRO_FIELDS}
          values={form}
          onChange={set}
        />
        <FieldGroup
          label="Minerals (per 100g)"
          fields={MINERAL_FIELDS}
          values={form}
          onChange={set}
        />
        <FieldGroup
          label="Vitamins & Fatty Acids (per 100g)"
          fields={VITAMIN_FIELDS}
          values={form}
          onChange={set}
        />

        {/* Notes */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
          <textarea
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            placeholder="Safety notes, storage tips, brand details…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    </div>
  )
}
