import { Link } from 'react-router-dom'
import { calculateMER, getLifeStage, formatKcal, formatLifeStage } from '@/lib/petCalculations'
import type { Pet } from '@/types'
import { ChevronRight } from 'lucide-react'

interface PetCardProps {
  pet: Pet
}

const SPECIES_EMOJI: Record<string, string> = { dog: '🐶', cat: '🐱' }

const LIFE_STAGE_COLOR: Record<string, string> = {
  puppy: 'bg-blue-100 text-blue-700',
  junior: 'bg-purple-100 text-purple-700',
  adult: 'bg-green-100 text-green-700',
  senior: 'bg-amber-100 text-amber-700',
}

export default function PetCard({ pet }: PetCardProps) {
  const mer = calculateMER(pet)
  const lifeStage = getLifeStage(pet)

  return (
    <Link
      to={`/pets/${pet.id}`}
      className="block bg-card rounded-2xl border border-border shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
    >
      {/* Color band by species */}
      <div className={`h-2 w-full ${pet.species === 'dog' ? 'bg-primary' : 'bg-violet-400'}`} />

      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{SPECIES_EMOJI[pet.species]}</span>
            <div>
              <h3 className="font-bold text-foreground leading-tight">{pet.name}</h3>
              {pet.breed && (
                <p className="text-xs text-muted-foreground">{pet.breed}</p>
              )}
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground mt-1 shrink-0" />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LIFE_STAGE_COLOR[lifeStage]}`}>
            {formatLifeStage(lifeStage)}
          </span>
          <span className="text-xs text-muted-foreground">
            {pet.weight_kg} kg
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs font-medium text-foreground">
            {formatKcal(mer)} kcal/day
          </span>
        </div>

        {/* Neutered badge */}
        {pet.neutered && (
          <p className="text-xs text-muted-foreground mt-2">
            {pet.sex === 'female' ? 'Spayed' : 'Neutered'} ·{' '}
            {pet.activity_level.charAt(0).toUpperCase() + pet.activity_level.slice(1)}
          </p>
        )}
      </div>
    </Link>
  )
}
