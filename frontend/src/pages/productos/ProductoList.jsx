import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProductos, deleteProducto, getIngredientes, getUnidadesMedida } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

function ProductoList() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'ADMIN' || user?.roles?.includes('ADMIN')

  const [productos, setProductos] = useState([])
  const [ingredienteMap, setIngredienteMap] = useState({})
  const [unidadMap, setUnidadMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtroNombre, setFiltroNombre] = useState('')
  const [filtroDisponible, setFiltroDisponible] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productoToDelete, setProductoToDelete] = useState(null)
  const [expandedProducto, setExpandedProducto] = useState(null)
  const navigate = useNavigate()

  const fetchProductos = async () => {
    try {
      const [prodRes, ingRes, uniRes] = await Promise.all([
        getProductos({ limit: 100 }),
        getIngredientes({ limit: 100 }),
        getUnidadesMedida({ limit: 100 }),
      ])
      setProductos(prodRes.data.data || [])

      const ingMap = {}
      ;(ingRes.data.data || []).forEach(i => { ingMap[i.id] = i })
      setIngredienteMap(ingMap)

      const uniMap = {}
      ;(uniRes.data.data || []).forEach(u => { uniMap[u.id] = u })
      setUnidadMap(uniMap)
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

  const renderIngredientes = (producto) => {
    if (!producto.producto_ingredientes || producto.producto_ingredientes.length === 0) {
      return <span style={{ color: '#999' }}>Sin ingredientes</span>
    }

    const preview = producto.producto_ingredientes.slice(0, 2).map(ing => {
      const nombre = ingredienteMap[ing.ingrediente_id]?.nombre || `ID: ${ing.ingrediente_id}`
      const uni = unidadMap[ing.unidad_medida_id]
      const uniStr = uni ? `${uni.simbolo}` : ''
      return `${nombre} (${ing.cantidad} ${uniStr})`
    }).join(', ')

    const restantes = producto.producto_ingredientes.length - 2
    const sufijo = restantes > 0 ? ` y ${restantes} más` : ''

    return (
      <span
        style={{ fontSize: '0.9em', cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation()
          setExpandedProducto(expandedProducto === producto.id ? null : producto.id)
        }}
        title="Click para ver todos"
      >
        {preview}{sufijo}
      </span>
    )
  }

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
    },
    {
      key: 'ingredientes',
      label: 'Ingredientes',
      render: (_, item) => renderIngredientes(item),
    },
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
        {isAdmin && (
          <Link to="/productos/nuevo" className="btn btn-primary">Nuevo Producto</Link>
        )}
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
          onDelete={isAdmin ? handleDelete : undefined}
          loading={loading}
          emptyMessage="No hay productos"
        />
      </div>

      {/* Panel expandible de ingredientes */}
      {expandedProducto && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9ff', border: '1px solid #cce' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>
              Ingredientes de: <strong>{productos.find(p => p.id === expandedProducto)?.nombre}</strong>
            </h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setExpandedProducto(null)}
              style={{ padding: '2px 10px' }}
            >
              Cerrar ✕
            </button>
          </div>
          {(() => {
            const prod = productos.find(p => p.id === expandedProducto)
            if (!prod || !prod.producto_ingredientes || prod.producto_ingredientes.length === 0) {
              return <p style={{ color: '#999' }}>Este producto no tiene ingredientes cargados.</p>
            }
            return (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Ingrediente</th>
                    <th style={{ padding: '8px' }}>Cantidad</th>
                    <th style={{ padding: '8px' }}>Unidad</th>
                    <th style={{ padding: '8px' }}>Removible</th>
                  </tr>
                </thead>
                <tbody>
                  {prod.producto_ingredientes.map((ing, idx) => {
                    const nombre = ingredienteMap[ing.ingrediente_id]?.nombre || `ID: ${ing.ingrediente_id}`
                    const uni = unidadMap[ing.unidad_medida_id]
                    const uniStr = uni ? `${uni.simbolo} (${uni.nombre})` : `ID: ${ing.unidad_medida_id}`
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{nombre}</td>
                        <td style={{ padding: '8px' }}>{ing.cantidad}</td>
                        <td style={{ padding: '8px' }}>{uniStr}</td>
                        <td style={{ padding: '8px' }}>{ing.es_removible ? 'Sí' : 'No'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          })()}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Desactivar Producto"
      >
        <p>¿Estás seguro de desactivar el producto <strong>{productoToDelete?.nombre}</strong>?</p>
        <p style={{ fontSize: '0.9em', color: '#666' }}>El producto quedará como no disponible, pero no se eliminará físicamente.</p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button className="btn btn-danger" onClick={confirmDelete}>
            Desactivar
          </button>
        </div>
      </Modal>
    </div>
  )
}

export default ProductoList