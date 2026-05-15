import { useApp } from '../../context/AppContext'
import { Link } from 'react-router-dom'
import { Users, Dumbbell, ChevronRight, UserCheck, UserX, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { storage } from '../../lib/storage'

function TrainerRow({ trainer }) {
  const { getTrainerStats } = useApp()
  const stats = getTrainerStats(trainer.id)
  const isActive = trainer.active !== false

  return (
    <Link
      to={`/trainers/${trainer.id}`}
      className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all"
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
        isActive
          ? 'bg-gradient-to-br from-violet-400 to-purple-500'
          : 'bg-gray-300'
      }`}>
        {trainer.avatar || trainer.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm truncate">{trainer.name}</p>
          {!isActive && (
            <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-medium shrink-0">Inactivo</span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{trainer.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-gray-700">{stats.clientCount} alumnas</p>
        <p className="text-xs text-gray-400">{stats.routineCount} rutinas</p>
      </div>
      <ChevronRight size={16} className="text-gray-400 shrink-0" />
    </Link>
  )
}

export default function AdminDashboard() {
  const { getTrainers, getTrainerStats } = useApp()
  const trainers = getTrainers()

  const allUsers = storage.getUsers()
  const totalClients = allUsers.filter((u) => u.role === 'client').length
  const activeTrainers = trainers.filter((t) => t.active !== false).length

  const totalStats = trainers.reduce(
    (acc, t) => {
      const s = getTrainerStats(t.id)
      return {
        clients: acc.clients + s.clientCount,
        routines: acc.routines + s.routineCount,
        workouts: acc.workouts + s.completedWorkouts,
      }
    },
    { clients: 0, routines: 0, workouts: 0 }
  )

  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Panel general</h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
          <Users size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{trainers.length}</p>
          <p className="text-xs opacity-80">{activeTrainers} activos · Clientes</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white">
          <UserCheck size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{totalStats.clients}</p>
          <p className="text-xs opacity-80">Alumnas en total</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <Dumbbell size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{totalStats.routines}</p>
          <p className="text-xs opacity-80">Rutinas activas</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
          <TrendingUp size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{totalStats.workouts}</p>
          <p className="text-xs opacity-80">Entrenos completados</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Clientes</h2>
          <Link to="/trainers" className="text-violet-600 text-sm font-medium hover:underline flex items-center gap-0.5">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {trainers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <Users size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Todavía no hay clientes registrados</p>
            <Link to="/trainers" className="text-violet-600 text-sm font-medium mt-1 inline-block">
              Agregar cliente
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {trainers.slice(0, 5).map((t) => (
              <TrainerRow key={t.id} trainer={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
