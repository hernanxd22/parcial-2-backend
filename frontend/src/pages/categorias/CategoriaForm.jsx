import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCategoriaById, createCategoria, updateCategoria, getCategorias } from '../../api/endpoints'

function CategoriaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    parent_id: null,
    imagen_url: ''
  })
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const catRes = await getCategorias({ limit: 100 })
      setCategorias(catRes.data.data || [])

      if (isEdit) {
        const res = await getCategoriaById(id)
        setFormData({
          nombre: res.data.nombre || '',
          descripcion: res.data.descripcion || '',
          parent_id: res.data.parent_id || null,
          imagen_url: res.data.imagen_url || ''
        })
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value === '' ? null : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await updateCategoria(id, formData)
      } else {
        await createCategoria(formData)
      }
      navigate('/categorias')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar categorías para evitar ciclos (no permitir que una categoría sea padre de sí misma o sus hijos)
  const categoriasOptions = categorias.filter(c => c.id !== parseInt(id || 0))

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nueva'} Categoría</h1>
        <Link to="/categorias" className="btn btn-secondary">Volver</Link>
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
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría Padre</label>
            <select
              name="parent_id"
              className="form-select"
              value={formData.parent_id || ''}
              onChange={handleChange}
            >
              <option value="">Ninguna (categoría raíz)</option>
              {categoriasOptions.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">URL de Imagen</label>
            <input
              type="text"
              name="imagen_url"
              className="form-input"
              value={formData.imagen_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/categorias" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoriaForm