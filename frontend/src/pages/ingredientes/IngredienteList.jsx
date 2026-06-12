import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getIngredientes, deleteIngrediente, getUnidadesMedida } from '../../api/endpoints'
import { useAuth } from '../../context/AuthContext'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 12

function IngredienteList() {
  const { user } = useAuth()
  const isStock = user?.rol === "STOCK"
  const [ingredientes, setIngredientes] = useState([])
  const [unidadMap, setUnidadMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [filtroAlergeno, setFiltroAlergeno] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ingredienteToDelete, setIngredienteToDelete] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const navigate = useNavigate()

  const fetchIngredientes = async (pageNum = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const [ingRes, uniRes] = await Promise.all([
        getIngredientes({ offset, limit: PAGE_SIZE, nombre: filtro || undefined }),
        getUnidadesMedida({ limit: 100 })
      ])
      setIngredientes(ingRes.data.data || [])
      setTotal(ingRes.data.total || 0)
      setTotalPages(Math.ceil((ingRes.data.total || 0) / PAGE_SIZE))
      const map = {}
      ;(uniRes.data || []).forEach(u => { map[u.id] = u })
      setUnidadMap(map)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredientes(page)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchIngredientes(1)
  }, [filtro])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchIngredientes(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredIngredientes = ingredientes.filter(i => {
    const matchAlergeno = filtroAlergeno === '' 
      ? true 
      : filtroAlergeno === 'true' 
        ? i.es_alergeno 
        : !i.es_alergeno
    return matchAlergeno
  })

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'costo', label: 'Costo', render: (val) => `$${val?.toFixed(2)}` },
    { 
      key: 'es_alergeno', 
      label: 'Alérgeno',
      render: (val) => (
        <span className={`badge ${val ? 'badge-danger' : 'badge-success'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      )
    },
    { 
      key: 'stock_cantidad', 
      label: 'Stock',
      render: (val, item) => {
        const uni = item.unidad_medida_id ? unidadMap[item.unidad_medida_id] : null
        return (
          <span style={{ color: val === 0 ? '#999' : 'inherit' }}>
            {val} {uni ? `${uni.simbolo} (${uni.nombre})` : ''}
          </span>
        )
      }
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
      const msg = err.response?.data?.detail || "Error al eliminar ingrediente";
      alert(msg);
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>Ingredientes</h1>
        {!isStock && <Link to="/ingredientes/nuevo" className="btn btn-primary">Nuevo Ingrediente</Link>}
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
          onDelete={isStock ? undefined : handleDelete}
          loading={loading}
          emptyMessage="No hay ingredientes"
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
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