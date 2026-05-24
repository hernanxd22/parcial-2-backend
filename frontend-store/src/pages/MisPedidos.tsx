import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { getMisPedidos } from '../api/endpoints'
import type { Pedido } from '../types'

const ESTADOS_VALIDOS = [
  'PENDIENTE',
  'CONFIRMADO',
  'PREPARACION',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
]

const ESTADOS_TIMELINE = ESTADOS_VALIDOS.filter((e) => e !== 'CANCELADO')

function getEstadoIndex(estado: string): number {
  return ESTADOS_VALIDOS.indexOf(estado)
}

export default function MisPedidos() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login')
    }
  }, [loading, isAuthenticated, navigate])

  const { data: res, isLoading, isError } = useQuery({
    queryKey: ['mis-pedidos', user?.id],
    queryFn: () => getMisPedidos(user?.id),
    enabled: !!user?.id,
  })

  const pedidos: Pedido[] = res?.data?.data ?? []

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Pedidos</h1>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando pedidos...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error al cargar los pedidos</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No tenés pedidos todavía</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Pedido #{pedido.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    pedido.estado === 'CANCELADO'
                      ? 'bg-red-100 text-red-700'
                      : pedido.estado === 'ENTREGADO'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {pedido.estado}
                </span>
              </div>

              {/* Timeline */}
              {pedido.historial_estados && pedido.historial_estados.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1">
                    {ESTADOS_TIMELINE.map((estado, idx) => {
                      const currentIdx = getEstadoIndex(pedido.estado)
                      const isActive = idx <= currentIdx
                      const isCurrent = idx === currentIdx
                      return (
                        <div key={estado} className="flex items-center flex-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              isActive ? 'bg-orange-600' : 'bg-gray-200'
                            } ${isCurrent ? 'ring-2 ring-orange-300' : ''}`}
                          />
                          {idx < ESTADOS_TIMELINE.length - 1 && (
                            <div
                              className={`flex-1 h-0.5 ${
                                isActive && idx < currentIdx
                                  ? 'bg-orange-600'
                                  : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {ESTADOS_TIMELINE.map((estado) => (
                      <span
                        key={estado}
                        className="text-[10px] text-gray-400 uppercase"
                      >
                        {estado}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="border-t border-gray-100 pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="text-left py-1">Producto</th>
                      <th className="text-center py-1">Cant.</th>
                      <th className="text-right py-1">Precio</th>
                      <th className="text-right py-1">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.items?.map((item) => (
                      <tr key={item.id} className="border-t border-gray-50">
                        <td className="py-2 text-gray-800">{item.nombre}</td>
                        <td className="py-2 text-center text-gray-600">
                          {item.cantidad}
                        </td>
                        <td className="py-2 text-right text-gray-600">
                          ${item.precio_unitario.toFixed(2)}
                        </td>
                        <td className="py-2 text-right font-medium">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
                <div className="text-right">
                  <span className="text-sm text-gray-500">Total</span>
                  <p className="text-lg font-bold text-orange-600">
                    ${pedido.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
