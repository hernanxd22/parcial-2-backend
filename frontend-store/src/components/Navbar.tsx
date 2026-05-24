import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useCartStore } from '../store/useCartStore'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const cartCount = useCartStore((state) => state.items.length)
  const navigate = useNavigate()

  const isClient = user?.roles?.includes('CLIENTE')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-orange-600">Food Store</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-orange-600 transition-colors">
              Inicio
            </Link>

            <Link to="/carrito" className="relative text-gray-700 hover:text-orange-600 transition-colors">
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated && isClient && (
              <Link
                to="/mis-pedidos"
                className="text-gray-700 hover:text-orange-600 transition-colors"
              >
                Mis Pedidos
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {user?.nombre} {user?.apellido}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
