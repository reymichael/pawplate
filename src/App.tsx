import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import AuthPage from '@/components/auth/AuthPage'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import RecipesPage from '@/pages/RecipesPage'
import PantryPage from '@/pages/PantryPage'
import SettingsPage from '@/pages/SettingsPage'
import AddPetPage from '@/pages/AddPetPage'
import PetDetailPage from '@/pages/PetDetailPage'
import AddRecipePage from '@/pages/AddRecipePage'
import RecipeDetailPage from '@/pages/RecipeDetailPage'
import IngredientsPage from '@/pages/IngredientsPage'
import AddIngredientPage from '@/pages/AddIngredientPage'
import EditIngredientPage from '@/pages/EditIngredientPage'
import EditRecipePage from '@/pages/EditRecipePage'
import FeedingLogPage from '@/pages/FeedingLogPage'
import OnboardingPage from '@/pages/OnboardingPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  // ── Session + profile loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!user) {
    return <AuthPage />
  }

  // ── Profile still resolving after auth state change ───────────────────────
  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Onboarding: new user (no profile row) or not yet completed ────────────
  if (!profile || !profile.onboarding_completed) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  // ── Full app ──────────────────────────────────────────────────────────────
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/pets/new" element={<AddPetPage />} />
        <Route path="/pets/:id/log" element={<FeedingLogPage />} />
        <Route path="/pets/:id" element={<PetDetailPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/new" element={<AddRecipePage />} />
        <Route path="/recipes/:id/edit" element={<EditRecipePage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/ingredients" element={<IngredientsPage />} />
        <Route path="/ingredients/new" element={<AddIngredientPage />} />
        <Route path="/ingredients/:id/edit" element={<EditIngredientPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster richColors position="top-center" />
    </BrowserRouter>
  )
}
