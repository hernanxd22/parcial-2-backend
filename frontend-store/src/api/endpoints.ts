import api from './axios'
import type { Producto, Categoria, Pedido,Direccion  } from '../types'

// Response wrappers matching backend SQLModel list schemas
interface ListResponse<T> {
  data: T[]
}

// ============== PRODUCTOS ==============
export const getProductos = (params?: Record<string, unknown>) =>
  api.get<ListResponse<Producto>>('/productos/', { params })

export const getProducto = (id: number) =>
  api.get<Producto>(`/productos/${id}`)

// ============== CATEGORIAS ==============
export const getCategorias = (params?: Record<string, unknown>) =>
  api.get<ListResponse<Categoria>>('/categorias/', { params })

// ============== PEDIDOS ==============
export const createPedido = (data: {
  usuario_id: number
  forma_pago_codigo: string
  direccion_entrega_id: number
  items: Array<{ producto_id: number; cantidad: number }>
}) => api.post('/pedidos/', data)

export const getMisPedidos = (usuarioId?: number) =>
  api.get<ListResponse<Pedido>>('/pedidos/', { params: { usuario_id: usuarioId } })

// ============== DIRECCIONES ==============
export const getDirecciones = (usuarioId: number) =>
  api.get<ListResponse<Direccion>>(`/direcciones/usuario/${usuarioId}`)

export const createDireccion = (data: {
  usuario_id: number
  alias: string
  linea1: string
  linea2?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  latitud?: number
  longitud?: number
  es_principal: boolean
}) => api.post('/direcciones/', data)
// ============== AUTH ==============
export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data)

export const register = (data: {
  nombre: string
  apellido: string
  email: string
  password: string
}) => api.post('/usuarios/', data)

export const getMe = () => api.get('/auth/me')
