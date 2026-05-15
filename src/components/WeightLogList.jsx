import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react'

export default function WeightLogList({ logs, onDelete, readOnly = false }) {
  return (
    <div className="space-y-2">
      {logs.map((log, idx) => {
        const prev = logs[idx + 1]
        const diff = prev ? parseFloat(log.weight) - parseFloat(prev.weight) : null
        return (
          <div key={log.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg">{log.weight} kg</p>
                {diff !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    diff < 0 ? 'bg-emerald-100 text-emerald-600' :
                    diff > 0 ? 'bg-red-100 text-red-500' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {diff < 0 ? <TrendingDown size={12} /> : diff > 0 ? <TrendingUp size={12} /> : <Minus size={12} />}
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 capitalize">
                {format(parseISO(log.date), "EEEE d 'de' MMMM yyyy", { locale: es })}
              </p>
              {log.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{log.notes}</p>}
            </div>
            {!readOnly && onDelete && (
              <button
                onClick={() => onDelete(log.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
