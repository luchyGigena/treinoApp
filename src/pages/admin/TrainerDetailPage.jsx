import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { storage } from '../../lib/storage'
import { ArrowLeft, Users, ClipboardList, Dumbbell, Power, UserCheck, AlertTriangle, Mail, Phone, MapPin, CreditCard, Building2, User } from 'lucide-react'

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

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-violet-500" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function ProfileSection({ trainer }) {
  const p = trainer.perfilCliente
  if (!p) return null

  const isGym = p.clientType === 'GYM'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        {isGym ? <Building2 size={15} className="text-gray-400" /> : <User size={15} className="text-gray-400" />}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {isGym ? 'Datos del gimnasio' : 'Datos personales'}
        </p>
      </div>

      {isGym ? (
        <>
          <InfoRow icon={Building2} label="Nombre comercial" value={p.nombreComercial} />
          <InfoRow icon={User}      label="Responsable"       value={[p.responsableNombre, p.responsableApellido].filter(Boolean).join(' ')} />
        </>
      ) : (
        <InfoRow icon={User} label="Nombre completo" value={[p.nombre, p.apellido].filter(Boolean).join(' ')} />
      )}

      <InfoRow icon={Mail}       label="Email de contacto" value={p.emailContacto} />
      <InfoRow icon={Phone}      label="Teléfono"          value={p.telefono} />
      <InfoRow icon={CreditCard} label="CUIT"              value={p.cuit} />
      <InfoRow icon={MapPin}     label="Dirección"         value={p.direccion} />
    </div>
  )
}

export default function TrainerDetailPage() {
  const { trainerId } = useParams()
  const { getClients, getTrainerStats, toggleTrainerActive } = useApp()
  const [showConfirm, setShowConfirm] = useState(false)

  const users = storage.getUsers()
  const trainer = users.find((u) => String(u.id) === String(trainerId))
  const clients = getClients(trainerId)
  const stats = getTrainerStats(trainerId)
  const isActive = trainer?.active !== false

  if (!trainer) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Cliente no encontrado</p>
        <Link to="/trainers" className="text-violet-600 mt-2 inline-block text-sm">Volver</Link>
      </div>
    )
  }

  function confirmToggle() {
    toggleTrainerActive(trainer.id, !isActive)
    setShowConfirm(false)
  }

  const typeLabel = trainer.clientType === 'GYM' ? 'Gimnasio' : 'Personal Trainer'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/trainers" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 ${
            isActive ? 'bg-gradient-to-br from-violet-400 to-purple-500' : 'bg-gray-300'
          }`}>
            {trainer.avatar || trainer.name[0]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900 truncate">{trainer.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
              }`}>
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 shrink-0">
                {typeLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{trainer.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl shrink-0 transition-all ${
            isActive
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <Power size={13} />
          {isActive ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Users} label="Alumnas" value={stats.clientCount} color="bg-violet-600 text-white" />
        <StatCard icon={ClipboardList} label="Rutinas" value={stats.routineCount} color="bg-pink-500 text-white" />
        <StatCard icon={Dumbbell} label="Completados" value={stats.completedWorkouts} color="bg-emerald-500 text-white" />
      </div>

      {/* Datos del perfil */}
      <ProfileSection trainer={trainer} />

      {trainer.createdAt && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
          Alta: <span className="font-medium text-gray-700">
            {new Date(trainer.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Sus alumnas ({clients.length})</h2>
        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
            <UserCheck size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Todavía no tiene alumnas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {client.avatar || client.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                  <p className="text-xs text-gray-400 truncate">{client.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
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
