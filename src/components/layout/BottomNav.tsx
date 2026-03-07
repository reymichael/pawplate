import { NavLink } from 'react-router-dom'
import { Home, UtensilsCrossed, Calculator, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Pets', icon: Home },
  { to: '/recipes', label: 'Recipes', icon: UtensilsCrossed },
  { to: '/pantry', label: 'Pantry', icon: Calculator },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-h-[44px] rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
