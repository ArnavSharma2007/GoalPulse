'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, Target, CheckSquare, BarChart, Settings, LogOut, Users, ShieldAlert, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = {
  employee: [
    { name: 'Dashboard', href: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'My Goals', href: '/employee/goals', icon: Target },
    { name: 'Check-in', href: '/employee/check-in', icon: CheckSquare },
  ],
  manager: [
    { name: 'Dashboard', href: '/manager/dashboard', icon: LayoutDashboard },
    { name: 'Approvals', href: '/manager/approvals', icon: CheckSquare },
    { name: 'Team Check-in', href: '/manager/check-in', icon: Users },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart },
    { name: 'Cycles & Config', href: '/admin/cycles', icon: Settings },
    { name: 'Escalations', href: '/admin/escalations', icon: ShieldAlert },
    { name: 'Audit Log', href: '/admin/audit-log', icon: History },
  ]
}

export function Navigation({ role, userName }: { role: 'employee'|'manager'|'admin', userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const items = NAV_ITEMS[role]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.aside 
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 min-h-screen glass-panel flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r border-white/10"
    >
      <div className="p-6 pb-2">
        <div className="mb-8">
          <img src="/logo.png" alt="GoalPulse" className="h-8 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold mt-2">{role} Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link key={item.name} href={item.href} className="block relative">
              {isActive && (
                <motion.div
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}>
                <Icon size={20} className={isActive ? 'text-indigo-400' : ''} />
                <span className="font-medium text-sm">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"
                  />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex items-center gap-3 backdrop-blur-md">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
            <span className="text-sm font-medium text-slate-200">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  )
}
