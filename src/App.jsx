import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import TrainersPage from './pages/admin/TrainersPage'
import TrainerDetailPage from './pages/admin/TrainerDetailPage'
import TrainerDashboard from './pages/trainer/TrainerDashboard'
import ClientsPage from './pages/trainer/ClientsPage'
import ClientDetailPage from './pages/trainer/ClientDetailPage'
import RoutinesPage from './pages/trainer/RoutinesPage'
import ClientDashboard from './pages/client/ClientDashboard'
import WorkoutPage from './pages/client/WorkoutPage'
import WeightPage from './pages/client/WeightPage'
import ProgressPage from './pages/client/ProgressPage'

function Spinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
      <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
      <p className="text-sm text-gray-400 font-medium">Cargando...</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { dataLoading } = useApp()

  if (authLoading || dataLoading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const role = user?.role

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route
                  path="/dashboard"
                  element={
                    role === 'admin'   ? <AdminDashboard /> :
                    role === 'trainer' ? <TrainerDashboard /> :
                    <ClientDashboard />
                  }
                />
                {role === 'admin' && (
                  <>
                    <Route path="/trainers"          element={<TrainersPage />} />
                    <Route path="/trainers/:trainerId" element={<TrainerDetailPage />} />
                  </>
                )}
                {role === 'trainer' && (
                  <>
                    <Route path="/clients"            element={<ClientsPage />} />
                    <Route path="/clients/:clientId"  element={<ClientDetailPage />} />
                    <Route path="/routines"           element={<RoutinesPage />} />
                  </>
                )}
                {role === 'client' && (
                  <>
                    <Route path="/workout"  element={<WorkoutPage />} />
                    <Route path="/weight"   element={<WeightPage />} />
                    <Route path="/progress" element={<ProgressPage />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
