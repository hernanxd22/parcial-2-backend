import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getProductoById,
  createProducto,
  updateProducto,
  getCategorias,
  getIngredientes,
  getUnidadesMedida
} from '../../api/endpoints'

import SearchableSelect from '../../components/SearchableSelect'

function ProductoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio_base: '',
    disponible: true,
    imagen_url: [],
    categoria_id: '',
    es_principal: false,
  })

  const [llevaIngredientes, setLlevaIngredientes] = useState(true)
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
        getUnidadesMedida({ limit: 100 }),
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
          disponible: prod.disponible ?? true,
          imagen_url: prod.imagen_url || [],
          categoria_id: prod.categoria_id || '',
          es_principal: prod.es_principal || false,
        })

        if (prod.producto_ingredientes?.length > 0) {
          setIngredientesSeleccionados(
            prod.producto_ingredientes.map((ing) => ({
              ingrediente_id: ing.ingrediente_id,
              cantidad: String(ing.cantidad),
              unidad_medida_id: ing.unidad_medida_id,
              es_removible: ing.es_removible || false,
            }))
          )
        } else {
          setLlevaIngredientes(false)
        }
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    })
  }

  // --- Manejo de ingredientes ---

  const agregarIngrediente = (ingredienteId) => {
    const ingrediente = ingredientesDisponibles.find(
      (i) => i.id === ingredienteId
    )

    if (!ingrediente) return

    // No duplicar
    if (
      ingredientesSeleccionados.some(
        (i) => i.ingrediente_id === ingredienteId
      )
    ) {
      return
    }

    setIngredientesSeleccionados([
      ...ingredientesSeleccionados,
      {
        ingrediente_id: ingredienteId,
        cantidad: '1',
        unidad_medida_id: ingrediente.unidad_medida_id,
        es_removible: false,
      },
    ])
  }

  const quitarIngrediente = (index) => {
    setIngredientesSeleccionados(
      ingredientesSeleccionados.filter((_, i) => i !== index)
    )
  }

  const handleIngredienteCantidad = (index, cantidad) => {
    const nuevos = [...ingredientesSeleccionados]
    nuevos[index].cantidad = cantidad
    setIngredientesSeleccionados(nuevos)
  }

  const handleIngredienteRemovible = (index, checked) => {
    const nuevos = [...ingredientesSeleccionados]
    nuevos[index].es_removible = checked
    setIngredientesSeleccionados(nuevos)
  }

  const getIngredienteNombre = (id) => {
    return (
      ingredientesDisponibles.find((i) => i.id === id)?.nombre ||
      `ID: ${id}`
    )
  }

  const getUnidadSimbolo = (id) => {
    if (!id) return ''
    return unidades.find((u) => u.id === id)?.simbolo || ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,

        precio_base:
          parseFloat(
            String(formData.precio_base).replace(',', '.')
          ) || 0,

        disponible: formData.disponible,
        imagen_url: formData.imagen_url,
        categoria_id: parseInt(formData.categoria_id),
        es_principal: formData.es_principal,

        ingredientes: llevaIngredientes
          ? ingredientesSeleccionados.map((ing) => ({
              ingrediente_id: ing.ingrediente_id,

              cantidad:
                parseFloat(
                  String(ing.cantidad).replace(',', '.')
                ) || 0,

              unidad_medida_id: ing.unidad_medida_id,
              es_removible: ing.es_removible,
            }))
          : [],
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

  // Omitir ingredientes ya seleccionados de las opciones
  const ingredientesFiltrados = ingredientesDisponibles.filter(
    (ing) =>
      !ingredientesSeleccionados.some(
        (s) => s.ingrediente_id === ing.id
      )
  )

  return (
    <div>

      <div className="card-header">
        <h1>
          {isEdit ? 'Editar' : 'Nuevo'} Producto
        </h1>

        <Link
          to="/productos"
          className="btn btn-secondary"
        >
          Volver
        </Link>
      </div>

      <div className="card">

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label className="form-label">
              Nombre
            </label>

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
            <label className="form-label">
              Descripción
            </label>

            <textarea
              name="descripcion"
              className="form-textarea"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Precio Base
            </label>

            <input
              type="text"
              name="precio_base"
              className="form-input"
              value={formData.precio_base}
              onChange={(e) => {
                let value = e.target.value

                value = value.replace(/[^0-9.,]/g, '')

                setFormData({
                  ...formData,
                  precio_base: value
                })
              }}
              placeholder="0,00"
              required
            />
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
            <label className="form-label">
              Categoría <span style={{ color: 'red' }}>*</span>
            </label>

            <SearchableSelect
              options={categorias}
              value={formData.categoria_id}
              onChange={(val) =>
                setFormData({
                  ...formData,
                  categoria_id: val
                })
              }
              placeholder="Buscar categoría..."
              labelKey="nombre"
            />
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

          <div className="form-group">
            <label className="form-label">
              <input
                type="checkbox"
                checked={llevaIngredientes}
                onChange={(e) => {
                  setLlevaIngredientes(e.target.checked)

                  if (!e.target.checked) {
                    setIngredientesSeleccionados([])
                  }
                }}
              />{' '}
              Lleva ingredientes
            </label>
          </div>

          {/* --- INGREDIENTES --- */}

          {llevaIngredientes && (
            <div className="form-group">

              <label className="form-label">
                Ingredientes
              </label>

              {/* Buscador de ingredientes */}

              <div style={{ marginBottom: '12px' }}>
                <SearchableSelect
                  options={ingredientesFiltrados}
                  value={null}
                  onChange={(val) => agregarIngrediente(val)}
                  placeholder="Buscar ingrediente para agregar..."
                  labelKey="nombre"
                />

                {ingredientesFiltrados.length === 0 && (
                  <p
                    style={{
                      color: '#999',
                      fontSize: '0.85em',
                      marginTop: '4px'
                    }}
                  >
                    Todos los ingredientes disponibles ya fueron agregados.
                  </p>
                )}
              </div>

              {/* Tabla de ingredientes */}

              {ingredientesSeleccionados.length > 0 ? (

                <div className="table-container">

                  <table
                    className="table"
                    style={{ fontSize: '0.9em' }}
                  >

                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th style={{ width: '120px' }}>
                          Cantidad
                        </th>
                        <th style={{ width: '80px' }}>
                          Unidad
                        </th>
                        <th style={{ width: '90px' }}>
                          Removible
                        </th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>

                    <tbody>

                      {ingredientesSeleccionados.map((ing, index) => (

                        <tr key={index}>

                          <td>
                            {getIngredienteNombre(
                              ing.ingrediente_id
                            )}
                          </td>

                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={ing.cantidad}
                              onChange={(e) => {
                                let value = e.target.value

                                // Permitir números, coma y punto
                                value = value.replace(/[^0-9.,]/g, '')

                                handleIngredienteCantidad(
                                  index,
                                  value
                                )
                              }}
                              placeholder="0,00"
                              required
                              style={{ width: '100%' }}
                            />
                          </td>

                          <td style={{ color: '#666' }}>
                            {getUnidadSimbolo(
                              ing.unidad_medida_id
                            )}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={ing.es_removible}
                              onChange={(e) =>
                                handleIngredienteRemovible(
                                  index,
                                  e.target.checked
                                )
                              }
                            />
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() =>
                                quitarIngrediente(index)
                              }
                              title="Quitar ingrediente"
                            >
                              ✕
                            </button>
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>
                </div>

              ) : (

                <p
                  style={{
                    color: '#999',
                    fontSize: '0.9em'
                  }}
                >
                  Buscá ingredientes arriba para agregarlos al producto.
                </p>
              )}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}
          >

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>

            <Link
              to="/productos"
              className="btn btn-secondary"
            >
              Cancelar
            </Link>

          </div>

        </form>
      </div>
    </div>
  )
}

export default ProductoForm