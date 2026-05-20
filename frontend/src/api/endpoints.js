import api from './axios'

// ============== AUTH ==============
export const login = (data) => api.post('/auth/login', data)
export const refreshToken = (data) => api.post('/auth/refresh', data)
export const logout = (data) => api.post('/auth/logout', data)

// ============== USUARIOS ==============
export const getUsuarios = (params) => api.get('/usuarios/', { params })
export const getUsuarioById = (id) => api.get(`/usuarios/${id}`)
export const createUsuario = (data) => api.post('/usuarios/', data)
export const updateUsuario = (id, data) => api.put(`/usuarios/${id}`, data)
export const deleteUsuario = (id) => api.delete(`/usuarios/${id}`)

// ============== PRODUCTOS ==============
export const getProductos = (params) => api.get('/productos/', { params })
export const getProductoById = (id) => api.get(`/productos/${id}`)
export const createProducto = (data) => api.post('/productos/', data)
export const updateProducto = (id, data) => api.patch(`/productos/${id}`, data)
export const deleteProducto = (id) => api.delete(`/productos/${id}`)

// ============== CATEGORIAS ==============
export const getCategorias = (params) => api.get('/categorias/', { params })
export const getCategoriaById = (id) => api.get(`/categorias/${id}`)
export const createCategoria = (data) => api.post('/categorias/', data)
export const updateCategoria = (id, data) => api.patch(`/categorias/${id}`, data)
export const deleteCategoria = (id) => api.delete(`/categorias/${id}`)

// ============== INGREDIENTES ==============
export const getIngredientes = (params) => api.get('/ingredientes/', { params })
export const getIngredienteById = (id) => api.get(`/ingredientes/${id}`)
export const createIngrediente = (data) => api.post('/ingredientes/', data)
export const updateIngrediente = (id, data) => api.patch(`/ingredientes/${id}`, data)
export const deleteIngrediente = (id) => api.delete(`/ingredientes/${id}`)

// ============== PEDIDOS ==============
export const getPedidos = (params) => api.get('/pedidos/', { params })
export const getPedidoById = (id) => api.get(`/pedidos/${id}`)
export const createPedido = (data) => api.post('/pedidos/', data)
export const avanzarEstadoPedido = (id, data) =>
  api.patch(`/pedidos/${id}/estado`, data)
export const deletePedido = (id) => api.delete(`/pedidos/${id}`)

// ============== DIRECCIONES ==============
export const getDirecciones = (params) => api.get('/direcciones/', { params })
export const getDireccionById = (id) => api.get(`/direcciones/${id}`)
export const createDireccion = (data) => api.post('/direcciones/', data)
export const updateDireccion = (id, data) => api.patch(`/direcciones/${id}`, data)
export const deleteDireccion = (id) => api.delete(`/direcciones/${id}`)