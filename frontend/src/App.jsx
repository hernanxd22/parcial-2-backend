import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import UsuarioList from './pages/usuarios/UsuarioList'
import UsuarioForm from './pages/usuarios/UsuarioForm'
import ProductoList from './pages/productos/ProductoList'
import ProductoForm from './pages/productos/ProductoForm'
import CategoriaList from './pages/categorias/CategoriaList'
import CategoriaForm from './pages/categorias/CategoriaForm'
import IngredienteList from './pages/ingredientes/IngredienteList'
import IngredienteForm from './pages/ingredientes/IngredienteForm'
import PedidoList from './pages/pedidos/PedidoList'
import PedidoDetail from './pages/pedidos/PedidoDetail'
import PedidoCreate from './pages/pedidos/PedidoCreate'
import Error404 from './pages/Error404'
import Navbar from './components/Navbar'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()

  console.log("USER:", user)
  console.log("ROLES NECESARIOS:", roles)

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (roles && user) {
    const hasRole = roles.includes(user.rol)
    console.log("ROL USER:", user.rol)
    console.log("HAS ROLE:", hasRole)

    if (!hasRole) {
      return <Navigate to="/" />
    }
  }

  return children
}
function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="app">
      {isAuthenticated && <Navbar />}
      <div className="container">
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Usuarios */}
          <Route path="/usuarios" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsuarioList />
            </ProtectedRoute>
          } />
          <Route path="/usuarios/nuevo" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsuarioForm />
            </ProtectedRoute>
          } />
          <Route path="/usuarios/:id/editar" element={
            <ProtectedRoute roles={['ADMIN']}>
              <UsuarioForm />
            </ProtectedRoute>
          } />
          
          {/* Productos */}
          <Route path="/productos" element={
            <ProtectedRoute>
              <ProductoList />
            </ProtectedRoute>
          } />
          <Route path="/productos/nuevo" element={
            <ProtectedRoute roles={['ADMIN', 'STOCK']}>
              <ProductoForm />
            </ProtectedRoute>
          } />
          <Route path="/productos/:id/editar" element={
            <ProtectedRoute roles={['ADMIN', 'STOCK']}>
              <ProductoForm />
            </ProtectedRoute>
          } />
          
          {/* Categorías */}
          <Route path="/categorias" element={
            <ProtectedRoute>
              <CategoriaList />
            </ProtectedRoute>
          } />
          <Route path="/categorias/nueva" element={
            <ProtectedRoute roles={['ADMIN']}>
              <CategoriaForm />
            </ProtectedRoute>
          } />
          <Route path="/categorias/:id/editar" element={
            <ProtectedRoute roles={['ADMIN']}>
              <CategoriaForm />
            </ProtectedRoute>
          } />
          
          {/* Ingredientes */}
          <Route path="/ingredientes" element={
            <ProtectedRoute>
              <IngredienteList />
            </ProtectedRoute>
          } />
          <Route path="/ingredientes/nuevo" element={
            <ProtectedRoute roles={['ADMIN']}>
              <IngredienteForm />
            </ProtectedRoute>
          } />
          <Route path="/ingredientes/:id/editar" element={
            <ProtectedRoute roles={['ADMIN']}>
              <IngredienteForm />
            </ProtectedRoute>
          } />
          
          {/* Pedidos */}
          <Route path="/pedidos" element={
            <ProtectedRoute>
              <PedidoList />
            </ProtectedRoute>
          } />
          <Route path="/pedidos/nuevo" element={
            <ProtectedRoute>
              <PedidoCreate />
            </ProtectedRoute>
          } />
          <Route path="/pedidos/:id" element={
            <ProtectedRoute>
              <PedidoDetail />
            </ProtectedRoute>
          } />
          
          {/* 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </div>
  )
}

export default App