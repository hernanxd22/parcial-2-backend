import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductoById, createProducto, updateProducto, getCategorias, getIngredientes } from '../../api/endpoints'

function ProductoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    stock_cantidad: 0,
    disponible: true,
    unidad_venta_id: null,
    imagen_url: []
  })
  const [categorias, setCategorias] = useState([])
  const [ingredientes, setIngredientes] = useState([])
  const [selectedCategorias, setSelectedCategorias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [catRes, ingRes] = await Promise.all([
        getCategorias({ limit: 100 }),
        getIngredientes({ limit: 100 })
      ])
      setCategorias(catRes.data.data || [])
      setIngredientes(ingRes.data.data || [])

      if (isEdit) {
        const prodRes = await getProductoById(id)
        const prod = prodRes.data
        setFormData({
          nombre: prod.nombre || '',
          descripcion: prod.descripcion || '',
          precio_base: prod.precio_base || '',
          stock_cantidad: prod.stock_cantidad || 0,
          disponible: prod.disponible ?? true,
          unidad_venta_id: prod.unidad_venta_id || null,
          imagen_url: prod.imagen_url || []
        })
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
    })
  }

  const handleCategoriaChange = (categoriaId) => {
    const id = parseInt(categoriaId)
    if (selectedCategorias.includes(id)) {
      setSelectedCategorias(selectedCategorias.filter(c => c !== id))
    } else {
      setSelectedCategorias([...selectedCategorias, id])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        ...formData,
        categoria_ids: selectedCategorias,
        ingredientes: []
      }

      if (isEdit) {
        await updateProducto(id, data)
      } else {
        await createProducto(data)
      }
      navigate('/productos')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card-header">
        <h1>{isEdit ? 'Editar' : 'Nuevo'} Producto</h1>
        <Link to="/productos" className="btn btn-secondary">Volver</Link>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label className="form-label">Precio Base</label>
              <input
                type="number"
                name="precio_base"
                className="form-input"
                value={formData.precio_base}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock</label>
              <input
                type="number"
                name="stock_cantidad"
                className="form-input"
                value={formData.stock_cantidad}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="disponible"
                checked={formData.disponible}
                onChange={handleChange}
              />{' '}
              Disponible
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Categorías</label>
            <div className="checkbox-group">
              {categorias.map(cat => (
                <label key={cat.id}>
                  <input
                    type="checkbox"
                    checked={selectedCategorias.includes(cat.id)}
                    onChange={() => handleCategoriaChange(cat.id)}
                  />{' '}
                  {cat.nombre}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <Link to="/productos" className="btn btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoForm