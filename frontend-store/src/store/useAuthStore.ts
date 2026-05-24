import { create } from 'zustand'
import Cookies from 'js-cookie'
import api from '../api/axios'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (nombre: string, apellido: string, email: string, password: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,

  login: async (email: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    const response = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token } = response.data

    Cookies.set('access_token', access_token, { expires: 1 / 24 / 15 })
    Cookies.set('refresh_token', refresh_token, { expires: 7 })

    set({
      token: access_token,
      isAuthenticated: true,
    })

    // Fetch user data
    await get().checkAuth()
  },

  logout: async () => {
    try {
      const refresh_token = Cookies.get('refresh_token')
      if (refresh_token) {
        await api.post('/auth/logout', { refresh_token })
      }
    } catch {
      // Ignore errors on logout
    } finally {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      set({ user: null, token: null, isAuthenticated: false })
    }
  },

  register: async (nombre: string, apellido: string, email: string, password: string) => {
    await api.post('/usuarios/', { nombre, apellido, email, password })

    // Auto login after registration
    await get().login(email, password)
  },

  checkAuth: async () => {
    try {
      const token = Cookies.get('access_token')
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, loading: false })
        return
      }

      const response = await api.get('/auth/me')
      const userData = response.data

      set({
        user: {
          id: userData.id,
          email: userData.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          roles: userData.roles,
        },
        token,
        isAuthenticated: true,
        loading: false,
      })
    } catch {
      // Token invalid or expired
      const refreshTokenValue = Cookies.get('refresh_token')
      if (refreshTokenValue) {
        try {
          const refreshResponse = await api.post('/auth/refresh', {
            refresh_token: refreshTokenValue,
          })
          const { access_token, refresh_token: newRefreshToken } = refreshResponse.data

          Cookies.set('access_token', access_token, { expires: 1 / 24 / 15 })
          Cookies.set('refresh_token', newRefreshToken, { expires: 7 })

          // Retry getting user data
          const response = await api.get('/auth/me')
          const userData = response.data

          set({
            user: {
              id: userData.id,
              email: userData.email,
              nombre: userData.nombre,
              apellido: userData.apellido,
              roles: userData.roles,
            },
            token: access_token,
            isAuthenticated: true,
            loading: false,
          })
          return
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
        }
      }

      set({ user: null, token: null, isAuthenticated: false, loading: false })
    }
  },
}))
