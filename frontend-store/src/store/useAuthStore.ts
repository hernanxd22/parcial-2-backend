import { create } from 'zustand'
import api from '../api/axios'
import type { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (nombre: string, apellido: string, email: string, password: string) => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email: string, password: string) => {
    await api.post('/auth/login', { email, password })
    // La cookie httponly fue seteada por el backend
    const meResponse = await api.get('/auth/me')
    const userData = meResponse.data

    set({
      user: {
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        apellido: userData.apellido,
        roles: userData.roles,
      },
      isAuthenticated: true,
      loading: false,
    })
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Ignore errors on logout
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },

  register: async (nombre: string, apellido: string, email: string, password: string) => {
    await api.post('/usuarios/', { nombre, apellido, email, password })
    await get().login(email, password)
  },

  checkAuth: async () => {
    try {
      // La cookie httponly se envía sola con withCredentials
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
        isAuthenticated: true,
        loading: false,
      })
    } catch {
      // Token expirado → intentar refresh
      try {
        await api.post('/auth/refresh')
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
          isAuthenticated: true,
          loading: false,
        })
      } catch {
        set({ user: null, isAuthenticated: false, loading: false })
      }
    }
  },
}))