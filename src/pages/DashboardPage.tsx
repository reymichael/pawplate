import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import PetCard from '@/components/pets/PetCard'
import { Button } from '@/components/ui/button'
import type { Pet } from '@/types'
import { Plus, PawPrint, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchPets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function fetchPets() {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      setPets(data ?? [])
    } catch {
      toast.error('Could not load pets')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Pets</h1>
          <p className="text-sm text-muted-foreground">
            {pets.length > 0
              ? `${pets.length} pet${pets.length > 1 ? 's' : ''} registered`
              : 'No pets yet'}
          </p>
        </div>
        <Link to="/pets/new">
          <Button size="icon" className="h-11 w-11 rounded-full shadow-md">
            <Plus size={24} />
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center mt-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!loading && pets.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-16 text-center px-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <PawPrint size={36} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No pets yet</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Add your first pet to start planning balanced, homemade meals.
          </p>
          <Link to="/pets/new">
            <Button className="w-full max-w-xs h-12">
              <Plus size={18} />
              Add Your First Pet
            </Button>
          </Link>
        </div>
      )}

      {/* Pet grid */}
      {!loading && pets.length > 0 && (
        <div className="space-y-3">
          {pets.map(pet => (
            <PetCard key={pet.id} pet={pet} />
          ))}
          <Link to="/pets/new" className="block mt-2">
            <Button variant="outline" className="w-full h-12 border-dashed">
              <Plus size={16} />
              Add Another Pet
            </Button>
          </Link>
        </div>
      )}

      {/* AAFCO footer disclaimer */}
      <p className="text-xs text-muted-foreground text-center mt-8 px-4 leading-relaxed">
        Calorie targets based on AAFCO 2016 standards. Always consult your vet
        before significantly changing your pet's diet.
      </p>
    </div>
  )
}
