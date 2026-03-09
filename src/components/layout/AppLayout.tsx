import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      {/* pb-nav = 5rem fixed-nav height + env(safe-area-inset-bottom) for notched phones */}
      <main className="flex-1 overflow-y-auto overscroll-none pb-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
