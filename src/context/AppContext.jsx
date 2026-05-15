import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { storage } from '../lib/storage'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

const ROLE_MAP = { ADMIN: 'admin', CLIENTE: 'trainer', ALUMNO: 'client' }

function normalizeUser(u) {
  const roleName = u.role?.name ?? u.role
  return { ...u, role: ROLE_MAP[roleName] ?? roleName?.toLowerCase() }
}

// Map API field alumnoId → clientId for frontend compatibility
function normalizeRoutine(r) {
  return { ...r, clientId: r.alumnoId ?? r.clientId }
}

function normalizeLog(l) {
  return { ...l, clientId: l.alumnoId ?? l.clientId }
}

// Loose ID comparison — backend uses number IDs, URL params are strings
function sameId(a, b) {
  return String(a) === String(b)
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const [dataLoading, setDataLoading] = useState(false)
  const [trainerStats, setTrainerStats] = useState({})

  const invalidate = useCallback(() => setRefresh((r) => r + 1), [])

  useEffect(() => {
    if (!user) return
    loadFromApi()
  }, [user?.id])

  async function loadFromApi() {
    setDataLoading(true)
    try {
      if (user.role === 'admin') {
        await loadAdminData()
      } else if (user.role === 'trainer') {
        await loadTrainerData()
      } else if (user.role === 'client') {
        await loadClientData()
      }
      invalidate()
    } catch (err) {
      console.error('Error loading data from API:', err)
    } finally {
      setDataLoading(false)
    }
  }

  async function loadAdminData() {
    const trainers = await api.get('/users/clientes')
    const [detailResults, alumnoArrays] = await Promise.all([
      Promise.all(trainers.map((t) => api.get(`/users/clientes/${t.id}`))),
      Promise.all(trainers.map((t) => api.get(`/users/clientes/${t.id}/alumnos`))),
    ])
    const stats = {}
    detailResults.forEach((detail) => {
      stats[detail.id] = {
        clientCount:       detail._count?.alumnos    ?? detail.clientCount       ?? 0,
        routineCount:      detail._count?.routines   ?? detail.routineCount      ?? 0,
        completedWorkouts: detail.completedWorkouts  ?? detail.stats?.completedWorkouts ?? 0,
      }
    })
    setTrainerStats(stats)
    const allAlumnos = alumnoArrays.flatMap((arr, i) =>
      arr.map((a) => ({ trainerId: trainers[i].id, ...a }))
    )
    // Use detailResults (has perfilCliente) instead of the list response
    storage.saveUsers([
      ...detailResults.map((t) => normalizeUser({ role: { name: 'CLIENTE' }, ...t })),
      ...allAlumnos.map((a) => normalizeUser({ role: { name: 'ALUMNO' }, ...a })),
    ])
  }

  async function loadTrainerData() {
    const [alumnos, routines] = await Promise.all([
      api.get('/users/alumnos'),
      api.get('/routines'),
    ])
    storage.saveUsers(
      alumnos.map((a) => normalizeUser({ role: { name: 'ALUMNO' }, trainerId: user.id, ...a }))
    )
    storage.saveRoutines(routines.map(normalizeRoutine))

    if (alumnos.length > 0) {
      const [weightArrays, workoutArrays] = await Promise.all([
        Promise.all(alumnos.map((a) => api.get(`/weight-logs/${a.id}`))),
        Promise.all(alumnos.map((a) => api.get(`/workout-logs/${a.id}`))),
      ])
      storage.saveWeightLogs(weightArrays.flat().map(normalizeLog))
      storage.saveWorkoutLogs(workoutArrays.flat().map(normalizeLog))
    }
  }

  async function loadClientData() {
    const [routines, weightLogs, workoutLogs] = await Promise.all([
      api.get(`/routines/alumno/${user.id}`),
      api.get(`/weight-logs/${user.id}`),
      api.get(`/workout-logs/${user.id}`),
    ])
    storage.saveRoutines(routines.map(normalizeRoutine))
    storage.saveWeightLogs(weightLogs.map(normalizeLog))
    storage.saveWorkoutLogs(workoutLogs.map(normalizeLog))
  }

  // ── Admin ──────────────────────────────────────────────────────────────
  function getTrainers() {
    return storage.getUsers().filter((u) => u.role === 'trainer')
  }

  async function addTrainer(trainer) {
    try {
      await storage.addUser(trainer)
      invalidate()
      return { ok: true }
    } catch (err) {
      invalidate()
      return { ok: false, error: err.message || 'Error al crear cliente' }
    }
  }

  function toggleTrainerActive(trainerId, active) {
    storage.updateUser(trainerId, { active })
    invalidate()
  }

  function getTrainerStats(trainerId) {
    if (user?.role === 'admin') {
      return trainerStats[trainerId] || { clientCount: 0, routineCount: 0, completedWorkouts: 0 }
    }
    const clients = storage.getUsers().filter((u) => u.role === 'client' && sameId(u.trainerId, trainerId))
    const clientIds = clients.map((c) => c.id)
    const routines = storage.getRoutines().filter((r) => clientIds.some((id) => sameId(r.clientId, id)))
    const workoutLogs = storage.getWorkoutLogs().filter((l) => clientIds.some((id) => sameId(l.clientId, id)))
    const completedWorkouts = workoutLogs.filter((l) => l.exercises?.every((e) => e.completed)).length
    return { clientCount: clients.length, routineCount: routines.length, completedWorkouts }
  }

  // ── Trainer ────────────────────────────────────────────────────────────
  function getClients(trainerId) {
    return storage.getUsers().filter((u) => u.role === 'client' && sameId(u.trainerId, trainerId))
  }

  function addClient(client) {
    storage.addUser(client)
    invalidate()
  }

  function getRoutinesForClient(clientId) {
    return storage.getRoutines().filter((r) => sameId(r.clientId, clientId))
  }

  function getAllRoutines() {
    return storage.getRoutines()
  }

  function addRoutine(routine) {
    storage.addRoutine(routine)
    invalidate()
  }

  function deleteRoutine(id) {
    storage.deleteRoutine(id)
    invalidate()
  }

  // ── Client ─────────────────────────────────────────────────────────────
  function getWeightLogs(clientId) {
    return storage.getWeightLogs()
      .filter((l) => sameId(l.clientId, clientId))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  function addWeightLog(log) {
    storage.addWeightLog(log)
    invalidate()
  }

  function deleteWeightLog(id) {
    storage.deleteWeightLog(id)
    invalidate()
  }

  function getWorkoutLog(clientId, date, routineId) {
    return storage.getWorkoutLogs()
      .find((l) => sameId(l.clientId, clientId) && l.date === date && sameId(l.routineId, routineId))
  }

  function saveWorkoutLog(log) {
    storage.saveWorkoutLog(log)
  }

  function getWorkoutHistory(clientId) {
    return storage.getWorkoutLogs()
      .filter((l) => sameId(l.clientId, clientId))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  return (
    <AppContext.Provider
      value={{
        refresh,
        dataLoading,
        // admin
        getTrainers,
        addTrainer,
        toggleTrainerActive,
        getTrainerStats,
        // trainer
        getClients,
        addClient,
        getRoutinesForClient,
        getAllRoutines,
        addRoutine,
        deleteRoutine,
        // client
        getWeightLogs,
        addWeightLog,
        deleteWeightLog,
        getWorkoutLog,
        saveWorkoutLog,
        getWorkoutHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
