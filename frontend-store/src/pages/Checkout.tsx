import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'
import { createPedido, getDirecciones, createDireccion } from '../api/endpoints'
import type { Direccion } from '../types'

export default function Checkout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, loading } = useAuthStore()
  const { items, total, clearCart } = useCartStore()
  const [direccionId, setDireccionId] = useState<number | ''>('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formaPago, setFormaPago] = useState('EFECTIVO')

  // Form state para nueva dirección
  const [alias, setAlias] = useState('')
  const [linea1, setLinea1] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')

  const { data: direccionesRes, isLoading: loadingDirecciones } = useQuery({
    queryKey: ['direcciones', user?.id],
    queryFn: () => getDirecciones(user!.id),
    enabled: !!user?.id,
  })

  const direcciones: Direccion[] = direccionesRes?.data?.data ?? []

  const envio = total >= 100 ? 0 : 9.99
  const totalFinal = total + envio

  const direccionMutation = useMutation({
    mutationFn: () =>
      createDireccion({
        usuario_id: user!.id,
        alias,
        linea1,
        ciudad,
        provincia,
        codigo_postal: codigoPostal,
        es_principal: direcciones.length === 0,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones', user?.id] })
      setDireccionId(res.data.id)
      setShowForm(false)
      setAlias('')
      setLinea1('')
      setCiudad('')
      setProvincia('')
      setCodigoPostal('')
    },
    onError: () => {
      setError('Error al guardar la dirección.')
    },
  })

  const pedidoMutation = useMutation({
    mutationFn: () =>
      createPedido({
        usuario_id: user!.id,
        forma_pago_codigo: formaPago,
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

  const handleSubmitPedido = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!direccionId) return
    pedidoMutation.mutate()
  }

  const handleSubmitDireccion = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    direccionMutation.mutate()
  }

  if (loading || loadingDirecciones) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  if (items.length === 0) {
    navigate('/carrito')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Finalizar Pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Dirección */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Dirección de entrega</h2>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="text-sm text-orange-600 hover:underline"
              >
                {showForm ? 'Cancelar' : '+ Nueva dirección'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSubmitDireccion} className="space-y-3 mb-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h3 className="font-medium text-gray-700">Nueva dirección</h3>
                <input
                  type="text"
                  placeholder="Alias (ej: Casa, Trabajo)"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Dirección (ej: Av. Siempre Viva 123)"
                  value={linea1}
                  onChange={(e) => setLinea1(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Provincia"
                    value={provincia}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Código postal"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="submit"
                  disabled={direccionMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {direccionMutation.isPending ? 'Guardando...' : 'Guardar dirección'}
                </button>
              </form>
            )}

            {direcciones.length > 0 ? (
              <select
                value={direccionId}
                onChange={(e) => setDireccionId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Seleccionar dirección</option>
                {direcciones.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.alias} — {dir.linea1}, {dir.ciudad}
                    {dir.es_principal ? ' (Principal)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              !showForm && (
                <p className="text-gray-500 text-sm">
                  No tenés direcciones guardadas. Agregá una con el botón de arriba.
                </p>
              )
            )}
          </div>

          {/* Forma de pago */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Forma de pago</h2>
            <div className="space-y-3">
              {[
                { codigo: 'EFECTIVO', label: '💵 Efectivo - Retiro en local' },
                { codigo: 'MERCADOPAGO', label: '💳 MercadoPago' },
                { codigo: 'TRANSFERENCIA', label: '🏦 Transferencia bancaria' },
              ].map((opcion) => (
                <label
                  key={opcion.codigo}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formaPago === opcion.codigo
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="formaPago"
                    value={opcion.codigo}
                    checked={formaPago === opcion.codigo}
                    onChange={(e) => setFormaPago(e.target.value)}
                    className="accent-orange-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{opcion.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Productos</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.producto_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.nombre} x{item.cantidad}</span>
                  <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Resumen</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Envío</span>
              <span className="font-medium">{envio === 0 ? 'Gratis' : `$${envio.toFixed(2)}`}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-orange-600">${totalFinal.toFixed(2)}</span>
            </div>
          </div>

          {/* Forma de pago seleccionada */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <span className="font-medium">Pagás con: </span>
            {formaPago === 'EFECTIVO' && '💵 Efectivo'}
            {formaPago === 'MERCADOPAGO' && '💳 MercadoPago'}
            {formaPago === 'TRANSFERENCIA' && '🏦 Transferencia'}
          </div>

          <button
            onClick={handleSubmitPedido}
            disabled={pedidoMutation.isPending || !direccionId}
            className="mt-6 w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
          >
            {pedidoMutation.isPending ? 'Procesando...' : 'Confirmar pedido'}
          </button>

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}