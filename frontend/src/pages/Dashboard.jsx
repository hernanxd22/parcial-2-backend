import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPedidos, getProductos, getUsuarios } from '../api/endpoints'

function Dashboard() {
  const [stats, setStats] = useState({
    pedidos: 0,
    productos: 0,
    usuarios: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pedidosRes, productosRes, usuariosRes] = await Promise.all([
          getPedidos({ limit: 1 }),
          getProductos({ limit: 1 }),
          getUsuarios({ limit: 1 })
        ])

        setStats({
          pedidos: pedidosRes.data.total || 0,
          productos: productosRes.data.total || 0,
          usuarios: usuariosRes.data.total || 0
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Dashboard</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-title">Total Pedidos</div>
          <div className="stat-value">{stats.pedidos}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Productos</div>
          <div className="stat-value">{stats.productos}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Usuarios</div>
          <div className="stat-value">{stats.usuarios}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          Bienvenido al Panel de Administración
        </h2>

        <p style={{ color: '#666', marginTop: '10px' }}>
          Desde aquí puedes gestionar todos los recursos del sistema.
        </p>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <Link to="/usuarios" className="btn btn-primary">
            Gestionar Usuarios
          </Link>

          <Link to="/productos" className="btn btn-primary">
            Gestionar Productos
          </Link>

          <Link to="/categorias" className="btn btn-primary">
            Gestionar Categorías
          </Link>

          <Link to="/ingredientes" className="btn btn-primary">
            Gestionar Ingredientes
          </Link>

          <Link to="/pedidos" className="btn btn-primary">
            Gestionar Pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard