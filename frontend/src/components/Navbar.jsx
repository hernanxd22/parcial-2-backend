import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const roleBadgeColors = {
  ADMIN: 'bg-purple-100 text-purple-800',
  STOCK: 'bg-blue-100 text-blue-800',
  PEDIDOS: 'bg-green-100 text-green-800',
}

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const role = user?.rol || ''
  const badgeColor = roleBadgeColors[role] || 'bg-gray-100 text-gray-800'

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Food Store</Link>
      </div>

      <div className="navbar-menu">
        <Link to="/" className="navbar-link">Dashboard</Link>

        {role === 'ADMIN' && (
          <Link to="/usuarios" className="navbar-link">Usuarios</Link>
        )}

        {(role === 'ADMIN' || role === 'STOCK') && (
          <Link to="/productos" className="navbar-link">Productos</Link>
        )}

        {role === 'ADMIN' && (
          <Link to="/categorias" className="navbar-link">Categorías</Link>
        )}

        {role === 'ADMIN' && (
          <Link to="/ingredientes" className="navbar-link">Ingredientes</Link>
        )}

        {(role === 'ADMIN' || role === 'PEDIDOS') && (
          <Link to="/pedidos" className="navbar-link">Pedidos</Link>
        )}
      </div>

      <div className="navbar-user">
        <span>{user?.email}</span>
        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
          {role}
        </span>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

export default Navbar