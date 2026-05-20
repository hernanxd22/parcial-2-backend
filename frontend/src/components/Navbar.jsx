import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Food Store</Link>
      </div>
      
      <div className="navbar-menu">
        <Link to="/" className="navbar-link">Dashboard</Link>
        <Link to="/usuarios" className="navbar-link">Usuarios</Link>
        <Link to="/productos" className="navbar-link">Productos</Link>
        <Link to="/categorias" className="navbar-link">Categorías</Link>
        <Link to="/ingredientes" className="navbar-link">Ingredientes</Link>
        <Link to="/pedidos" className="navbar-link">Pedidos</Link>
      </div>

      <div className="navbar-user">
        <span>{user?.email}</span>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

export default Navbar