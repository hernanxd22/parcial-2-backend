import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getIngredientes, deleteIngrediente } from '../../api/endpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

function IngredienteList() {
  const [ingredientes, setIngredientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroAlergeno, setFiltroAlergeno] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ingredienteToDelete, setIngredienteToDelete] = useState(null)
  const navigate = useNavigate()

  const fetchIngredientes = async () => {
    try {
      const response = await getIngredientes({ limit: 100 })
      setIngredientes(response.data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredientes()
  }, [])

  const filteredIngredientes = ingredientes.filter(i => {
    const matchNombre = i.nombre?.toLowerCase().includes(filtro.toLowerCase())
    const matchAlergeno = filtroAlergeno === '' 
      ? true 
      : filtroAlergeno === 'true' 
        ? i.es_alergeno 
        : !i.es_alergeno
    return matchNombre && matchAlergeno
  })

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { 
      key: 'es_alergeno', 
      label: 'Alérgeno',
      render: (val) => (
        <span className={`badge ${val ? 'badge-danger' : 'badge-success'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      )
    }
  ]

  const handleEdit = (ingrediente) => {
    navigate(`/ingredientes/${ingrediente.id}/editar`)
  }

  const handleDelete = (ingrediente) => {
    setIngredienteToDelete(ingrediente)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteIngrediente(ingredienteToDelete.id)
      setShowDeleteModal(false)
      setIngredienteToDelete(null)
      fetchIngredientes()
    } catch (err) {
      alert('Error al eliminar ingrediente')
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>Ingredientes</h1>
        <Link to="/ingredientes/nuevo" className="btn btn-primary">Nuevo Ingrediente</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre del ingrediente..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Alérgeno</label>
            <select
              className="filtro-input"
              value={filtroAlergeno}
              onChange={(e) => setFiltroAlergeno(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>

        <DataTable
          data={filteredIngredientes}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay ingredientes"
        />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Ingrediente"
      >
        <p>¿Estás seguro de eliminar el ingrediente <strong>{ingredienteToDelete?.nombre}</strong>?</p>
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

export default IngredienteList