import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  return (
    <div className="p-4">
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Account</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center px-4 leading-relaxed">
          PawPlate provides general nutritional guidance based on AAFCO 2016 standards.
          It is not a substitute for advice from a licensed veterinary nutritionist.
          Always consult your veterinarian before significantly changing your pet's diet.
        </p>
      </div>
    </div>
  )
}
