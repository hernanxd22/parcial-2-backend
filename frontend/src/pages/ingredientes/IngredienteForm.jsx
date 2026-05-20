import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getIngredienteById, createIngrediente, updateIngrediente } from '../../api/endpoints'

function IngredienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    es_alergeno: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      fetchIngrediente()
    }
  }, [id])

  const fetchIngrediente = async () => {
    try {
      const response = await getIngredienteById(id)
      setFormData(response.data)
    } catch (err) {
      console.error('Error:', err)
      navigate('/ingredientes')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await updateIngrediente(id, formData)
      } else {
        await createIngrediente(formData)
      }
      navigate('/ingredientes')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nuevo'} Ingrediente</h1>
        <Link to="/ingredientes" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="form-input"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              name="descripcion"
              className="form-textarea"
              value={formData.descripcion || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="es_alergeno"
                checked={formData.es_alergeno}
                onChange={handleChange}
              />{' '}
              Es alérgeno (mostrará advertencia en la UI)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/ingredientes" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IngredienteForm