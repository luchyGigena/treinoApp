import { api } from './api'

const KEYS = {
  USERS: 'melaniapp_users',
  ROUTINES: 'melaniapp_routines',
  WORKOUT_LOGS: 'melaniapp_workout_logs',
  WEIGHT_LOGS: 'melaniapp_weight_logs',
  CURRENT_USER: 'melaniapp_current_user',
}

function get(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function set(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

function init() {
  if (!localStorage.getItem(KEYS.USERS))        set(KEYS.USERS, [])
  if (!localStorage.getItem(KEYS.ROUTINES))     set(KEYS.ROUTINES, [])
  if (!localStorage.getItem(KEYS.WORKOUT_LOGS)) set(KEYS.WORKOUT_LOGS, [])
  if (!localStorage.getItem(KEYS.WEIGHT_LOGS))  set(KEYS.WEIGHT_LOGS, [])
}

export const storage = {
  init,

  // ── Bulk setters (populate cache from API) ──────────────────────────
  saveUsers:       (v) => set(KEYS.USERS, v),
  saveRoutines:    (v) => set(KEYS.ROUTINES, v),
  saveWeightLogs:  (v) => set(KEYS.WEIGHT_LOGS, v),
  saveWorkoutLogs: (v) => set(KEYS.WORKOUT_LOGS, v),

  // ── Reads ────────────────────────────────────────────────────────────
  getUsers:       () => get(KEYS.USERS),
  getRoutines:    () => get(KEYS.ROUTINES),
  getWeightLogs:  () => get(KEYS.WEIGHT_LOGS),
  getWorkoutLogs: () => get(KEYS.WORKOUT_LOGS),

  // ── Mutations: optimistic localStorage + background API sync ─────────

  addUser: (user) => {
    const users = get(KEYS.USERS)
    users.push(user)
    set(KEYS.USERS, users)

    const { id: _tmp, role: _role, avatar: _av, active: _ac, createdAt: _c, trainerId: _ti, ...payload } = user

    const request = user.role === 'trainer'
      ? api.post('/users/clientes', { clientType: 'PERSONAL_TRAINER', ...payload })
      : (() => { const { password: _pw, ...ap } = payload; return api.post('/users/alumnos', ap) })()

    return request
      .then((created) => {
        const role = user.role
        const updated = get(KEYS.USERS).map((u) => String(u.id) === String(user.id) ? { ...u, ...created, role } : u)
        set(KEYS.USERS, updated)
      })
      .catch((err) => {
        set(KEYS.USERS, get(KEYS.USERS).filter((u) => String(u.id) !== String(user.id)))
        throw err
      })
  },

  updateUser: (id, patch) => {
    set(KEYS.USERS, get(KEYS.USERS).map((u) => String(u.id) === String(id) ? { ...u, ...patch } : u))
    api.patch(`/users/clientes/${id}/toggle-active`).catch(console.error)
  },

  addRoutine: (routine) => {
    const routines = get(KEYS.ROUTINES)
    routines.push(routine)
    set(KEYS.ROUTINES, routines)

    const { id: _tmp, createdAt: _c, clientId, ...rest } = routine
    api.post('/routines', { ...rest, alumnoId: clientId })
      .then((created) => {
        const normalized = { ...created, clientId: created.alumnoId ?? clientId }
        const updated = get(KEYS.ROUTINES).map((r) => String(r.id) === String(routine.id) ? normalized : r)
        set(KEYS.ROUTINES, updated)
      })
      .catch((err) => {
        console.error('addRoutine API error:', err)
        set(KEYS.ROUTINES, get(KEYS.ROUTINES).filter((r) => String(r.id) !== String(routine.id)))
      })
  },

  deleteRoutine: (id) => {
    set(KEYS.ROUTINES, get(KEYS.ROUTINES).filter((r) => String(r.id) !== String(id)))
    api.delete(`/routines/${id}`).catch(console.error)
  },

  addWeightLog: (log) => {
    const logs = get(KEYS.WEIGHT_LOGS)
    logs.push(log)
    set(KEYS.WEIGHT_LOGS, logs)

    const { id: _tmp, clientId, ...rest } = log
    api.post('/weight-logs', { ...rest, alumnoId: clientId })
      .then((created) => {
        const normalized = { ...created, clientId: created.alumnoId ?? clientId }
        const updated = get(KEYS.WEIGHT_LOGS).map((l) => String(l.id) === String(log.id) ? normalized : l)
        set(KEYS.WEIGHT_LOGS, updated)
      })
      .catch((err) => {
        console.error('addWeightLog API error:', err)
        set(KEYS.WEIGHT_LOGS, get(KEYS.WEIGHT_LOGS).filter((l) => String(l.id) !== String(log.id)))
      })
  },

  deleteWeightLog: (id) => {
    set(KEYS.WEIGHT_LOGS, get(KEYS.WEIGHT_LOGS).filter((l) => String(l.id) !== String(id)))
    api.delete(`/weight-logs/${id}`).catch(console.error)
  },

  saveWorkoutLog: (log) => {
    const logs = get(KEYS.WORKOUT_LOGS)
    const idx = logs.findIndex(
      (l) => String(l.clientId) === String(log.clientId) && l.date === log.date && String(l.routineId) === String(log.routineId)
    )
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    set(KEYS.WORKOUT_LOGS, logs)

    const { id: _tmp, clientId, ...rest } = log
    api.put('/workout-logs', { ...rest, alumnoId: clientId })
      .then((created) => {
        if (!created) return
        const current = get(KEYS.WORKOUT_LOGS)
        const i = current.findIndex(
          (l) => String(l.clientId) === String(log.clientId) && l.date === log.date && String(l.routineId) === String(log.routineId)
        )
        if (i >= 0) {
          current[i] = { ...created, clientId: created.alumnoId ?? clientId }
          set(KEYS.WORKOUT_LOGS, current)
        }
      })
      .catch(console.error)
  },

  // ── Session ──────────────────────────────────────────────────────────
  getCurrentUser: () => {
    try { return JSON.parse(localStorage.getItem(KEYS.CURRENT_USER)) } catch { return null }
  },
  setCurrentUser: (user) => {
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user))
    else localStorage.removeItem(KEYS.CURRENT_USER)
  },
}
