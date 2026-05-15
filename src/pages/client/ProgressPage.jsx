import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { storage } from '../../lib/storage'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  TrendingUp, Dumbbell, Trophy, Scale, ChevronDown, ChevronUp, Weight
} from 'lucide-react'
import WeightChart from '../../components/WeightChart'

function WorkoutHistoryItem({ log, routine }) {
  const [expanded, setExpanded] = useState(false)
  const total = log.exercises.length
  const done = log.exercises.filter((e) => e.completed).length
  const allDone = done === total

  function getExerciseName(exerciseId) {
    for (const day of routine?.days || []) {
      const ex = day.exercises.find((e) => e.id === exerciseId)
      if (ex) return ex.name
    }
    return 'Ejercicio'
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${allDone ? 'border-violet-100' : 'border-gray-100'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-start justify-between gap-2 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{routine?.name || 'Rutina'}</p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">
            {format(parseISO(log.date), "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {allDone
            ? <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
                <Trophy size={12} /> Completo
              </span>
            : <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{done}/{total}</span>
          }
          {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-3 pt-2 space-y-2">
          {log.exercises.map((exState) => {
            const name = getExerciseName(exState.exerciseId)
            const hasSets = exState.sets?.some((s) => s.weight || s.reps)
            return (
              <div
                key={exState.exerciseId}
                className={`rounded-xl px-3 py-2.5 ${exState.completed ? 'bg-violet-50' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${exState.completed ? 'text-violet-700' : 'text-gray-600'}`}>
                    {name}
                  </p>
                  {exState.completed && (
                    <span className="text-xs text-violet-500 font-medium">✓</span>
                  )}
                </div>
                {hasSets && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {exState.sets.map((s, i) => (
                      s.done ? (
                        <span
                          key={i}
                          className="text-xs bg-white border border-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium"
                        >
                          {i + 1}. {s.weight ? `${s.weight}kg` : '—'} × {s.reps || '—'}
                        </span>
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProgressPage() {
  const { user } = useAuth()
  const { getWeightLogs, getWorkoutHistory } = useApp()

  const weightLogs = getWeightLogs(user.id)
  const workoutHistory = getWorkoutHistory(user.id)
  const routines = storage.getRoutines().filter((r) => r.clientId === user.id)

  const completedCount = workoutHistory.filter((l) => l.exercises.every((e) => e.completed)).length
  const partialCount = workoutHistory.filter(
    (l) => l.exercises.some((e) => e.completed) && !l.exercises.every((e) => e.completed)
  ).length
  const totalSetsLogged = workoutHistory
    .flatMap((l) => l.exercises)
    .flatMap((e) => e.sets || [])
    .filter((s) => s.done && s.weight).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi progreso</h1>
        <p className="text-sm text-gray-500">Tu evolución completa</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
          <Trophy size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs opacity-80">Entrenos completos</p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-4 text-white">
          <Dumbbell size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{totalSetsLogged}</p>
          <p className="text-xs opacity-80">Series con peso anotado</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white">
          <Scale size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{weightLogs.length}</p>
          <p className="text-xs opacity-80">Registros de peso</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white">
          <TrendingUp size={20} className="mb-2 opacity-80" />
          <p className="text-2xl font-bold">{partialCount}</p>
          <p className="text-xs opacity-80">Entrenos parciales</p>
        </div>
      </div>

      {weightLogs.length >= 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <Scale size={16} className="text-violet-500" />
            Evolución de peso corporal
          </h2>
          <WeightChart logs={weightLogs} />
          <div className="flex justify-between mt-3 text-xs text-gray-500 px-1">
            <span>Inicial: <strong className="text-gray-700">{weightLogs[0].weight} kg</strong></span>
            <span>Actual: <strong className="text-gray-700">{weightLogs[weightLogs.length - 1].weight} kg</strong></span>
          </div>
        </div>
      )}

      {workoutHistory.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Historial de entrenos</h2>
          <p className="text-xs text-gray-400 mb-2">Tocá un entreno para ver los pesos registrados</p>
          <div className="space-y-2">
            {workoutHistory.slice(0, 30).map((log) => {
              const routine = routines.find((r) => r.id === log.routineId)
              return (
                <WorkoutHistoryItem key={log.id} log={log} routine={routine} />
              )
            })}
          </div>
        </div>
      )}

      {workoutHistory.length === 0 && weightLogs.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <TrendingUp size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Aún no hay datos de progreso</p>
          <p className="text-gray-500 text-sm mt-1">Comenzá a entrenar y registrar tu peso para ver tu evolución</p>
        </div>
      )}
    </div>
  )
}
