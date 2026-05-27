# 🍕 Food Store — Sistema de Gestión para Comercio Gastronómico

**Trabajo Práctico — Parcial 2**  
**Universidad Tecnológica Nacional — Facultad Regional Mendoza**  
**Tecnicatura Universitaria en Programación**

---

## 📋 Descripción

Sistema web integral para la administración de un comercio gastronómico. Permite gestionar productos del menú, pedidos de clientes, usuarios con control de acceso basado en roles, y ofrece tanto un panel de administración como una tienda online para clientes.

### Arquitectura

El proyecto sigue una arquitectura **cliente-servidor** con tres componentes independientes:

```
┌──────────────────────────────────────────────────────┐
│                    PostgreSQL                         │
│                  Base de datos                        │
└──────────────┬───────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────┐
│              FastAPI Backend (:8000)                  │
│  ┌─────────┐ ┌──────────┐ ┌────────────────────┐    │
│  │ Auth    │ │ CRUD     │ │ Pedidos / Estados  │    │
│  │ JWT     │ │ APIs     │ │ FSM                │    │
│  └─────────┘ └──────────┘ └────────────────────┘    │
└──────┬────────────────────────────┬──────────────────┘
       │                            │
┌──────▼──────────────┐  ┌─────────▼──────────────────┐
│  Frontend Admin     │  │  Frontend Store            │
│  (:3000)            │  │  (:5173)                   │
│                     │  │                            │
│  Panel de           │  │  Tienda online para        │
│  administración     │  │  clientes finales          │
│  (ADMIN/STOCK/      │  │  (carrito, checkout,       │
│   PEDIDOS)          │  │   pedidos)                 │
└─────────────────────┘  └────────────────────────────┘
```

---

## 🛠 Tecnologías

### Backend
| Tecnología | Uso |
|---|---|
| **Python 3.14** | Lenguaje base |
| **FastAPI** | Framework REST asíncrono |
| **SQLModel** | ORM (SQLAlchemy + Pydantic) |
| **PostgreSQL** | Base de datos relacional |
| **PyJWT** | Autenticación con JSON Web Tokens |
| **Passlib + bcrypt** | Hashing de contraseñas |
| **Alembic** | Migraciones de base de datos |
| **Python-dotenv** | Variables de entorno |

### Frontend Admin (Panel)
| Tecnología | Uso |
|---|---|
| **React 18** | Biblioteca de UI |
| **Vite 5** | Bundler y dev server |
| **TailwindCSS v4** | Estilos utilitarios |
| **React Router v6** | Enrutamiento SPA |
| **Axios** | Cliente HTTP |

### Frontend Store (Tienda)
| Tecnología | Uso |
|---|---|
| **React 19** | Biblioteca de UI |
| **TypeScript** | Tipado estático |
| **Vite 8** | Bundler y dev server |
| **Zustand** | Estado global (carrito, auth) |
| **TanStack React Query v5** | Fetching y caché de datos |
| **TailwindCSS v4** | Estilos utilitarios |

---

## 🚀 Instalación y ejecución

### 1. Requisitos previos

- **Python 3.10+**  
- **Node.js 18+**  
- **PostgreSQL 14+** (corriendo localmente o en un servidor accesible)

### 2. Clonar el repositorio

```bash
git clone <url-del-repo>
cd parcial-2-backend
```

### 3. Configurar la base de datos

Crear una base de datos PostgreSQL:

```sql
CREATE DATABASE parcial2;
```

> Las tablas se crean automáticamente al iniciar el backend por primera vez.

### 4. Backend — FastAPI

```bash
cd fastapi_backend

# Crear y activar entorno virtual (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (copiar y editar según tu configuración)
```

**Archivo `.env` requerido:**

```env
DATABASE_URL=postgresql://postgres:tu_password@localhost:5432/parcial2
JWT_SECRET=cambiar_esto_por_una_clave_segura
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

**Iniciar el servidor:**

```bash
# Con FastAPI CLI (recomendado para desarrollo)
fastapi dev main.py

# O con Uvicorn directamente
python -m uvicorn main:app --reload
```

El backend estará disponible en **http://localhost:8000**  
Documentación Swagger: **http://localhost:8000/docs**

> Al iniciar, se crean automáticamente las tablas y se siembran datos de prueba (categorías, productos, ingredientes, usuarios y pedidos de ejemplo).

### 5. Frontend Admin — Panel de Administración

```bash
cd ../frontend
npm install
npm run dev
```

Disponible en **http://localhost:3000**

### 6. Frontend Store — Tienda Online

```bash
cd ../frontend-store
npm install
npm run dev
```

Disponible en **http://localhost:5173**

---

## 👥 Roles y Permisos

El sistema implementa control de acceso basado en roles (RBAC):

| Rol | Descripción | Permisos |
|---|---|---|
| **ADMIN** | Administrador total | Acceso completo a todas las secciones |
| **STOCK** | Gestor de inventario | Dashboard, Productos (lectura/edición) |
| **PEDIDOS** | Gestor de pedidos | Dashboard, Pedidos (lectura/gestión de estado) |
| **CLIENTE** | Usuario final | Tienda online: carrito, checkout, historial de pedidos |

### Usuarios de prueba (creados automáticamente)

| Email | Password | Rol |
|---|---|---|
| `admin@admin.com` | `admin123` | ADMIN |
| `cliente@test.com` | `password123` | CLIENTE |
| `stock@test.com` | `password123` | STOCK |
| `pedidos@test.com` | `password123` | PEDIDOS |

---

## 📦 API REST — Endpoints

### Autenticación
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Iniciar sesión (devuelve cookies HttpOnly) | No |
| `POST` | `/auth/logout` | Cerrar sesión | No |
| `POST` | `/auth/refresh` | Refrescar access token | No |
| `GET` | `/auth/me` | Obtener perfil del usuario autenticado | JWT |

### Productos
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/productos/` | Listar productos | No |
| `GET` | `/productos/{id}` | Obtener producto por ID | No |
| `POST` | `/productos/` | Crear producto | ADMIN |
| `PATCH` | `/productos/{id}` | Actualizar producto | ADMIN, STOCK |
| `DELETE` | `/productos/{id}/desactivar` | Desactivar (soft delete) | ADMIN |
| `POST` | `/productos/categorias` | Asignar categoría | ADMIN |
| `POST` | `/productos/ingredientes` | Asignar ingrediente | ADMIN |

### Categorías
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/categorias/` | Listar categorías | No |
| `GET` | `/categorias/arbol` | Árbol de categorías | No |
| `POST` | `/categorias/` | Crear categoría | ADMIN |
| `PATCH` | `/categorias/{id}` | Actualizar categoría | ADMIN |
| `DELETE` | `/categorias/{id}` | Eliminar categoría | ADMIN |

### Ingredientes
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/ingredientes/` | Listar ingredientes | No |
| `POST` | `/ingredientes/` | Crear ingrediente | ADMIN |
| `PATCH` | `/ingredientes/{id}` | Actualizar ingrediente | ADMIN |
| `DELETE` | `/ingredientes/{id}` | Eliminar ingrediente | ADMIN |

### Pedidos
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/pedidos/` | Listar pedidos | ADMIN, PEDIDOS |
| `GET` | `/pedidos/{id}` | Obtener pedido (con historial si es ADMIN) | ADMIN, PEDIDOS |
| `POST` | `/pedidos/` | Crear pedido | CLIENTE, ADMIN |
| `PATCH` | `/pedidos/{id}/estado` | Avanzar estado (FSM) | ADMIN, PEDIDOS |
| `DELETE` | `/pedidos/{id}` | Cancelar pedido | ADMIN |

### Máquina de Estados de Pedidos (FSM)

```
PENDIENTE ──► CONFIRMADO ──► EN_PREPARACIÓN ──► EN_CAMINO ──► ENTREGADO
    │              │                │                │
    └──────────────┴────────────────┴────────────────┴────► CANCELADO
```

- **PENDIENTE**: Pedido creado, esperando confirmación
- **CONFIRMADO**: Pago verificado, entra en cola de producción
- **EN_PREPARACIÓN**: En cocina/producción
- **EN_CAMINO**: En reparto
- **ENTREGADO**: Estado terminal exitoso (no se puede cancelar)
- **CANCELADO**: Estado terminal por cancelación

### Usuarios
| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/usuarios/` | Listar usuarios | ADMIN |
| `GET` | `/usuarios/{id}` | Obtener usuario | ADMIN |
| `POST` | `/usuarios/` | Registrar usuario | No |
| `PATCH` | `/usuarios/{id}` | Actualizar usuario | ADMIN |
| `DELETE` | `/usuarios/{id}` | Desactivar usuario | ADMIN |
| `POST` | `/usuarios/roles` | Asignar rol | ADMIN |
| `DELETE` | `/usuarios/{id}/roles/{codigo}` | Quitar rol | ADMIN |

---

## 🗂 Estructura del proyecto

```
parcial-2-backend/
├── fastapi_backend/               # Backend — API REST
│   ├── main.py                    # Punto de entrada, startup events
│   ├── requirements.txt           # Dependencias Python
│   ├── app/
│   │   ├── core/                  # Configuración central
│   │   │   ├── database.py        # Conexión DB, engine, create_all
│   │   │   ├── security.py        # JWT, get_current_user, require_roles
│   │   │   ├── responses.py       # Wrappers de respuesta (APIResponse)
│   │   │   └── repository.py      # Repositorio genérico
│   │   ├── modules/               # Módulos del dominio
│   │   │   ├── usuario/           # Usuarios y roles
│   │   │   ├── producto/          # Productos, categorías, ingredientes
│   │   │   ├── categoria/         # Categorías (árbol)
│   │   │   ├── ingrediente/       # Ingredientes con stock
│   │   │   ├── Pedido/            # Pedidos y máquina de estados
│   │   │   ├── DetallePedido/     # Detalles de pedido (snapshots)
│   │   │   ├── DireccionEntrega/  # Direcciones de entrega
│   │   │   ├── refreshToken/      # Autenticación (login/refresh/logout)
│   │   │   ├── rol/               # Catálogo de roles + seed
│   │   │   ├── FormaPago/         # Catálogo de formas de pago + seed
│   │   │   ├── EstadoPedido/      # Catálogo de estados + seed
│   │   │   ├── unidadMedida/      # Catálogo de unidades de medida + seed
│   │   │   └── HistorialEstadoPedido/  # Trazabilidad de estados
│   │   └── seed_data.py           # Datos de prueba
│   └── tests/
│       └── test_api.http          # Pruebas de endpoints (REST Client)
├── frontend/                      # Panel de Administración
│   ├── src/
│   │   ├── api/                   # Cliente HTTP (axios + endpoints)
│   │   ├── components/            # DataTable, Modal, Layout, Skeleton
│   │   ├── context/               # AuthContext, ToastContext
│   │   ├── pages/                 # Dashboard, CRUDs, Auth
│   │   └── index.css              # Estilos globales + Tailwind
│   └── vite.config.js             # Proxy al backend
└── frontend-store/                # Tienda online para clientes
    ├── src/
    │   ├── api/                   # Cliente HTTP
    │   ├── components/            # UI components
    │   ├── pages/                 # Catálogo, carrito, checkout
    │   ├── store/                 # Zustand stores
    │   └── types/                 # Definiciones TypeScript
    └── vite.config.ts             # Proxy al backend
```

---

## 🔒 Seguridad

- **Autenticación**: JWT con doble token (access + refresh)
  - **Access Token**: 15 minutos, enviado como cookie HttpOnly (también acepta header `Authorization: Bearer`)
  - **Refresh Token**: 7 días, rotación automática (cada refresh invalida el anterior)
- **Contraseñas**: Hashing bcrypt con salt automático
- **Cookies**: HttpOnly, SameSite=Lax, Secure en producción
- **CORS**: Configurado para los orígenes de los frontends
- **RBAC**: Decorador `require_roles()` en endpoints protegidos
- **Soft Delete**: Eliminación lógica en entidades principales (productos, usuarios, categorías)
- **Snapshots**: Los detalles de pedido guardan nombre y precio al momento de la compra

---

## 🎨 Decisiones de diseño

| Decisión | Justificación |
|---|---|
| **SQLModel** sobre SQLAlchemy puro | Integración nativa con Pydantic y FastAPI, menos boilerplate |
| **Cookies HttpOnly** sobre localStorage | Previene acceso XSS a los tokens; más seguro |
| **Dual token (access + refresh)** | Permite sesiones largas con rotación segura de tokens |
| **Máquina de estados FSM** para pedidos | Transiciones controladas, evita estados inválidos |
| **Soft delete** en entidades principales | Trazabilidad y recuperación de datos |
| **Snapshots en DetallePedido** | Inmutabilidad histórica: cambios de precio no afectan pedidos pasados |
| **Doble frontend** (admin + store) | Separación de responsabilidades; públicos distintos |
| **TailwindCSS v4** | Estilos consistentes con diseño utility-first |
| **Zustand + React Query** (store) | Estado global simple + fetching declarativo con caché |

---

## 👤 Autor(es)

Hernan Farfan
Fabricio Fracapani
Martin Lepez
Nicolas Romano

---

## 📄 Licencia

Este proyecto es un trabajo académico para la UTN FRM. Uso exclusivamente educativo.

---

**UTN — Facultad Regional Mendoza**  
*Tecnicatura Universitaria en Programación — 2026*
