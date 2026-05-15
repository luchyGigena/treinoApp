import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dumbbell, CheckCircle2, Circle, ChevronDown, ChevronUp, Trophy, ClipboardList, Check
} from 'lucide-react'

const DAY_MAP = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
}

function normalizeDay(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function buildInitialSets(exercise, savedSets) {
  const numSets = parseInt(exercise.sets) || 1
  return Array.from({ length: numSets }, (_, i) => {
    const saved = savedSets?.[i]
    return {
      index: i,
      done: saved?.done || false,
      weight: saved?.weight ?? '',
      reps: saved?.reps ?? (exercise.reps || ''),
    }
  })
}

function SetRow({ setNum, set, targetReps, onChange, onToggle }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
      set.done ? 'bg-violet-50' : 'bg-gray-50'
    }`}>
      <span className={`text-xs font-bold w-5 text-center shrink-0 ${set.done ? 'text-violet-400' : 'text-gray-400'}`}>
        {setNum}
      </span>

      <div className="flex items-center gap-1.5 flex-1">
        <div className="relative flex-1">
          <input
            type="number"
            min="0"
            step="0.5"
            value={set.weight}
            onChange={(e) => onChange({ ...set, weight: e.target.value })}
            placeholder="—"
            className={`w-full text-center text-sm font-semibold px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all ${
              set.done
                ? 'bg-violet-100 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
          <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${set.done ? 'text-violet-400' : 'text-gray-400'}`}>
            kg
          </span>
        </div>

        <span className="text-gray-300 text-xs">×</span>

        <div className="relative flex-1">
          <input
            type="number"
            min="0"
            step="1"
            value={set.reps}
            onChange={(e) => onChange({ ...set, reps: e.target.value })}
            placeholder={targetReps || '—'}
            className={`w-full text-center text-sm font-semibold px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all ${
              set.done
                ? 'bg-violet-100 border-violet-200 text-violet-700'
                : 'bg-white border-gray-200 text-gray-800'
            }`}
          />
          <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none ${set.done ? 'text-violet-400' : 'text-gray-400'}`}>
            rep
          </span>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          set.done
            ? 'bg-violet-500 text-white shadow-sm shadow-violet-200'
            : 'bg-white border-2 border-gray-200 text-gray-300 hover:border-violet-300'
        }`}
      >
        <Check size={15} strokeWidth={3} />
      </button>
    </div>
  )
}

function ExerciseCard({ exercise, initialSets, onSetsChange }) {
  const [sets, setSets] = useState(initialSets)
  const [expanded, setExpanded] = useState(true)

  const doneSets = sets.filter((s) => s.done).length
  const totalSets = sets.length
  const allDone = doneSets === totalSets && totalSets > 0

  function updateSet(index, newSet) {
    const updated = sets.map((s, i) => (i === index ? newSet : s))
    setSets(updated)
    onSetsChange(updated)
  }

  function toggleSet(index) {
    const updated = sets.map((s, i) => {
      if (i !== index) return s
      const willBeDone = !s.done
      const prevWeight = willBeDone && s.weight === '' && index > 0
        ? sets[index - 1].weight
        : s.weight
      return { ...s, done: willBeDone, weight: prevWeight }
    })
    setSets(updated)
    onSetsChange(updated)
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      allDone ? 'border-violet-200 bg-violet-50/30' : 'border-gray-100 bg-white'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          allDone ? 'bg-violet-500' : doneSets > 0 ? 'bg-violet-100' : 'bg-gray-100'
        }`}>
          {allDone
            ? <CheckCircle2 size={16} className="text-white" />
            : <Dumbbell size={16} className={doneSets > 0 ? 'text-violet-500' : 'text-gray-400'} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${allDone ? 'text-violet-700' : 'text-gray-900'}`}>
            {exercise.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-xs ${allDone ? 'text-violet-500' : 'text-gray-400'}`}>
              {doneSets}/{totalSets} series
            </span>
            {exercise.rest && (
              <span className="text-xs text-gray-400">· ⏱ {exercise.rest}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex gap-0.5">
            {sets.map((s, i) => (
              <div
                key={i}
                className={`w-1.5 h-4 rounded-full transition-all ${
                  s.done ? 'bg-violet-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400 ml-1" />
            : <ChevronDown size={16} className="text-gray-400 ml-1" />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100/80">
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <span className="text-xs text-gray-400 w-5"></span>
            <span className="flex-1 text-center text-xs font-medium text-gray-400">Peso</span>
            <span className="text-gray-200 text-xs">×</span>
            <span className="flex-1 text-center text-xs font-medium text-gray-400">Reps</span>
            <span className="w-8"></span>
          </div>
          {sets.map((set, i) => (
            <SetRow
              key={i}
              setNum={i + 1}
              set={set}
              targetReps={exercise.reps}
              onChange={(newSet) => updateSet(i, newSet)}
              onToggle={() => toggleSet(i)}
            />
          ))}
          {exercise.notes && (
            <p className="text-xs text-gray-400 italic px-3 pt-1">{exercise.notes}</p>
          )}
          {allDone && (
            <div className="flex items-center justify-center gap-1.5 py-2 text-violet-500">
              <Trophy size={15} />
              <p className="text-xs font-bold">¡Ejercicio completado!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoutineSection({ routine, todayDay, date, clientId }) {
  const { getWorkoutLog, saveWorkoutLog } = useApp()

  const dayData = routine.days?.find(
    (d) => normalizeDay(d.day) === normalizeDay(todayDay)
  )

  if (!dayData || dayData.exercises.length === 0) return null

  const logId = `${clientId}_${date}_${routine.id}`
  const existingLog = getWorkoutLog(clientId, date, routine.id)

  const [exerciseStates, setExerciseStates] = useState(() =>
    dayData.exercises.map((ex) => {
      const saved = existingLog?.exercises?.find((e) => e.exerciseId === ex.id)
      return {
        exerciseId: ex.id,
        sets: buildInitialSets(ex, saved?.sets),
        completed: saved?.completed || false,
      }
    })
  )

  const [routineExpanded, setRoutineExpanded] = useState(true)

  function handleSetsChange(exerciseId, newSets) {
    const updated = exerciseStates.map((e) => {
      if (e.exerciseId !== exerciseId) return e
      const allDone = newSets.length > 0 && newSets.every((s) => s.done)
      return { ...e, sets: newSets, completed: allDone }
    })
    setExerciseStates(updated)
    saveWorkoutLog({
      id: logId,
      clientId,
      date,
      routineId: routine.id,
      exercises: updated,
    })
  }

  const completedExercises = exerciseStates.filter((e) => e.completed).length
  const totalExercises = exerciseStates.length
  const allDone = completedExercises === totalExercises
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setRoutineExpanded(!routineExpanded)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${allDone ? 'bg-violet-100' : 'bg-gray-100'}`}>
          {allDone
            ? <Trophy size={18} className="text-violet-600" />
            : <Dumbbell size={18} className="text-gray-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{routine.name}</p>
          <p className="text-xs text-gray-500">{completedExercises}/{totalExercises} ejercicios</p>
          <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {routineExpanded
          ? <ChevronUp size={18} className="text-gray-400 shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 shrink-0" />
        }
      </button>

      {routineExpanded && (
        <div className="px-3 pb-4 space-y-2.5 border-t border-gray-50 pt-3">
          {dayData.exercises.map((ex) => {
            const state = exerciseStates.find((e) => e.exerciseId === ex.id)
            return (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                initialSets={state?.sets || buildInitialSets(ex, [])}
                onSetsChange={(newSets) => handleSetsChange(ex.id, newSets)}
              />
            )
          })}
          {allDone && (
            <div className="flex items-center justify-center gap-2 py-3 text-violet-600 bg-violet-50 rounded-2xl">
              <Trophy size={20} />
              <p className="font-bold text-sm">¡Rutina completada! 🎉</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkoutPage() {
  const { user } = useAuth()
  const { getRoutinesForClient } = useApp()

  const routines = getRoutinesForClient(user.id)
  const today = new Date()
  const todayDay = DAY_MAP[today.getDay()]
  const todayStr = format(today, 'yyyy-MM-dd')
  const displayDate = format(today, "EEEE d 'de' MMMM", { locale: es })

  const routinesWithToday = routines.filter((r) =>
    r.days?.some((d) => normalizeDay(d.day) === normalizeDay(todayDay))
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Entreno de hoy</h1>
        <p className="text-sm text-gray-500 capitalize">{displayDate} · {todayDay}</p>
      </div>

      {routines.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <ClipboardList size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="font-semibold text-gray-700">Todavía no tenés rutinas asignadas</p>
          <p className="text-gray-500 text-sm mt-1">Tu entrenadora las va a cargar pronto</p>
        </div>
      ) : routinesWithToday.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
            <Trophy size={28} className="text-violet-400" />
          </div>
          <p className="font-semibold text-gray-800">¡Hoy es día de descanso!</p>
          <p className="text-gray-500 text-sm mt-1">No hay ejercicios programados para el {todayDay.toLowerCase()}</p>
          <div className="mt-4 text-left bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-2">Días con entrenamiento:</p>
            {routines.flatMap((r) => r.days?.map((d) => d.day) || [])
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((day) => (
                <span key={day} className="inline-block text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full mr-1 mb-1">{day}</span>
              ))
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {routinesWithToday.map((routine) => (
            <RoutineSection
              key={routine.id}
              routine={routine}
              todayDay={todayDay}
              date={todayStr}
              clientId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
