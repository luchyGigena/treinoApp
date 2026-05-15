import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { nanoid } from '../../lib/nanoid'
import { format } from 'date-fns'
import { Scale, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import WeightChart from '../../components/WeightChart'
import WeightLogList from '../../components/WeightLogList'

export default function WeightPage() {
  const { user } = useAuth()
  const { getWeightLogs, addWeightLog, deleteWeightLog, refresh } = useApp()
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [success, setSuccess] = useState(false)

  const logs = getWeightLogs(user.id)
  const latest = logs.length > 0 ? logs[logs.length - 1] : null
  const first = logs.length > 0 ? logs[0] : null
  const totalDiff = latest && first && logs.length > 1
    ? (parseFloat(latest.weight) - parseFloat(first.weight)).toFixed(1)
    : null

  function handleSubmit(e) {
    e.preventDefault()
    if (!weight || isNaN(parseFloat(weight))) return
    addWeightLog({
      id: nanoid(),
      clientId: user.id,
      date,
      weight: parseFloat(weight).toFixed(1),
      notes: notes.trim(),
    })
    setWeight('')
    setNotes('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi peso</h1>
        <p className="text-sm text-gray-500">Registrá tu evolución</p>
      </div>

      {logs.length >= 2 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Peso inicial</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{first.weight} kg</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(first.date + 'T00:00'), 'd/M/yy')}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500 font-medium">Cambio total</p>
              {totalDiff !== null ? (
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-2xl font-bold ${parseFloat(totalDiff) < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {parseFloat(totalDiff) > 0 ? '+' : ''}{totalDiff} kg
                  </p>
                  {parseFloat(totalDiff) < 0
                    ? <TrendingDown size={18} className="text-emerald-500" />
                    : <TrendingUp size={18} className="text-red-500" />
                  }
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-400 mt-1">-</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">Evolución</h2>
            <WeightChart logs={logs} />
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm">
          <Scale size={18} className="text-violet-500" />
          Registrar peso
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65.5"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: en ayunas"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-3 py-2.5 font-medium">
              ✓ Peso registrado correctamente
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-sm shadow-md shadow-violet-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Guardar
          </button>
        </form>
      </div>

      {logs.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Historial</h2>
          <WeightLogList
            logs={[...logs].reverse()}
            onDelete={deleteWeightLog}
          />
        </div>
      )}
    </div>
  )
}
