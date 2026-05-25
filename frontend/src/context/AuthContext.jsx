import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

function normalizeUser(data) {
  // /auth/me devuelve roles como array ["ADMIN"]
  // Compatibilidad hacia atrás con código que espera user.rol (string)
  return {
    ...data,
    rol: data.roles?.[0] || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(normalizeUser(response.data))
      } catch {
        try {
          await api.post('/auth/refresh')
          const response = await api.get('/auth/me')
          setUser(normalizeUser(response.data))
        } catch {
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    await api.post('/auth/login', { email, password })
    const response = await api.get('/auth/me')
    const userData = normalizeUser(response.data)
    setUser(userData)
    return userData
  }

  const register = async (nombre, apellido, email, password) => {
    await api.post('/usuarios', { nombre, apellido, email, password })
    return login(email, password)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignorar errores de logout
    } finally {
      setUser(null)
    }
  }

  const refreshToken = async () => {
    await api.post('/auth/refresh')
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      refreshToken,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}