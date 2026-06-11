# Food Store — Sistema de Gestión Gastronómica

**Trabajo Práctico Integrador — Parcial 2**  
**Universidad Tecnológica Nacional — Facultad Regional Mendoza**  
**Tecnicatura Universitaria en Programación — 2026**

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el proyecto](#2-clonar-el-proyecto)
3. [Backend — FastAPI](#3-backend--fastapi)
4. [Ejecutar tests](#4-ejecutar-tests)
5. [Frontend Admin — Panel](#5-frontend-admin--panel-de-administración)
6. [Frontend Store — Tienda](#6-frontend-store--tienda-online)
7. [Usuarios de prueba](#7-usuarios-de-prueba)
8. [API Endpoints](#8-api-endpoints)
9. [Máquina de Estados (FSM)](#9-máquina-de-estados-fsm)
10. [Tecnologías y arquitectura](#10-tecnologías-y-arquitectura)

---

## 1. Requisitos previos

Instalar en este orden si no tenés nada:

| Herramienta | Versión | Link de descarga |
|---|---|---|
| **Python** | 3.10 o superior | https://www.python.org/downloads/ |
| **PostgreSQL** | 15 o superior | https://www.postgresql.org/download/ |
| **Node.js** | 18 o superior | https://nodejs.org/ (incluye npm) |
| **pnpm** | último | `npm install -g pnpm` |

Verificar que todo quede instalado:

```powershell
python --version
node --version
pnpm --version
psql --version
```

---

## 2. Clonar el proyecto

```powershell
git clone https://github.com/farfan-hernan/parcial-2-backend.git
cd parcial-2-backend
git checkout correciones
```

El proyecto tiene 3 carpetas independientes:

```
parcial-2-backend/
├── fastapi_backend/     ← API REST (Python)
├── frontend/            ← Panel admin (React)
└── frontend-store/      ← Tienda online (React + TypeScript)
```

---

## 3. Backend — FastAPI

### 3.1 Crear la base de datos

Abrí **pgAdmin** o la terminal y ejecutá:

```sql
CREATE DATABASE parcial2;
```

> Si usás **psql** desde terminal: `psql -U postgres -c "CREATE DATABASE parcial2;"`

### 3.2 Configurar variables de entorno

```powershell
cd fastapi_backend
copy .env.example .env
```

Editá el archivo `.env` con tus datos. Lo único **obligatorio** es:

```env
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/parcial2
JWT_SECRET=una_clave_segura_de_al_menos_32_caracteres_cambiar_esto
ADMIN_EMAIL=admin@foodstore.com
ADMIN_PASSWORD=Admin1234!
```

Las variables de MercadoPago, Cloudinary y WebSocket son opcionales para desarrollo local. Las funcionalidades básicas (catálogo, pedidos, auth) funcionan sin ellas.

### 3.3 Instalar dependencias

```powershell
# Crear entorno virtual
python -m venv .venv

# Activar (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Si estás en Linux/Mac:
# source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3.4 Iniciar el servidor

```powershell
uvicorn main:app --reload
```

El backend arranca en **http://localhost:8000**. Al iniciar por primera vez:

- Crea automáticamente todas las tablas
- Siembra datos de prueba: 4 roles, 5 estados, 3 formas de pago, 7 unidades de medida, 6 categorías, 39 ingredientes, 20 productos, 4 usuarios y 4 pedidos de ejemplo

Documentación Swagger: **http://localhost:8000/docs**  
Documentación ReDoc: **http://localhost:8000/redoc**

---

## 4. Ejecutar tests

Los tests usan **SQLite** — no necesitan PostgreSQL ni ninguna configuración extra.

```powershell
cd fastapi_backend

# Activar el entorno virtual si no lo está
.\.venv\Scripts\Activate.ps1

# Ejecutar todos los tests (15)
python -m pytest tests/ -v

# O por archivo individual
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_pedidos.py -v
python -m pytest tests/test_estadisticas.py -v
```

**15 tests** que cubren:

| Archivo | Qué prueba |
|---|---|
| `test_auth.py` | Registro, login (OK e inválido), /me con y sin token, email duplicado |
| `test_pedidos.py` | Crear pedido, avanzar estado (FSM válido e inválido), cancelar, historial |
| `test_estadisticas.py` | Resumen KPIs, pedidos por estado, ventas, exclusión de cancelados |

El test crea un archivo `tests/test_pizza.db` que se borra automáticamente al terminar.

---

## 5. Frontend Admin — Panel de Administración

```powershell
cd frontend
pnpm install
pnpm dev
```

Disponible en **http://localhost:3001**

**Login:** `admin@foodstore.com` / `Admin1234!` (o el que configuraste en `.env`)

Secciones: Dashboard con gráficos, Productos, Categorías, Ingredientes, Pedidos, Usuarios.

---

## 6. Frontend Store — Tienda Online

```powershell
cd frontend-store
pnpm install
pnpm dev
```

Disponible en **http://localhost:5173**

Flujo del cliente: Catálogo → Producto → Carrito → Checkout → Pago (MercadoPago) → Estado del pedido en tiempo real (WebSocket).

---

## 7. Usuarios de prueba

El seed crea automáticamente estos usuarios:

| Email | Password | Rol | Acceso |
|---|---|---|---|
| `admin@foodstore.com` | La de tu `.env` (`ADMIN_PASSWORD`) | ADMIN | Admin panel completo |
| `cliente@test.com` | `password123` | CLIENTE | Tienda online |
| `stock@test.com` | `password123` | STOCK | Productos y stock |
| `pedidos@test.com` | `password123` | PEDIDOS | Gestión de pedidos |

---

## 8. API Endpoints

Todos los endpoints usan el prefijo `/api/v1`. Los públicos no requieren autenticación.

### Auth

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Registrar nuevo usuario (rate limited: 5/15 min) |
| `POST` | `/api/v1/auth/login` | No | Login, devuelve tokens JWT (rate limited: 5/15 min) |
| `POST` | `/api/v1/auth/refresh` | No | Refrescar access token (rotación) |
| `POST` | `/api/v1/auth/logout` | JWT | Invalidar refresh token |
| `GET` | `/api/v1/auth/me` | JWT | Perfil del usuario autenticado |

### Productos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/productos/` | No | Listar (paginado, busca por nombre) |
| `GET` | `/api/v1/productos/{id}` | No | Detalle completo |
| `POST` | `/api/v1/productos/` | ADMIN, STOCK | Crear producto |
| `PUT` | `/api/v1/productos/{id}` | ADMIN | Actualización completa |
| `PATCH` | `/api/v1/productos/{id}` | ADMIN, STOCK | Actualización parcial |
| `PATCH` | `/api/v1/productos/{id}/disponibilidad` | ADMIN, STOCK | Toggle disponible |
| `PATCH` | `/api/v1/productos/{id}/imagenes` | ADMIN | Actualizar array `imagenes_url[]` |
| `POST` | `/api/v1/productos/{id}/ingredientes` | ADMIN | Asociar ingrediente al producto |
| `GET` | `/api/v1/productos/{id}/costo` | ADMIN, STOCK | Desglose de costo + precio sugerido |
| `DELETE` | `/api/v1/productos/{id}/desactivar` | ADMIN | Soft delete |

### Categorías

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/categorias/` | No | Listar categorías |
| `GET` | `/api/v1/categorias/arbol` | No | Árbol jerárquico completo |
| `POST` | `/api/v1/categorias/` | ADMIN | Crear categoría |
| `PATCH` | `/api/v1/categorias/{id}` | ADMIN | Actualizar categoría |
| `DELETE` | `/api/v1/categorias/{id}` | ADMIN | Eliminar categoría |

### Ingredientes

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/ingredientes/` | No | Listar ingredientes |
| `POST` | `/api/v1/ingredientes/` | ADMIN | Crear ingrediente |
| `PATCH` | `/api/v1/ingredientes/{id}` | ADMIN | Actualizar ingrediente |
| `DELETE` | `/api/v1/ingredientes/{id}` | ADMIN | Soft delete |

### Pedidos

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/pedidos/` | JWT | Listar (filtrado por rol) |
| `GET` | `/api/v1/pedidos/{id}` | JWT | Detalle con historial |
| `GET` | `/api/v1/pedidos/{id}/historial` | JWT | Historial de estados |
| `POST` | `/api/v1/pedidos/` | JWT | Crear pedido |
| `PATCH` | `/api/v1/pedidos/{id}/estado` | ADMIN, STOCK, PEDIDOS | Avanzar estado (FSM) |
| `PATCH` | `/api/v1/pedidos/{id}/cancelar` | JWT | Cancelar (dueño) |
| `DELETE` | `/api/v1/pedidos/{id}` | ADMIN | Soft delete |
| `WS` | `/api/v1/pedidos/ws` | JWT (`?token=`) | WebSocket tiempo real |

### Pagos (MercadoPago)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/pagos/preferencia` | JWT | Crear preferencia de pago |
| `POST` | `/api/v1/pagos/webhook` | Público | IPN de MercadoPago |
| `POST` | `/api/v1/pagos/confirm` | JWT | Confirmación manual |
| `GET` | `/api/v1/pagos/pedido/{id}` | JWT | Pago por pedido |

### Direcciones

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/direcciones/` | JWT | Listar direcciones del usuario |
| `POST` | `/api/v1/direcciones/` | JWT | Crear dirección |
| `PATCH` | `/api/v1/direcciones/{usuario_id}/{id}` | JWT | Actualizar dirección |
| `DELETE` | `/api/v1/direcciones/{usuario_id}/{id}` | JWT | Eliminar dirección |

### Uploads (Cloudinary)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/uploads/` | ADMIN, STOCK | Subir imagen (JPEG, PNG, WebP — max 5 MB) |
| `DELETE` | `/api/v1/uploads/{public_id}` | ADMIN | Eliminar imagen de Cloudinary |

### Estadísticas (ADMIN)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/estadisticas/resumen` | KPIs: ventas hoy, ticket promedio, activos, mes |
| `GET` | `/api/v1/estadisticas/ventas` | Ventas por período (day/week/month) |
| `GET` | `/api/v1/estadisticas/productos-top` | Top productos por ingresos |
| `GET` | `/api/v1/estadisticas/pedidos-por-estado` | Cantidad por estado |
| `GET` | `/api/v1/estadisticas/ingresos` | Ingresos por forma de pago |

### Usuarios

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/usuarios/` | ADMIN | Listar usuarios |
| `POST` | `/api/v1/usuarios/` | ADMIN | Crear usuario |
| `PATCH` | `/api/v1/usuarios/{id}` | ADMIN | Actualizar usuario |
| `DELETE` | `/api/v1/usuarios/{id}` | ADMIN | Desactivar (soft delete) |
| `POST` | `/api/v1/usuarios/roles` | ADMIN | Asignar rol |
| `DELETE` | `/api/v1/usuarios/{id}/roles/{codigo}` | ADMIN | Quitar rol |

### Unidades de Medida

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/unidad-medida/` | No | Catálogo de unidades |

---

## 9. Máquina de Estados (FSM)

El pedido sigue una máquina de estados finitos con 5 estados:

```
PENDIENTE ──► CONFIRMADO ──► EN_PREP ──► ENTREGADO ✓
    │              │              │
    └──────────────┴──────────────┴────► CANCELADO ✓
```

| Estado | Orden | Terminal | Transiciones válidas |
|---|---|---|---|
| `PENDIENTE` | 1 | No | → CONFIRMADO, → CANCELADO |
| `CONFIRMADO` | 2 | No | → EN_PREP, → CANCELADO |
| `EN_PREP` | 3 | No | → ENTREGADO, → CANCELADO |
| `ENTREGADO` | 4 | **Sí** | — |
| `CANCELADO` | 5 | **Sí** | — |

**Reglas de negocio:**
- Estados terminales (`ENTREGADO`, `CANCELADO`) no admiten más transiciones (HTTP 422)
- El motivo es obligatorio al cancelar
- Al confirmar (`PENDIENTE → CONFIRMADO`): se descuenta stock de ingredientes
- Al cancelar desde `CONFIRMADO`: se restaura el stock
- `HistorialEstadoPedido` es append-only — nunca se modifica ni elimina
- Los cambios de estado se notifican en tiempo real vía WebSocket

---

## 10. Tecnologías y arquitectura

### Backend

| Tecnología | Uso |
|---|---|
| **Python** + **FastAPI** | Framework REST asíncrono + WebSocket nativo |
| **SQLModel** | ORM (SQLAlchemy + Pydantic unificados) |
| **PostgreSQL** | Base de datos relacional |
| **PyJWT + Passlib (bcrypt)** | JWT (access 30 min + refresh 7 días) + hashing |
| **slowapi** | Rate limiting (5 intentos/15 min en login y register) |
| **MercadoPago SDK** | Checkout PRO + webhook IPN |
| **Cloudinary SDK** | Upload y gestión de imágenes |
| **pytest** | Tests con SQLite + TestClient |

### Arquitectura de capas

```
Router (HTTP) → Service (lógica) → UnitOfWork (transacciones) → Repository (datos) → Model (SQLModel)
                                                                                        ↓
                                                                        WebSocket Manager (broadcast post-commit)
```

### Frontend Admin

| Tecnología | Uso |
|---|---|
| **React 18** + **Vite 5** | SPA + dev server |
| **TailwindCSS v4** | Estilos utility-first |
| **React Router v6** | Enrutamiento |
| **Axios** | Cliente HTTP con interceptors JWT |
| **recharts** | Gráficos del dashboard |

### Frontend Store

| Tecnología | Uso |
|---|---|
| **React 19** + **TypeScript** + **Vite 8** | SPA tipada |
| **Zustand** | Estado global (5 stores: auth, cart, pedido, ws, filtro) |
| **TanStack React Query v5** | Fetching, caché, invalidación automática |
| **TailwindCSS v4** | Estilos |
| **Axios** | Cliente HTTP con refresh automático |

---

## Seguridad

- JWT con doble token (access 30 min + refresh 7 días con rotación)
- Cookies HttpOnly, SameSite=Lax, Secure en producción
- Rate limiting: 5 intentos fallidos cada 15 minutos en login y register
- MercadoPago: idempotency_key UUID evita cobros duplicados
- Webhook de MP valida firma `x-signature`
- Cloudinary: signed upload, API secret NUNCA expuesto al frontend
- Imágenes: validación de MIME (JPEG, PNG, WebP) y tamaño máximo 5 MB
- Soft delete en entidades principales
- Snapshots inmutables en DetallePedido

---

**UTN — Facultad Regional Mendoza**  
*Tecnicatura Universitaria en Programación — 2026*
