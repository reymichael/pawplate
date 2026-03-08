import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import PetForm, { type PetFormValues } from '@/components/pets/PetForm'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function AddPetPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(values: PetFormValues) {
    try {
      const { error } = await supabase.from('pets').insert({
        user_id: user!.id,
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
      if (error) throw error
      toast.success(`${values.name} added!`)
      navigate('/')
    } catch {
      toast.error('Could not save pet. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b flex items-center gap-3 px-4 h-14">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-lg">Add a Pet</h1>
      </div>

      <div className="p-4">
        <PetForm
          onSubmit={handleSubmit}
          onCancel={() => navigate('/')}
          submitLabel="Add Pet"
        />
      </div>
    </div>
  )
}
