import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPedidos } from '../../api/endpoints'
import { useToast } from '../../context/ToastContext'
import DataTable from '../../components/DataTable'
import Pagination from '../../components/Pagination'
import { useWebSocket } from '../../hooks/useWebSocket'

const PAGE_SIZE = 12

function PedidoList() {
  const toast = useToast()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchPedidos = async (pageNum = 1) => {
    try {
      setLoading(true)
      const offset = (pageNum - 1) * PAGE_SIZE
      const params = { offset, limit: PAGE_SIZE }
      if (filtroUsuario) params.usuario_id = parseInt(filtroUsuario)
      const response = await getPedidos(params)
      setPedidos(response.data.data || [])
      setTotal(response.data.total || 0)
      setTotalPages(Math.ceil((response.data.total || 0) / PAGE_SIZE))
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos(page)
  }, [])

  useEffect(() => {
    setPage(1)
    fetchPedidos(1)
  }, [filtroUsuario])

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchPedidos(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filteredPedidos = pedidos.filter(p => {
    const matchEstado = filtroEstado === '' ? true : p.estado_codigo === filtroEstado
    return matchEstado
  })

  const getEstadoBadge = (estado) => {
    const colors = {
      'PENDIENTE': 'badge-warning',
      'CONFIRMADO': 'badge-info',
      'EN_PREP': 'badge-info',
      'ENTREGADO': 'badge-success',
      'CANCELADO': 'badge-danger'
    }
    return colors[estado] || 'badge-info'
  }

  const navigate = useNavigate()

  const fetchPedidosRef = useRef(fetchPedidos)
  fetchPedidosRef.current = fetchPedidos
  const pageRef = useRef(page)
  pageRef.current = page

  const handleWsMessage = useCallback((msg) => {
    if (msg.event === "WS_CONNECTED") {
      fetchPedidosRef.current(pageRef.current)
      return
    }
    const d = msg.data
    if (msg.event === "estado_cambiado") {
      if (d.estado_anterior === null) {
        fetchPedidosRef.current(pageRef.current)
      } else {
        setPedidos(prev => prev.map(p => p.id === d.pedido_id ? { ...p, estado_codigo: d.estado_nuevo } : p))
      }
      return
    }
    if (msg.event === "pedido_cancelado") {
      setPedidos(prev => prev.map(p => p.id === d.pedido_id ? { ...p, estado_codigo: d.estado_nuevo } : p))
      toast?.info(`Pedido #${d.pedido_id} cancelado`)
      return
    }
  }, [toast])

  const { connected } = useWebSocket({ onMessage: handleWsMessage, enabled: true })

  const columns = [
    { key: 'usuario_nombre', label: 'Cliente' },
    {
      key: 'estado_codigo',
      label: 'Estado',
      render: (val) => (
        <span className={`badge ${getEstadoBadge(val)}`}>
          {val}
        </span>
      )
    },
    { key: 'forma_pago_codigo', label: 'Forma de Pago' },
    {
      key: 'total',
      label: 'Total',
      render: (val) => `$${val}`
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (val) => new Date(val).toLocaleDateString()
    }
  ]

  return (
    <div>
      <div className="card-header">
        <div className="flex items-center gap-3">
          <h1 className="card-title">Pedidos</h1>
          {!loading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
              {filteredPedidos.length} de {total}
            </span>
          )}
          {connected && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              En vivo
            </span>
          )}
        </div>
        <Link to="/pedidos/nuevo" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Pedido
        </Link>
      </div>

      <div className="card">
        <div className="filtros">
          <div className="filtro-group">
            <label className="filtro-label">Estado</label>
            <select
              className="filtro-input"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="CONFIRMADO">CONFIRMADO</option>
              <option value="EN_PREP">EN_PREP</option>
              <option value="ENTREGADO">ENTREGADO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Usuario ID</label>
            <input
              type="text"
              className="filtro-input"
              placeholder="Buscar por ID..."
              value={filtroUsuario}
              onChange={(e) => setFiltroUsuario(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          data={filteredPedidos}
          columns={columns}
          onEdit={(p) => navigate(`/pedidos/${p.id}`)}
          loading={loading}
          emptyMessage="No hay pedidos"
        />

        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  )
}

export default PedidoList