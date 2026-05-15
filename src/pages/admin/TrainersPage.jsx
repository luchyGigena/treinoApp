import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { storage } from '../../lib/storage'
import { nanoid } from '../../lib/nanoid'
import { Users, Plus, ChevronRight, X, UserPlus, Power, Building2, User, AlertTriangle } from 'lucide-react'

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmClass?.includes('red') ? 'bg-red-100' : 'bg-emerald-100'}`}>
            <AlertTriangle size={22} className={confirmClass?.includes('red') ? 'text-red-500' : 'text-emerald-600'} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const CLIENT_TYPES = [
  { value: 'PERSONAL_TRAINER', label: 'Personal Trainer', icon: User },
  { value: 'GYM', label: 'Gimnasio', icon: Building2 },
]

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
    />
  )
}

function AddClientModal({ onClose }) {
  const { addTrainer } = useApp()
  const [clientType, setClientType] = useState('PERSONAL_TRAINER')
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    nombre: '', apellido: '', emailContacto: '', cuit: '', telefono: '', direccion: '',
    nombreComercial: '', responsableNombre: '', responsableApellido: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const users = storage.getUsers()
    if (users.find((u) => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError('Ese email ya está registrado')
      return
    }

    const profileFields = clientType === 'PERSONAL_TRAINER'
      ? { nombre: form.nombre, apellido: form.apellido, emailContacto: form.emailContacto, cuit: form.cuit, telefono: form.telefono, direccion: form.direccion }
      : { nombreComercial: form.nombreComercial, responsableNombre: form.responsableNombre, responsableApellido: form.responsableApellido, cuit: form.cuit, telefono: form.telefono, direccion: form.direccion }

    setSaving(true)
    const result = await addTrainer({
      id: nanoid(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: 'trainer',
      clientType,
      avatar: form.name.trim()[0].toUpperCase(),
      active: true,
      createdAt: new Date().toISOString(),
      ...profileFields,
    })
    setSaving(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">Nuevo cliente</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de cliente */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Tipo de cliente</p>
            <div className="grid grid-cols-2 gap-2">
              {CLIENT_TYPES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setClientType(value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    clientType === value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos de acceso</p>
            <Field label="Nombre para mostrar *">
              <Input value={form.name} onChange={set('name')} placeholder="Ej: Melani González" required />
            </Field>
            <Field label="Email *">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="cliente@email.com" required />
            </Field>
            <Field label="Contraseña inicial *">
              <Input value={form.password} onChange={set('password')} placeholder="Contraseña para darle" required />
            </Field>
          </div>

          {clientType === 'PERSONAL_TRAINER' ? (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil personal trainer</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <Input value={form.nombre} onChange={set('nombre')} placeholder="Melani" />
                </Field>
                <Field label="Apellido">
                  <Input value={form.apellido} onChange={set('apellido')} placeholder="González" />
                </Field>
              </div>
              <Field label="Email de contacto">
                <Input type="email" value={form.emailContacto} onChange={set('emailContacto')} placeholder="contacto@email.com" />
              </Field>
              <Field label="CUIT">
                <Input value={form.cuit} onChange={set('cuit')} placeholder="27-12345678-3" />
              </Field>
              <Field label="Teléfono">
                <Input value={form.telefono} onChange={set('telefono')} placeholder="+54 9 11 1234-5678" />
              </Field>
              <Field label="Dirección">
                <Input value={form.direccion} onChange={set('direccion')} placeholder="Av. Corrientes 1234, CABA" />
              </Field>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil gimnasio</p>
              <Field label="Nombre comercial">
                <Input value={form.nombreComercial} onChange={set('nombreComercial')} placeholder="GymCenter S.A." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre responsable">
                  <Input value={form.responsableNombre} onChange={set('responsableNombre')} placeholder="Juan" />
                </Field>
                <Field label="Apellido responsable">
                  <Input value={form.responsableApellido} onChange={set('responsableApellido')} placeholder="Pérez" />
                </Field>
              </div>
              <Field label="CUIT">
                <Input value={form.cuit} onChange={set('cuit')} placeholder="30-12345678-1" />
              </Field>
              <Field label="Teléfono">
                <Input value={form.telefono} onChange={set('telefono')} placeholder="011-4444-5555" />
              </Field>
              <Field label="Dirección">
                <Input value={form.direccion} onChange={set('direccion')} placeholder="Av. Santa Fe 2000, CABA" />
              </Field>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold shadow-md shadow-violet-200 disabled:opacity-60">
              {saving ? 'Creando...' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ClientCard({ trainer }) {
  const { getTrainerStats, toggleTrainerActive } = useApp()
  const stats = getTrainerStats(trainer.id)
  const isActive = trainer.active !== false
  const typeLabel = trainer.clientType === 'GYM' ? 'Gimnasio' : 'Personal Trainer'
  const [showConfirm, setShowConfirm] = useState(false)

  function handleToggle(e) {
    e.preventDefault()
    setShowConfirm(true)
  }

  function confirmToggle() {
    toggleTrainerActive(trainer.id, !isActive)
    setShowConfirm(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <Link to={`/trainers/${trainer.id}`} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-all">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
          isActive ? 'bg-gradient-to-br from-violet-400 to-purple-500' : 'bg-gray-300'
        }`}>
          {trainer.avatar || trainer.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{trainer.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
              {typeLabel}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{trainer.email}</p>
        </div>
        <ChevronRight size={18} className="text-gray-400 shrink-0" />
      </Link>

      <div className="border-t border-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-500">
          <span><strong className="text-gray-700">{stats.clientCount}</strong> alumnas</span>
          <span><strong className="text-gray-700">{stats.routineCount}</strong> rutinas</span>
          <span><strong className="text-gray-700">{stats.completedWorkouts}</strong> entrenos</span>
        </div>
        <button
          onClick={handleToggle}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all ${
            isActive
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Power size={13} />
          {isActive ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          title={isActive ? `Desactivar a ${trainer.name}` : `Activar a ${trainer.name}`}
          message={isActive
            ? 'El cliente no podrá iniciar sesión hasta que lo reactives.'
            : 'El cliente podrá volver a iniciar sesión.'}
          confirmLabel={isActive ? 'Desactivar' : 'Activar'}
          confirmClass={isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}
          onConfirm={confirmToggle}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

export default function TrainersPage() {
  const { getTrainers, refresh } = useApp()
  const [showModal, setShowModal] = useState(false)
  const trainers = getTrainers()
  const activeCount = trainers.filter((t) => t.active !== false).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{activeCount} activos · {trainers.length} total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-violet-200 active:scale-[0.97] transition-all"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      {trainers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <UserPlus size={28} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">Sin clientes todavía</p>
          <p className="text-gray-500 text-sm mt-1">Creá el primero para empezar</p>
          <button onClick={() => setShowModal(true)} className="mt-4 bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            Agregar cliente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trainers.map((t) => (
            <ClientCard key={t.id} trainer={t} />
          ))}
        </div>
      )}

      {showModal && <AddClientModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
