import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProductos, deleteProducto } from '../../api/endpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

function ProductoList() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDisponible, setFiltroDisponible] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState(null)
  const navigate = useNavigate()

  const fetchProductos = async () => {
    try {
      const response = await getProductos({ limit: 100 })
      setProductos(response.data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const filteredProductos = productos.filter(p => {
    const matchNombre = p.nombre?.toLowerCase().includes(filtroNombre.toLowerCase())
    const matchDisponible = filtroDisponible === '' 
      ? true 
      : filtroDisponible === 'true' 
        ? p.disponible 
        : !p.disponible
    return matchNombre && matchDisponible
  })

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { 
      key: 'precio_base', 
      label: 'Precio',
      render: (val) => `$${val}`
    },
    { 
      key: 'stock_cantidad', 
      label: 'Stock',
      render: (val, item) => (
        <span style={{ color: item.stock_cantidad === 0 ? 'red' : 'inherit' }}>
          {val}
        </span>
      )
    },
    { 
      key: 'disponible', 
      label: 'Disponible',
      render: (val) => (
        <span className={`badge ${val ? 'badge-success' : 'badge-warning'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      )
    }
  ]

  const handleEdit = (producto) => {
    navigate(`/productos/${producto.id}/editar`)
  }

  const handleDelete = (producto) => {
    setProductoToDelete(producto)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteProducto(productoToDelete.id)
      setShowDeleteModal(false)
      setProductoToDelete(null)
      fetchProductos()
    } catch (err) {
      alert('Error al eliminar producto')
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>Productos</h1>
        <Link to="/productos/nuevo" className="btn btn-primary">Nuevo Producto</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar por nombre</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre del producto..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Disponible</label>
            <select
              className="filtro-input"
              value={filtroDisponible}
              onChange={(e) => setFiltroDisponible(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredProductos}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay productos"
        />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Producto"
      >
        <p>¿Estás seguro de eliminar el producto <strong>{productoToDelete?.nombre}</strong>?</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default ProductoList