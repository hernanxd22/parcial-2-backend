import { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCategoriaById, createCategoria, updateCategoria, getCategorias, uploadImage } from '../../api/endpoints'
import { Categoria } from '../../types/categoria'

interface FormData {
  nombre: string
  descripcion: string
  parent_id: number | null
  imagen_url: string
}

function CategoriaForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    parent_id: null,
    imagen_url: ''
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const catRes = await getCategorias({ limit: 100 })
      setCategorias(catRes.data.data || [])

      if (isEdit) {
        const res = await getCategoriaById(Number(id))
        setFormData({
          nombre: res.data.nombre || '',
          descripcion: res.data.descripcion || '',
          parent_id: res.data.parent_id || null,
          imagen_url: res.data.imagen_url || ''
        })
      }
    } catch (err: unknown) {
      console.error('Error:', err)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value === '' ? null : value
    })
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    try {
      const res = await uploadImage(file, 'categorias')
      setFormData((prev) => ({ ...prev, imagen_url: res.data.url }))
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al subir imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEdit) {
        await updateCategoria(Number(id), formData as unknown as Record<string, unknown>)
      } else {
        await createCategoria(formData as unknown as Record<string, unknown>)
      }
      navigate('/categorias')
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const categoriasOptions = categorias.filter(c => c.id !== parseInt(id || '0'))

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
            <label className="form-label">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="form-input"
              style={{ padding: '8px' }}
            />
            {uploadingImage && (
              <small style={{ color: '#888' }}>Subiendo imagen...</small>
            )}
            {formData.imagen_url && (
              <div style={{ marginTop: '8px' }}>
                <img
                  src={formData.imagen_url}
                  alt="Preview"
                  style={{
                    maxWidth: '150px',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    objectFit: 'cover',
                  }}
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: '8px' }}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, imagen_url: '' }))
                  }
                >
                  Quitar
                </button>
              </div>
            )}
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
