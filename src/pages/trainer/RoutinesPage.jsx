import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { storage } from '../../lib/storage'
import { nanoid } from '../../lib/nanoid'
import * as XLSX from 'xlsx'
import {
  ClipboardList, Upload, Trash2, X, ChevronDown, ChevronUp, FileSpreadsheet, Info, Copy, Check
} from 'lucide-react'

const DAY_CANONICAL = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
  viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
}

function canonicalDay(raw) {
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
  return DAY_CANONICAL[normalized] || raw
}

function ExcelHint() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Info size={16} className="text-blue-500 shrink-0" />
        <span className="text-sm font-medium text-blue-700">¿Cómo preparar el Excel?</span>
        {open ? <ChevronUp size={16} className="text-blue-500 ml-auto" /> : <ChevronDown size={16} className="text-blue-500 ml-auto" />}
      </button>
      {open && (
        <div className="mt-3 text-xs text-blue-700 space-y-1.5">
          <p>El archivo debe tener estas columnas (en orden):</p>
          <div className="bg-white rounded-xl p-3 font-mono text-xs text-gray-700 border border-blue-100 overflow-x-auto">
            <span className="text-violet-600">Dia</span> | <span className="text-violet-600">Ejercicio</span> | <span className="text-violet-600">Series</span> | <span className="text-violet-600">Reps</span> | <span className="text-violet-600">Descanso</span> | <span className="text-violet-600">Notas</span>
          </div>
          <p>Ejemplo de fila:</p>
          <div className="bg-white rounded-xl p-3 font-mono text-xs text-gray-700 border border-blue-100 overflow-x-auto whitespace-nowrap">
            Lunes | Sentadilla | 4 | 12 | 60s | Con mancuernas
          </div>
          <p className="text-blue-600">• Podés repetir el mismo día para agrupar ejercicios.</p>
          <p className="text-blue-600">• Las columnas Descanso y Notas son opcionales.</p>
        </div>
      )}
    </div>
  )
}

function UploadModal({ clients, onClose }) {
  const { addRoutine } = useApp()
  const [clientId, setClientId] = useState('')
  const [routineName, setRoutineName] = useState('')
  const [parsed, setParsed] = useState(null)
  const [error, setError] = useState('')

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        const dataRows = rows.slice(1).filter((r) => r[0] || r[1])
        if (dataRows.length === 0) {
          setError('El archivo está vacío o no tiene el formato correcto.')
          return
        }
        const dayMap = {}
        dataRows.forEach((row) => {
          const day = canonicalDay(String(row[0] || '').trim())
          const name = String(row[1] || '').trim()
          if (!day || !name) return
          if (!dayMap[day]) dayMap[day] = []
          dayMap[day].push({
            id: nanoid(),
            name,
            sets: String(row[2] || ''),
            reps: String(row[3] || ''),
            rest: String(row[4] || ''),
            notes: String(row[5] || ''),
          })
        })
        const days = Object.entries(dayMap).map(([day, exercises]) => ({ day, exercises }))
        setParsed(days)
        if (!routineName) setRoutineName(file.name.replace(/\.[^.]+$/, ''))
      } catch {
        setError('No se pudo leer el archivo. Verificá que sea un .xlsx o .xls válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleSave() {
    if (!clientId) { setError('Seleccioná una alumna'); return }
    if (!routineName.trim()) { setError('Ingresá un nombre para la rutina'); return }
    if (!parsed) { setError('Cargá un archivo Excel primero'); return }
    addRoutine({
      id: nanoid(),
      clientId,
      name: routineName.trim(),
      days: parsed,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Cargar rutina desde Excel</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <ExcelHint />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alumna</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            >
              <option value="">Seleccionar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la rutina</label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Ej: Rutina Fuerza Semana 1"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Archivo Excel</label>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition-all">
              <FileSpreadsheet size={28} className="text-gray-400" />
              <span className="text-sm text-gray-500">Tocá para seleccionar .xlsx o .xls</span>
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {parsed && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <p className="text-emerald-700 font-semibold text-sm">✓ Archivo leído correctamente</p>
              <p className="text-emerald-600 text-xs mt-0.5">
                {parsed.length} días · {parsed.flatMap((d) => d.exercises).length} ejercicios
              </p>
              <div className="mt-2 space-y-1">
                {parsed.map((d) => (
                  <p key={d.day} className="text-xs text-emerald-700">
                    <span className="font-medium">{d.day}:</span> {d.exercises.map((e) => e.name).join(', ')}
                  </p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-violet-200"
            >
              Guardar rutina
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssignModal({ routine, clients, onClose }) {
  const { addRoutine } = useApp()
  const [selectedIds, setSelectedIds] = useState([])
  const [saved, setSaved] = useState(false)

  const availableClients = clients.filter((c) => c.id !== routine.clientId)

  function toggle(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleAssign() {
    if (selectedIds.length === 0) return
    selectedIds.forEach((clientId) => {
      addRoutine({
        id: nanoid(),
        clientId,
        name: routine.name,
        days: routine.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((ex) => ({ ...ex, id: nanoid() })),
        })),
        createdAt: new Date().toISOString(),
      })
    })
    setSaved(true)
    setTimeout(onClose, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900 text-lg">Asignar a otra alumna</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Se va a crear una copia de <span className="font-semibold text-gray-700">"{routine.name}"</span> para cada alumna que selecciones.
        </p>

        {availableClients.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No hay otras alumnas registradas.
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {availableClients.map((client) => {
              const selected = selectedIds.includes(client.id)
              return (
                <button
                  key={client.id}
                  onClick={() => toggle(client.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selected
                      ? 'border-violet-300 bg-violet-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {client.avatar || client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${selected ? 'text-violet-700' : 'text-gray-900'}`}>
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{client.email}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
                  }`}>
                    {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {saved ? (
          <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 bg-emerald-50 rounded-xl font-semibold text-sm">
            <Check size={18} /> ¡Rutina asignada!
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={selectedIds.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-violet-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Asignar{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoutineCard({ routine, clients, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const users = storage.getUsers()
  const client = users.find((u) => u.id === routine.clientId)
  const totalExercises = routine.days?.flatMap((d) => d.exercises).length || 0

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="p-4 flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <ClipboardList size={18} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{routine.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {client?.name || 'Sin asignar'} · {routine.days?.length || 0} días · {totalExercises} ejercicios
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAssign(true) }}
              title="Asignar a otra alumna"
              className="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar esta rutina?')) onDelete(routine.id) }}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 size={16} />
            </button>
            {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
            {routine.days?.map((day) => (
              <div key={day.day}>
                <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">{day.day}</p>
                <div className="space-y-1.5">
                  {day.exercises.map((ex) => (
                    <div key={ex.id} className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm">
                      <p className="font-medium text-gray-800">{ex.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {ex.sets && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{ex.sets} series</span>}
                        {ex.reps && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{ex.reps} reps</span>}
                        {ex.rest && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{ex.rest} descanso</span>}
                        {ex.notes && <span className="text-xs text-gray-500 italic">{ex.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAssign && (
        <AssignModal
          routine={routine}
          clients={clients}
          onClose={() => setShowAssign(false)}
        />
      )}
    </>
  )
}

export default function RoutinesPage() {
  const { user } = useAuth()
  const { getAllRoutines, deleteRoutine, getClients } = useApp()
  const [showModal, setShowModal] = useState(false)

  const clients = getClients(user.id)
  const allRoutines = getAllRoutines().filter((r) =>
    clients.some((c) => c.id === r.clientId)
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rutinas</h1>
          <p className="text-sm text-gray-500">{allRoutines.length} cargadas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-violet-200 active:scale-[0.97] transition-all"
        >
          <Upload size={16} />
          Cargar Excel
        </button>
      </div>

      {allRoutines.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet size={28} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">Sin rutinas todavía</p>
            <p className="text-gray-500 text-sm mt-1">Cargá un Excel para asignar rutinas a tus alumnas</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
            >
              Subir Excel
            </button>
          </div>
          <ExcelHint />
        </div>
      ) : (
        <div className="space-y-3">
          {allRoutines.map((r) => (
            <RoutineCard key={r.id} routine={r} clients={clients} onDelete={deleteRoutine} />
          ))}
        </div>
      )}

      {showModal && (
        <UploadModal clients={clients} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
