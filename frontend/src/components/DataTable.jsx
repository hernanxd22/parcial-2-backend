function DataTable({ 
  data, 
  columns, 
  onEdit, 
  onDelete,
  loading,
  emptyMessage = 'No hay datos'
}) {
  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!data || data.length === 0) {
    return <div className="empty">{emptyMessage}</div>
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {(onEdit || onDelete) && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="table-actions">
                  {onEdit && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onEdit(item)}
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(item)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable