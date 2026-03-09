import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User, ShieldAlert, ExternalLink, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const APP_VERSION = '1.0.0'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch {
      toast.error('Could not sign out. Please try again.')
      setSigningOut(false)
    }
  }

  return (
    <div className="p-4 pb-28">
      {/* Header */}
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Account and app information</p>
      </div>

      <div className="space-y-5">

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
            Account
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* User info */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">Signed in</p>
              </div>
            </div>

            {/* Sign out — confirm flow */}
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
              >
                <LogOut size={18} className="text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-600 flex-1">Sign Out</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ) : (
              <div className="px-4 py-3.5 flex items-center gap-3">
                <span className="text-sm text-foreground flex-1">Sign out of PawPlate?</span>
                <button
                  onClick={() => setConfirmLogout(false)}
                  disabled={signingOut}
                  className="text-xs px-3 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-xs px-3 h-8 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {signingOut && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Safety Resources ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
            Safety Resources
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <a
              href="tel:+18884264435"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <ShieldAlert size={18} className="text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">ASPCA Poison Control</p>
                <p className="text-xs text-muted-foreground">+1-888-426-4435 · 24/7 emergency hotline</p>
              </div>
              <ExternalLink size={15} className="text-muted-foreground shrink-0" />
            </a>

            <a
              href="https://www.aafco.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-base w-[18px] text-center shrink-0">📋</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">AAFCO Nutrient Profiles</p>
                <p className="text-xs text-muted-foreground">2016 standards used in PawPlate</p>
              </div>
              <ExternalLink size={15} className="text-muted-foreground shrink-0" />
            </a>

            <a
              href="https://fdc.nal.usda.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <span className="text-base w-[18px] text-center shrink-0">🔬</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">USDA FoodData Central</p>
                <p className="text-xs text-muted-foreground">Nutrition database for ingredient values</p>
              </div>
              <ExternalLink size={15} className="text-muted-foreground shrink-0" />
            </a>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
            About
          </h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground">App Version</span>
              <span className="text-sm text-muted-foreground font-mono">{APP_VERSION}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground">Nutritional Standard</span>
              <span className="text-sm text-muted-foreground">AAFCO 2016</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-foreground">Built-in Ingredients</span>
              <span className="text-sm text-muted-foreground">36 PH ingredients</span>
            </div>
          </div>
        </section>

        {/* ── Disclaimer ───────────────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Medical Disclaimer: </span>
            PawPlate provides general nutritional guidance based on AAFCO 2016 standards.
            It is not a substitute for advice from a licensed veterinary nutritionist.
            Always consult your veterinarian before significantly changing your pet&apos;s diet.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-2">
          Made with 🐾 for Philippine pet owners
        </p>
      </div>
    </div>
  )
}
