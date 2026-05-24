import { Link } from 'react-router-dom'
import { useCartStore } from '../store/useCartStore'
import CarritoItem from '../components/CarritoItem'

export default function Carrito() {
  const { items, total } = useCartStore()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Tu carrito está vacío</h2>
        <p className="text-gray-500 mt-2">Agregá productos desde nuestro catálogo</p>
        <Link
          to="/"
          className="inline-block mt-6 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  const envio = total >= 100 ? 0 : 9.99
  const totalFinal = total + envio

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Carrito de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            {items.map((item) => (
              <CarritoItem key={item.producto_id} item={item} />
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Envío</span>
              <span className="font-medium">
                {envio === 0 ? 'Gratis' : `$${envio.toFixed(2)}`}
              </span>
            </div>
            {total < 100 && (
              <p className="text-xs text-orange-600">
                Faltan ${(100 - total).toFixed(2)} para envío gratis
              </p>
            )}
            <hr className="border-gray-200" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-orange-600">
                ${totalFinal.toFixed(2)}
              </span>
            </div>
          </div>

          <Link
            to="/checkout"
            className="block mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium text-center transition-colors"
          >
            Finalizar pedido
          </Link>
        </div>
      </div>
    </div>
  )
}
