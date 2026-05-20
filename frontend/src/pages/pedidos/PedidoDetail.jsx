import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPedidoById, avanzarEstadoPedido } from '../../api/endpoints'

const FSM = {
  'PENDIENTE': ['CONFIRMADO', 'CANCELADO'],
  'CONFIRMADO': ['EN_PREP', 'CANCELADO'],
  'EN_PREP': ['EN_CAMINO', 'CANCELADO'],
  'EN_CAMINO': ['ENTREGADO'],
  'ENTREGADO': [],
  'CANCELADO': []
}

function PedidoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAvanzarModal, setShowAvanzarModal] = useState(false)
  const [selectedEstado, setSelectedEstado] = useState('')
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPedido = async () => {
    try {
      const response = await getPedidoById(id)
      setPedido(response.data)
    } catch (err) {
      console.error('Error:', err)
      navigate('/pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedido()
  }, [id])

  const handleAvanzar = async () => {
    if (selectedEstado === 'CANCELADO' && !motivo) {
      alert('El motivo es obligatorio para cancelar')
      return
    }

    setSaving(true)
    try {
      await avanzarEstadoPedido(id, {
        estado_hacia_codigo: selectedEstado,
        motivo: motivo || null
      })
      setShowAvanzarModal(false)
      setMotivo('')
      fetchPedido()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al avanzar estado')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado) => {
    const colors = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADO': 'badge-info',
      'EN_PREP': 'badge-info',
      'EN_CAMINO': 'badge-info',
      'ENTREGADO': 'badge-success',
      'CANCELADO': 'badge-danger'
    }
    return colors[estado] || 'badge-info'
  }

  if (loading) return <div className="loading">Cargando...</div>

  const estadosPosibles = FSM[pedido?.estado_codigo] || []

  return (
    <div>
      <div className="card-header">
        <h1>Pedido #{pedido?.id}</h1>
        <Link to="/pedidos" className="btn btn-secondary">Volver</Link>
      </div>

      <div className="card">
        <h2 className="card-title">Información del Pedido</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <div>
            <strong>Usuario ID:</strong> {pedido?.usuario_id}
          </div>
          <div>
            <strong>Estado:</strong>{' '}
            <span className={`badge ${getEstadoBadge(pedido?.estado_codigo)}`}>
              {pedido?.estado_codigo}
            </span>
          </div>
          <div>
            <strong>Forma de Pago:</strong> {pedido?.forma_pago_codigo}
          </div>
          <div>
            <strong>Dirección ID:</strong> {pedido?.direccion_id || 'Retiro en local'}
          </div>
          <div>
            <strong>Subtotal:</strong> ${pedido?.subtotal}
          </div>
          <div>
            <strong>Costo Envío:</strong> ${pedido?.costo_envio}
          </div>
          <div>
            <strong>Total:</strong> <strong>${pedido?.total}</strong>
          </div>
          <div>
            <strong>Fecha:</strong> {new Date(pedido?.created_at).toLocaleString()}
          </div>
        </div>

        {pedido?.notas && (
          <div style={{ marginTop: '15px' }}>
            <strong>Notas:</strong> {pedido.notas}
          </div>
        )}

        {estadosPosibles.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAvanzarModal(true)}
            >
              Avanzar Estado
            </button>
          </div>
        )}
      </div>

      {/* Detalles del pedido */}
      <div className="card">
        <h2 className="card-title">Items del Pedido</h2>
        
        {pedido?.detalles?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.detalles.map((detalle, idx) => (
                <tr key={idx}>
                  <td>{detalle.nombre_snapshot}</td>
                  <td>{detalle.cantidad}</td>
                  <td>${detalle.precio_snapshot}</td>
                  <td>${detalle.subtotal_snap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay items</p>
        )}
      </div>

      {/* Historial de estados */}
      <div className="card">
        <h2 className="card-title">Historial de Estados</h2>
        
        {pedido?.historial?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Desde</th>
                <th>Hacia</th>
                <th>Usuario</th>
                <th>Motivo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedido.historial.map((h, idx) => (
                <tr key={idx}>
                  <td>{h.estado_desde_codigo || 'Creación'}</td>
                  <td>{h.estado_hacia_codigo}</td>
                  <td>{h.usuario_id || 'Sistema'}</td>
                  <td>{h.motivo || '-'}</td>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay historial</p>
        )}
      </div>

      {/* Modal para avanzar estado */}
      {showAvanzarModal && (
        <div className="modal-overlay" onClick={() => setShowAvanzarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Avanzar Estado</h2>
              <button className="modal-close" onClick={() => setShowAvanzarModal(false)}>&times;</button>
            </div>

            <div className="form-group">
              <label className="form-label">Nuevo Estado</label>
              <select
                className="form-select"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {estadosPosibles.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            {selectedEstado === 'CANCELADO' && (
              <div className="form-group">
                <label className="form-label">Motivo (obligatorio para cancelar)</label>
                <textarea
                  className="form-textarea"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleAvanzar}
                disabled={!selectedEstado || saving}
              >
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAvanzarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PedidoDetail