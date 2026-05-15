import { createContext, useContext, useState, useEffect } from 'react'
import { api, tokens } from '../lib/api'
import { storage } from '../lib/storage'

const AuthContext = createContext(null)

// Backend roles: ADMIN, CLIENTE (trainer), ALUMNO (client)
const ROLE_MAP = { ADMIN: 'admin', CLIENTE: 'trainer', ALUMNO: 'client' }

function normalizeUser(u) {
  const roleName = u.role?.name ?? u.role
  return { ...u, role: ROLE_MAP[roleName] ?? roleName?.toLowerCase() }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storage.init()
    const access = tokens.getAccess()
    if (!access) { setLoading(false); return }

    api.get('/auth/me')
      .then((u) => {
        const normalized = normalizeUser(u)
        storage.setCurrentUser(normalized)
        setUser(normalized)
      })
      .catch(() => {
        tokens.clear()
        storage.setCurrentUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    try {
      const data = await api.post('/auth/login', { email, password })
      console.log('LOGIN RESPONSE:', data)
      const normalized = normalizeUser(data.user)
      tokens.set(data.accessToken, data.refreshToken)
      storage.setCurrentUser(normalized)
      setUser(normalized)
      return { ok: true }
    } catch (err) {
      console.log('LOGIN ERROR:', err, err.status)
      const msg =
        err.status === 403 ? 'Cuenta desactivada. Contactá al administrador.' :
        err.status === 401 ? 'Email o contraseña incorrectos' :
        'No se pudo conectar al servidor'
      return { ok: false, error: msg }
    }
  }

  async function logout() {
    const refreshToken = tokens.getRefresh()
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {})
    }
    tokens.clear()
    storage.setCurrentUser(null)
    storage.saveUsers([])
    storage.saveRoutines([])
    storage.saveWeightLogs([])
    storage.saveWorkoutLogs([])
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
