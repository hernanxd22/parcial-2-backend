import { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('access_token')
      const refreshTokenValue = Cookies.get('refresh_token')

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          const exp = payload.exp * 1000 // JWT exp está en segundos

          if (exp > Date.now()) {
            // Token válido
            setUser({
              id: payload.sub,
              email: payload.email,
              rol: payload.rol,
            })
          } else if (refreshTokenValue) {
            // Token expirado → intentar refresh automático
            try {
              const response = await api.post('/auth/refresh', {
                refresh_token: refreshTokenValue,
              })
              const { access_token, refresh_token: newRefreshToken } = response.data

              Cookies.set('access_token', access_token, { expires: 1 / 48 })
              Cookies.set('refresh_token', newRefreshToken, { expires: 7 })

              const newPayload = JSON.parse(atob(access_token.split('.')[1]))
              setUser({
                id: newPayload.sub,
                email: newPayload.email,
                rol: newPayload.rol,
              })
            } catch {
              // Refresh falló → limpiar sesión
              Cookies.remove('access_token')
              Cookies.remove('refresh_token')
            }
          } else {
            // Token expirado sin refresh → limpiar
            Cookies.remove('access_token')
          }
        } catch (e) {
          console.error('Error decodificando token:', e)
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token } = response.data
    
    // Guardar tokens en cookies
    Cookies.set('access_token', access_token, { expires: 1/24/15 }) // 15 min
    Cookies.set('refresh_token', refresh_token, { expires: 7 }) // 7 días
    
    // Decodificar token
    const payload = JSON.parse(atob(access_token.split('.')[1]))
    setUser({
      id: payload.sub,
      email: payload.email,
      rol: payload.rol
    })
    
    return response.data
  }

  const register = async (nombre, apellido, email, password) => {
    console.log('Registrando usuario:', { nombre, apellido, email })
    const response = await api.post('/usuarios', {
      nombre,
      apellido,
      email,
      password
    })
    console.log('Usuario creado:', response.data)
    // Después de registrar, hacer login
    return login(email, password)
  }

  const logout = async () => {
    try {
      const refresh_token = Cookies.get('refresh_token')
      if (refresh_token) {
        await api.post('/auth/logout', { refresh_token })
      }
    } catch (e) {
      console.error('Error en logout:', e)
    } finally {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      setUser(null)
    }
  }

  const refreshToken = async () => {
    const refresh_token = Cookies.get('refresh_token')
    if (!refresh_token) {
      throw new Error('No refresh token')
    }
    
    const response = await api.post('/auth/refresh', { refresh_token })
    const { access_token, refresh_token: new_refresh_token } = response.data
    
    Cookies.set('access_token', access_token, { expires: 1 / 48 })
    Cookies.set('refresh_token', new_refresh_token, { expires: 7 })
    
    return response.data
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