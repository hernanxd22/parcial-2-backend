import { Link } from 'react-router-dom'
import type { Producto } from '../types'
import { useCartStore } from '../store/useCartStore'

interface ProductoCardProps {
  producto: Producto
}

export default function ProductoCard({ producto }: ProductoCardProps) {
  const addItem = useCartStore((state) => state.addItem)

  const sinStock = !producto.disponible

  const handleAddToCart = () => {
    if (sinStock) return
    addItem(
      {
        id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_base,
      },
      1
    )
  }

  // imagen_url es array, tomamos el primero si existe
  const imagenSrc = Array.isArray(producto.imagen_url) && producto.imagen_url.length > 0
    ? producto.imagen_url[0]
    : null

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      <Link to={`/productos/${producto.id}`}>
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          {imagenSrc ? (
            <img
              src={imagenSrc}
              alt={producto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-4xl">🍽️</span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/productos/${producto.id}`}>
          <h3 className="font-semibold text-lg text-gray-800 hover:text-orange-600 transition-colors">
            {producto.nombre}
          </h3>
        </Link>

        {producto.categoria_nombre && (
          <p className="text-sm text-gray-500 mt-1">{producto.categoria_nombre}</p>
        )}

        <p className="text-xl font-bold text-orange-600 mt-2">
          ${producto.precio_base.toFixed(2)}
        </p>

        <button
          onClick={handleAddToCart}
          disabled={sinStock}
          className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            sinStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {sinStock ? 'Sin stock' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  )
}