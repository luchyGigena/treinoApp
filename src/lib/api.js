const BASE_URL = ''
const ACCESS_KEY = 'melaniapp_access_token'
const REFRESH_KEY = 'melaniapp_refresh_token'

export const tokens = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// Singleton promise while refresh is in flight — prevents multiple parallel refreshes
let _refreshPromise = null

async function refreshAccessToken() {
  if (_refreshPromise) return _refreshPromise

  _refreshPromise = (async () => {
    const refreshToken = tokens.getRefresh()
    if (!refreshToken) throw new Error('No refresh token')

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) throw new Error('Refresh failed')

    const data = await res.json()
    tokens.set(data.accessToken)
    return data.accessToken
  })()

  _refreshPromise.finally(() => { _refreshPromise = null })
  return _refreshPromise
}

export async function apiCall(method, path, body, _retry = true) {
  const headers = { 'Content-Type': 'application/json' }
  const access = tokens.getAccess()
  if (access) headers['Authorization'] = `Bearer ${access}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && _retry) {
    try {
      await refreshAccessToken()
      return apiCall(method, path, body, false)
    } catch {
      tokens.clear()
      window.location.href = '/login'
      throw new Error('Sesión expirada')
    }
  }

  if (!res.ok) {
    let msg = res.statusText
    try {
      const json = await res.json()
      msg = Array.isArray(json.message) ? json.message.join(', ') : (json.message || msg)
    } catch { /* noop */ }
    const err = new Error(msg)
    err.status = res.status
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)       => apiCall('GET',    path),
  post:   (path, body) => apiCall('POST',   path, body),
  put:    (path, body) => apiCall('PUT',    path, body),
  patch:  (path, body) => apiCall('PATCH',  path, body),
  delete: (path)       => apiCall('DELETE', path),
}
