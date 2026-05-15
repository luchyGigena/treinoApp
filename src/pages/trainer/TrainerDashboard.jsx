import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { Link } from 'react-router-dom'
import { Users, ClipboardList, TrendingUp, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function TrainerDashboard() {
  const { user } = useAuth()
  const { getClients, getAllRoutines } = useApp()
  const clients = getClients(user.id)
  const routines = getAllRoutines().filter((r) =>
    clients.some((c) => c.id === r.clientId)
  )

  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Hola, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Alumnas"
          value={clients.length}
          color="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Rutinas activas"
          value={routines.length}
          color="bg-gradient-to-br from-pink-500 to-rose-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Tus alumnas</h2>
          <Link to="/clients" className="text-violet-600 text-sm font-medium hover:underline flex items-center gap-0.5">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        {clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Aún no tenés alumnas</p>
            <Link to="/clients" className="text-violet-600 text-sm font-medium mt-1 inline-block hover:underline">
              Agregar alumna
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {clients.map((client) => {
              const clientRoutines = routines.filter((r) => r.clientId === client.id)
              return (
                <Link
                  key={client.id}
                  to={`/clients/${client.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:border-violet-200 hover:shadow-sm transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {client.avatar || client.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{clientRoutines.length} rutina{clientRoutines.length !== 1 ? 's' : ''}</p>
                    <ChevronRight size={16} className="text-gray-400 ml-auto mt-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Accesos rápidos</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/clients"
            className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex flex-col gap-2 hover:bg-violet-100 transition-all active:scale-[0.98]"
          >
            <Users size={24} className="text-violet-600" />
            <span className="font-semibold text-violet-700 text-sm">Gestionar alumnas</span>
          </Link>
          <Link
            to="/routines"
            className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex flex-col gap-2 hover:bg-pink-100 transition-all active:scale-[0.98]"
          >
            <ClipboardList size={24} className="text-pink-600" />
            <span className="font-semibold text-pink-700 text-sm">Cargar rutinas</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
