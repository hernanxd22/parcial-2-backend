import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getIngredienteById, createIngrediente, updateIngrediente, getUnidadesMedida } from '../../api/endpoints'

function IngredienteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    es_alergeno: false,
    stock_cantidad: 0,
    unidad_medida_id: ''
  })
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const uniRes = await getUnidadesMedida({ limit: 100 })
      setUnidades(uniRes.data.data || [])

      if (isEdit) {
        const response = await getIngredienteById(id)
        setFormData({
          nombre: response.data.nombre || '',
          descripcion: response.data.descripcion || '',
          es_alergeno: response.data.es_alergeno || false,
          stock_cantidad: response.data.stock_cantidad || 0,
          unidad_medida_id: response.data.unidad_medida_id || ''
        })
      }
    } catch (err) {
      console.error('Error:', err)
      if (isEdit) navigate('/ingredientes')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...formData,
        stock_cantidad: parseFloat(formData.stock_cantidad) || 0,
        unidad_medida_id: formData.unidad_medida_id ? parseInt(formData.unidad_medida_id) : null,
      }

      if (isEdit) {
        await updateIngrediente(id, payload)
      } else {
        await createIngrediente(payload)
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
              Es alérgeno
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Stock / Cantidad</label>
              <input
                type="number"
                name="stock_cantidad"
                className="form-input"
                value={formData.stock_cantidad}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unidad de Medida</label>
              <select
                name="unidad_medida_id"
                className="form-select"
                value={formData.unidad_medida_id}
                onChange={handleChange}
              >
                <option value="">Sin unidad</option>
                {unidades.map(uni => (
                  <option key={uni.id} value={uni.id}>{uni.nombre} ({uni.simbolo})</option>
                ))}
              </select>
            </div>
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