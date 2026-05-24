import type { CartItem } from '../types'
import { useCartStore } from '../store/useCartStore'

interface CarritoItemProps {
  item: CartItem
}

export default function CarritoItem({ item }: CarritoItemProps) {
  const { updateQuantity, removeItem } = useCartStore()

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0) {
      updateQuantity(item.producto_id, value)
    }
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100">
      {/* Info */}
      <div className="flex-1">
        <h3 className="font-medium text-gray-800">{item.nombre}</h3>
        <p className="text-sm text-gray-500">${item.precio_unitario.toFixed(2)} c/u</p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          -
        </button>
        <input
          type="number"
          min="1"
          value={item.cantidad}
          onChange={handleQuantityChange}
          className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm"
        />
        <button
          onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div className="w-24 text-right">
        <p className="font-semibold text-gray-800">${item.subtotal.toFixed(2)}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => removeItem(item.producto_id)}
        className="text-red-500 hover:text-red-700 transition-colors p-1"
        title="Eliminar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
