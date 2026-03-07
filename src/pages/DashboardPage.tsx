import { PawPrint, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Pets</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button size="icon" className="h-11 w-11 rounded-full shadow-md">
          <Plus size={24} />
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center mt-20 text-center px-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <PawPrint size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No pets yet</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Add your first pet to start planning balanced, homemade meals.
        </p>
        <Button className="w-full max-w-xs h-12">
          <Plus size={18} />
          Add Your First Pet
        </Button>
      </div>
    </div>
  )
}
