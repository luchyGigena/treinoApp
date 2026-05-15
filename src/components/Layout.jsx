import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Dumbbell, LayoutDashboard, Scale, ClipboardList, Users, LogOut, Menu, X, ShieldCheck
} from 'lucide-react'
import { useState } from 'react'

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-violet-100 text-violet-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <Icon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}

const ROLE_LABEL = { admin: 'Admin', trainer: 'Entrenador/a', client: 'Alumna' }

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems =
    user?.role === 'admin'
      ? [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
          { to: '/trainers', icon: Users, label: 'Clientes' },
        ]
      : user?.role === 'trainer'
      ? [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
          { to: '/clients', icon: Users, label: 'Alumnas' },
          { to: '/routines', icon: ClipboardList, label: 'Rutinas' },
        ]
      : [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
          { to: '/workout', icon: Dumbbell, label: 'Entreno hoy' },
          { to: '/weight', icon: Scale, label: 'Mi peso' },
          { to: '/progress', icon: ClipboardList, label: 'Progreso' },
        ]

  const avatarColor =
    user?.role === 'admin'
      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
      : 'bg-gradient-to-br from-violet-400 to-purple-500'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-900 text-sm">MelaniApp</span>
            {user?.role === 'admin' && (
              <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Admin
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold`}>
                {user?.avatar || user?.name?.[0]}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium text-gray-700 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABEL[user?.role]}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1.5 text-gray-500 hover:text-red-500 text-sm px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all"
            >
              <LogOut size={16} />
            </button>

            <button
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-30 bg-black/20" onClick={() => setMenuOpen(false)}>
          <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-1" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
                {user?.avatar || user?.name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{ROLE_LABEL[user?.role]}</p>
              </div>
            </div>
            {navItems.map((item) => (
              <NavItem key={item.to} {...item} onClick={() => setMenuOpen(false)} />
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5">
        {children}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-bottom">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-violet-600' : 'text-gray-400'
                }`
              }
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="h-16 md:h-0" />
    </div>
  )
}
