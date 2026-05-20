import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUsuarios, deleteUsuario } from '../../api/endpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'

function UsuarioList() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [usuarioToDelete, setUsuarioToDelete] = useState(null)
  const navigate = useNavigate()

  const fetchUsuarios = async () => {
    try {
      const response = await getUsuarios({ limit: 100 })
      setUsuarios(response.data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.apellido?.toLowerCase().includes(filtro.toLowerCase()) ||
    u.email?.toLowerCase().includes(filtro.toLowerCase())
  )

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'email', label: 'Email' },
    { key: 'celular', label: 'Celular' },
    { 
      key: 'activo', 
      label: 'Activo',
      render: (val) => (
        <span className={`badge ${val ? 'badge-success' : 'badge-danger'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      )
    }
  ]

  const handleEdit = (usuario) => {
    navigate(`/usuarios/${usuario.id}/editar`)
  }

  const handleDelete = (usuario) => {
    setUsuarioToDelete(usuario)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteUsuario(usuarioToDelete.id)
      setShowDeleteModal(false)
      setUsuarioToDelete(null)
      fetchUsuarios()
    } catch (err) {
      alert('Error al eliminar usuario')
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>Usuarios</h1>
        <Link to="/usuarios/nuevo" className="btn btn-primary">Nuevo Usuario</Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Nombre, apellido o email..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={filteredUsuarios}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
          emptyMessage="No hay usuarios"
        />
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Usuario"
      >
        <p>¿Estás seguro de eliminar el usuario <strong>{usuarioToDelete?.nombre} {usuarioToDelete?.apellido}</strong>?</p>
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

export default UsuarioList