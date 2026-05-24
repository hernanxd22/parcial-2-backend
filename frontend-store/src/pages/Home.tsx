import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import ProductoCard from '../components/ProductoCard'
import { getProductos, getCategorias } from '../api/endpoints'
import type { Producto, Categoria } from '../types'

export default function Home() {
  const [search, setSearch] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | ''>('')
  const [page, setPage] = useState(0)
  const limit = 12

  const {
    data: productosRes,
    isLoading: loadingProductos,
  } = useQuery({
    queryKey: ['productos', search, categoriaId, page],
    queryFn: () =>
      getProductos({
        offset: page * limit,
        limit,
        ...(search ? { q: search } : {}),
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      }),
  })

  const { data: categoriasRes } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => getCategorias(),
  })

  const productos: Producto[] = productosRes?.data?.data ?? []
  const categorias: Categoria[] = categoriasRes?.data?.data ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Bienvenido a Food Store
        </h1>
        <p className="text-gray-500 text-lg">
          Los mejores productos al mejor precio
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <select
          value={categoriaId}
          onChange={(e) => {
            setCategoriaId(e.target.value ? Number(e.target.value) : '')
            setPage(0)
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loadingProductos ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando productos...</p>
        </div>
      ) : productos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((producto) => (
              <ProductoCard key={producto.id} producto={producto} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-gray-600">Página {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={productos.length < limit}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}
