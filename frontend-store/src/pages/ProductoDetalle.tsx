import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProducto } from '../api/endpoints'
import { useCartStore } from '../store/useCartStore'
import type { Producto } from '../types'

export default function ProductoDetalle() {
  const { id } = useParams<{ id: string }>()
  const [cantidad, setCantidad] = useState(1)
  const addItem = useCartStore((state) => state.addItem)

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['producto', id],
    queryFn: () => getProducto(Number(id)),
    enabled: !!id,
  })

  const producto: Producto | null = res?.data ?? null

  const handleAddToCart = () => {
    if (!producto) return
    addItem(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_unitario,
      },
      cantidad
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Cargando producto...</p>
      </div>
    )
  }

  if (isError || !producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-red-500 text-lg">Error al cargar el producto</p>
        <Link to="/" className="text-orange-600 hover:underline mt-4 inline-block">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const sinStock = !producto.disponible

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-orange-600 hover:underline mb-6 inline-block">
        &larr; Volver al catálogo
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="h-80 bg-gray-100 rounded-xl flex items-center justify-center">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <span className="text-6xl">🍽️</span>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{producto.nombre}</h1>

          {producto.categoria_nombre && (
            <p className="text-sm text-gray-500 mt-2">{producto.categoria_nombre}</p>
          )}

          <p className="text-3xl font-bold text-orange-600 mt-4">
            ${producto.precio_unitario.toFixed(2)}
          </p>

          <p className="text-gray-600 mt-4">{producto.descripcion}</p>

          {/* Ingredientes */}
          {producto.ingredientes && producto.ingredientes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-2">Ingredientes</h3>
              <ul className="space-y-1">
                {producto.ingredientes.map((ing) => (
                  <li key={ing.id} className="text-sm text-gray-600">
                    {ing.nombre} — {ing.cantidad} {ing.unidad_medida}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to cart */}
          {!sinStock && (
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  -
                </button>
                <span className="w-10 text-center font-semibold">{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => c + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                Agregar al carrito
              </button>
            </div>
          )}

          {sinStock && (
            <p className="text-red-500 font-medium mt-6">Producto no disponible</p>
          )}
        </div>
      </div>
    </div>
  )
}
