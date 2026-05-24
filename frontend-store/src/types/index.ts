export interface User {
  id: number
  email: string
  nombre: string
  apellido: string
  roles: string[]
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio_unitario: number
  stock: number
  disponible: boolean
  imagen_url?: string
  categoria_nombre?: string
  ingredientes?: ProductoIngrediente[]
}

export interface ProductoIngrediente {
  id: number
  nombre: string
  cantidad: number
  unidad_medida: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
}

export interface CartItem {
  producto_id: number
  nombre: string
  precio_unitario: number
  cantidad: number
  subtotal: number
}

export interface Direccion {
  id: number
  direccion: string
  ciudad: string
  codigo_postal: string
  principal: boolean
}

export interface Pedido {
  id: number
  fecha: string
  total: number
  estado: string
  usuario_id: number
  items: PedidoItem[]
  historial_estados?: EstadoHistorial[]
}

export interface PedidoItem {
  id: number
  producto_id: number
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface EstadoHistorial {
  estado: string
  fecha: string
}
