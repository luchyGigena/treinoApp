import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { Link } from 'react-router-dom'
import { Dumbbell, Scale, TrendingUp, ChevronRight, Flame } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function QuickCard({ to, icon: Icon, title, sub, color, bgColor }) {
  return (
    <Link
      to={to}
      className={`${bgColor} border rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.97] transition-all`}
    >
      <Icon size={24} className={color} />
      <div>
        <p className={`font-semibold text-sm ${color}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <ChevronRight size={14} className="text-gray-400 self-end" />
    </Link>
  )
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const { getRoutinesForClient, getWeightLogs, getWorkoutHistory } = useApp()

  const routines = getRoutinesForClient(user.id)
  const weightLogs = getWeightLogs(user.id)
  const history = getWorkoutHistory(user.id)

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null
  const prevWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2].weight : null
  const weightDiff = latestWeight && prevWeight
    ? (parseFloat(latestWeight) - parseFloat(prevWeight)).toFixed(1)
    : null

  const totalCompleted = history.filter((l) => l.exercises.every((e) => e.completed)).length
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const trainedToday = history.some((l) => l.date === todayStr && l.exercises.some((e) => e.completed))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Hola, {user.name.split(' ')[0]}! 💪
        </h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </div>

      {trainedToday && (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 flex items-center gap-3 text-white">
          <Flame size={28} className="shrink-0" />
          <div>
            <p className="font-bold">¡Entrenaste hoy!</p>
            <p className="text-sm opacity-80">Seguí así, vas muy bien 🔥</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Peso actual</p>
          {latestWeight ? (
            <>
              <p className="text-2xl font-bold text-gray-900">{latestWeight} kg</p>
              {weightDiff && (
                <p className={`text-xs font-medium mt-0.5 ${
                  parseFloat(weightDiff) < 0 ? 'text-emerald-500' : 'text-red-400'
                }`}>
                  {parseFloat(weightDiff) > 0 ? '+' : ''}{weightDiff} kg desde la última vez
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Sin registros</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Entrenos completos</p>
          <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
          <p className="text-xs text-gray-400 mt-0.5">en total</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <QuickCard
          to="/workout"
          icon={Dumbbell}
          title="Entreno de hoy"
          sub={routines.length > 0 ? `${routines.length} rutina${routines.length > 1 ? 's' : ''} asignada${routines.length > 1 ? 's' : ''}` : 'Sin rutinas aún'}
          color="text-violet-600"
          bgColor="bg-violet-50 border-violet-100"
        />
        <QuickCard
          to="/weight"
          icon={Scale}
          title="Registrar peso"
          sub={latestWeight ? `Último: ${latestWeight} kg` : 'Sin registros'}
          color="text-pink-600"
          bgColor="bg-pink-50 border-pink-100"
        />
      </div>

      <QuickCard
        to="/progress"
        icon={TrendingUp}
        title="Ver mi progreso"
        sub={`${weightLogs.length} registros de peso · ${totalCompleted} entrenos completados`}
        color="text-emerald-600"
        bgColor="bg-emerald-50 border-emerald-100"
      />
    </div>
  )
}
