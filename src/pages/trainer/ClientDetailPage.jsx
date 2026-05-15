import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { storage } from '../../lib/storage'
import { ArrowLeft, Scale, ClipboardList, TrendingUp, Dumbbell } from 'lucide-react'
import WeightChart from '../../components/WeightChart'
import WeightLogList from '../../components/WeightLogList'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2 ${color}`}>
      <Icon size={20} className="opacity-80" />
      <div>
        <p className="text-xs opacity-70 font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function ClientDetailPage() {
  const { clientId } = useParams()
  const { getRoutinesForClient, getWeightLogs, getWorkoutHistory } = useApp()

  const users = storage.getUsers()
  const client = users.find((u) => String(u.id) === String(clientId))

  const routines = getRoutinesForClient(clientId)
  const weightLogs = getWeightLogs(clientId)
  const workoutHistory = getWorkoutHistory(clientId)

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : '-'
  const completedWorkouts = workoutHistory.filter(
    (l) => l.exercises.every((e) => e.completed)
  ).length

  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Alumna no encontrada</p>
        <Link to="/clients" className="text-violet-600 mt-2 inline-block text-sm">Volver</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/clients" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
            {client.avatar || client.name[0]}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{client.name}</h1>
            <p className="text-xs text-gray-500">{client.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard
          icon={Scale}
          label="Peso actual"
          value={latestWeight !== '-' ? `${latestWeight}kg` : '-'}
          color="bg-violet-600 text-white"
        />
        <StatCard
          icon={ClipboardList}
          label="Rutinas"
          value={routines.length}
          color="bg-pink-500 text-white"
        />
        <StatCard
          icon={Dumbbell}
          label="Completados"
          value={completedWorkouts}
          color="bg-emerald-500 text-white"
        />
      </div>

      {weightLogs.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-500" />
            Evolución de peso
          </h2>
          <WeightChart logs={weightLogs} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Rutinas asignadas</h2>
          <Link to="/routines" className="text-violet-600 text-sm font-medium hover:underline">
            Gestionar
          </Link>
        </div>

        {routines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <ClipboardList size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Sin rutinas asignadas</p>
            <Link to="/routines" className="text-violet-600 text-sm font-medium mt-1 inline-block">
              Asignar rutina
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {routines.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.days?.length || 0} días · {r.days?.flatMap((d) => d.exercises).length || 0} ejercicios
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {weightLogs.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Historial de peso</h2>
          <WeightLogList logs={[...weightLogs].reverse()} readOnly />
        </div>
      )}
    </div>
  )
}
