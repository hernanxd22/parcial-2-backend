import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPedidos } from '../../api/endpoints'
import DataTable from '../../components/DataTable'

function PedidoList() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroUsuario, setFiltroUsuario] = useState('')

  const fetchPedidos = async () => {
    try {
      const response = await getPedidos({ limit: 100 })
      setPedidos(response.data.data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPedidos()
  }, [])

  const filteredPedidos = pedidos.filter(p => {
    const matchEstado = filtroEstado === '' ? true : p.estado_codigo === filtroEstado
    const matchUsuario = filtroUsuario === '' 
      ? true 
      : p.usuario_id.toString().includes(filtroUsuario)
    return matchEstado && matchUsuario
  })

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
  const navigate = useNavigate()
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'usuario_id', label: 'Usuario ID' },
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
        <h1>Pedidos</h1>
        <Link to="/pedidos/nuevo" className="btn btn-primary">Nuevo Pedido</Link>
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
              <option value="EN_CAMINO">EN_CAMINO</option>
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
      </div>
    </div>
  )
}

export default PedidoList