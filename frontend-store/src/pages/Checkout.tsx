import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { createPedido, getDirecciones } from '../api/endpoints'
import type { Direccion } from '../types'

export default function Checkout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, loading } = useAuthStore()
  const { items, total, clearCart } = useCartStore()
  const [direccionId, setDireccionId] = useState<number | ''>('')
  const [error, setError] = useState('')

  const isClient = user?.roles?.includes('CLIENTE')

  // Redirect if not authenticated as CLIENT
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isClient)) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, isClient, navigate])

  // Fetch user addresses
  const { data: direccionesRes } = useQuery({
    queryKey: ['direcciones', user?.id],
    queryFn: () => getDirecciones(user!.id),
    enabled: !!user?.id && isClient,
  })

  const direcciones: Direccion[] = direccionesRes?.data?.data ?? []

  const envio = total >= 100 ? 0 : 9.99
  const totalFinal = total + envio

  const pedidoMutation = useMutation({
    mutationFn: () =>
      createPedido({
        direccion_entrega_id: Number(direccionId),
        items: items.map((item) => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
        })),
      }),
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['mis-pedidos'] })
      navigate('/mis-pedidos')
    },
    onError: () => {
      setError('Error al crear el pedido. Intente nuevamente.')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!direccionId) return
    pedidoMutation.mutate()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (items.length === 0) {
    navigate('/carrito')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Finalizar Pedido</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery address */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Dirección de entrega
              </h2>

              {direcciones.length > 0 ? (
                <select
                  value={direccionId}
                  onChange={(e) => setDireccionId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Seleccionar dirección</option>
                  {direcciones.map((dir) => (
                    <option key={dir.id} value={dir.id}>
                      {dir.direccion}, {dir.ciudad}
                      {dir.principal ? ' (Principal)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-500 text-sm">
                  No tenés direcciones guardadas. Agregá una desde tu perfil.
                </p>
              )}
            </div>

            {/* Order items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Productos
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.producto_id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
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
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-orange-600">
                  ${totalFinal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={pedidoMutation.isPending || !direccionId || direcciones.length === 0}
              className="mt-6 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
            >
              {pedidoMutation.isPending ? 'Procesando...' : 'Confirmar pedido'}
            </button>

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
