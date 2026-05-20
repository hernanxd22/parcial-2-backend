import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCategorias, deleteCategoria } from '../../api/endpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

function CategoriaList() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoriaToDelete, setCategoriaToDelete] = useState(null)
  const navigate = useNavigate()

  const fetchCategorias = async () => {
    try {
      const response = await getCategorias({ limit: 100 })
      setCategorias(response.data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const filteredCategorias = categorias.filter(c => 
    c.nombre?.toLowerCase().includes(filtro.toLowerCase())
  )

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { 
      key: 'parent_id', 
      label: 'Categoría Padre',
      render: (val) => val ? `ID: ${val}` : '-'
    }
  ]

  const handleEdit = (categoria) => {
    navigate(`/categorias/${categoria.id}/editar`)
  }

  const handleDelete = (categoria) => {
    setCategoriaToDelete(categoria)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteCategoria(categoriaToDelete.id)
      setShowDeleteModal(false)
      setCategoriaToDelete(null)
      fetchCategorias()
    } catch (err) {
      alert('Error al eliminar categoría')
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>Categorías</h1>
        <Link to="/categorias/nueva" className="btn btn-primary">Nueva Categoría</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre de categoría..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={filteredCategorias}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay categorías"
        />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Categoría"
      >
        <p>¿Estás seguro de eliminar la categoría <strong>{categoriaToDelete?.nombre}</strong>?</p>
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

export default CategoriaList