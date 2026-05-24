import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProductoById, createProducto, updateProducto, getCategorias, getIngredientes, getUnidadesMedida } from '../../api/endpoints'

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
    imagen_url: [],
    categoria_id: '',
    es_principal: false,
  })
  const [categorias, setCategorias] = useState([])
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([])
  const [unidades, setUnidades] = useState([])
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [catRes, ingRes, uniRes] = await Promise.all([
        getCategorias({ limit: 100 }),
        getIngredientes({ limit: 100 }),
        getUnidadesMedida({ limit: 100 })
      ])
      setCategorias(catRes.data.data || [])
      setIngredientesDisponibles(ingRes.data.data || [])
      setUnidades(uniRes.data.data || [])

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
          imagen_url: prod.imagen_url || [],
          categoria_id: '',
          es_principal: false,
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
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    })
  }

  const agregarIngrediente = () => {
    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      { ingrediente_id: '', cantidad: '', unidad_medida_id: '', es_removible: false }
    ])
  }

  const quitarIngrediente = (index) => {
    setIngredientesSeleccionados(ingredientesSeleccionados.filter((_, i) => i !== index))
  }

  const handleIngredienteChange = (index, field, value) => {
    const nuevos = [...ingredientesSeleccionados]
    nuevos[index][field] = value
    setIngredientesSeleccionados(nuevos)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio_base: parseFloat(formData.precio_base),
        stock_cantidad: parseInt(formData.stock_cantidad) || 0,
        disponible: formData.disponible,
        unidad_venta_id: formData.unidad_venta_id ? parseInt(formData.unidad_venta_id) : null,
        imagen_url: formData.imagen_url,
        categoria_id: parseInt(formData.categoria_id),
        es_principal: formData.es_principal,
        ingredientes: ingredientesSeleccionados.map(ing => ({
          ingrediente_id: parseInt(ing.ingrediente_id),
          cantidad: parseFloat(ing.cantidad),
          unidad_medida_id: parseInt(ing.unidad_medida_id),
          es_removible: ing.es_removible,
        })),
      }

      if (isEdit) {
        await updateProducto(id, payload)
      } else {
        await createProducto(payload)
      }
      navigate('/productos')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const ingredienteOptions = ingredientesDisponibles.filter(ing => {
    if (ing.activo === false) return false
    const yaAgregado = ingredientesSeleccionados.some(
      (sel, idx) => parseInt(sel.ingrediente_id) === ing.id
    )
    return !yaAgregado
  })

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

          {/* CATEGORÍA — obligatoria, única */}
          <div className="form-group">
            <label className="form-label">
              Categoría <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="categoria_id"
              className="form-select"
              value={formData.categoria_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                name="es_principal"
                checked={formData.es_principal}
                onChange={handleChange}
              />{' '}
              Categoría principal
            </label>
          </div>

          {/* INGREDIENTES — dinámicos */}
          <div className="form-group">
            <label className="form-label">
              Ingredientes <span style={{ color: 'red' }}>*</span>
            </label>

            {ingredientesSeleccionados.length === 0 && (
              <p style={{ color: '#999', fontSize: '0.9em', marginBottom: '10px' }}>
                Agregá al menos un ingrediente al producto.
              </p>
            )}

            {ingredientesSeleccionados.map((ing, index) => (
              <div key={index} style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '10px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong>Ingrediente #{index + 1}</strong>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => quitarIngrediente(index)}
                    style={{ padding: '2px 8px', fontSize: '0.85em' }}
                  >
                    Quitar
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.85em', display: 'block', marginBottom: '3px' }}>Ingrediente</label>
                    <select
                      className="form-select"
                      value={ing.ingrediente_id}
                      onChange={(e) => handleIngredienteChange(index, 'ingrediente_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {ingredientesDisponibles.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.85em', display: 'block', marginBottom: '3px' }}>Cantidad</label>
                    <input
                      type="number"
                      className="form-input"
                      value={ing.cantidad}
                      onChange={(e) => handleIngredienteChange(index, 'cantidad', e.target.value)}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.85em', display: 'block', marginBottom: '3px' }}>Unidad de Medida</label>
                    <select
                      className="form-select"
                      value={ing.unidad_medida_id}
                      onChange={(e) => handleIngredienteChange(index, 'unidad_medida_id', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {unidades.map(uni => (
                        <option key={uni.id} value={uni.id}>{uni.nombre} ({uni.simbolo || ''})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '5px', display: 'flex', alignItems: 'flex-end' }}>
                    <label style={{ fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="checkbox"
                        checked={ing.es_removible}
                        onChange={(e) => handleIngredienteChange(index, 'es_removible', e.target.checked)}
                      />
                      Removible
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={agregarIngrediente}
              style={{ marginTop: '5px' }}
            >
              + Agregar ingrediente
            </button>
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