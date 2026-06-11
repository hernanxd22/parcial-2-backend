import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Buscar...',
  labelKey = 'nombre',
  valueKey = 'id',
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o[valueKey] === value)

  const filtered = query.trim()
    ? options.filter((o) =>
        String(o[labelKey]).toLowerCase().includes(query.toLowerCase())
      )
    : options

  const handleSelect = (option) => {
    onChange(option[valueKey])
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={open ? query : (selected ? selected[labelKey] : '')}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            maxHeight: 200,
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px', color: '#999' }}>
              Sin resultados
            </div>
          ) : (
            filtered.map((option) => (
              <div
                key={option[valueKey]}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  backgroundColor:
                    option[valueKey] === value ? '#f0f0ff' : '#fff',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5ff')}
                onMouseLeave={(e) =>
                  (e.target.style.backgroundColor =
                    option[valueKey] === value ? '#f0f0ff' : '#fff')
                }
              >
                {option[labelKey]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
