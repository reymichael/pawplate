import { UtensilsCrossed } from 'lucide-react'

export default function RecipesPage() {
  return (
    <div className="p-4">
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Recipes</h1>
        <p className="text-sm text-muted-foreground">Build and save meal recipes</p>
      </div>
      <div className="flex flex-col items-center justify-center mt-20 text-center px-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <UtensilsCrossed size={36} className="text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">No recipes yet</h2>
        <p className="text-muted-foreground text-sm">
          Coming in the next session — add a pet first to get started.
        </p>
      </div>
    </div>
  )
}
