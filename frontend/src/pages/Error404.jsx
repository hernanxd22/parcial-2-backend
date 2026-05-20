import { Link } from 'react-router-dom'

function Error404() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1 style={{ fontSize: '4rem', color: '#1F3864' }}>404</h1>
      <h2>Página no encontrada</h2>
      <p style={{ color: '#666', marginTop: '20px' }}>
        La página que buscas no existe o ha sido movida.
      </p>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '30px' }}>
        Volver al Inicio
      </Link>
    </div>
  )
}

export default Error404