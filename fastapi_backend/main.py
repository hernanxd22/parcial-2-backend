from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, create_db_and_tables
from sqlmodel import Session, select
import os 

from app.modules.unidadMedida.models import UnidadMedida
from app.modules.rol.models import Rol         
from app.modules.usuario.models import Usuario, UsuarioRol 
from app.modules.refreshToken.models import RefreshToken
from app.modules.FormaPago.models import FormaPago 
from app.modules.EstadoPedido.models import EstadoPedido 
from app.modules.DetallePedido.models import DetallePedido
from app.modules.DireccionEntrega.models import DireccionEntrega  
from app.modules.Pedido.models import Pedido

from app.modules.producto.router import router as producto_router
from app.modules.categoria.router import router as categoria_router
from app.modules.ingrediente.router import router as ingrediente_router
from app.modules.usuario.router import router as usuario_router
from app.modules.DireccionEntrega.router import router as direccion_router
from app.modules.Pedido.router import router as pedido_router
from app.modules.refreshToken.router import router as auth_router
from app.modules.unidadMedida.router import router as unidad_medida_router

from app.modules.rol.seed import seed_roles
from app.modules.FormaPago.seed import seed_formas_pago
from app.modules.EstadoPedido.seed import seed_estados_pedido
from app.modules.unidadMedida.seed import seed_unidades_medida
from app.modules.usuario.service import hash_password

def create_app() -> FastAPI:
    app = FastAPI(
        title="Parcial 2",
        description="API REST ",
        version="1.0.0"
    )

    origins = ["http://localhost:3000", "http://localhost:5173"]

    if os.getenv("ENVIRONMENT") != "development":
        origins = [os.getenv("FRONTEND_URL")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.on_event("startup")
    def on_startup():
        create_db_and_tables()

        with Session(engine) as session:
            seed_roles(session)
            seed_formas_pago(session)
            seed_estados_pedido(session)
            seed_unidades_medida(session)

  
            admin_email = os.getenv("ADMIN_EMAIL")
            admin_password = os.getenv("ADMIN_PASSWORD")
            if not admin_email or not admin_password:
                raise ValueError("ADMIN_EMAIL y ADMIN_PASSWORD deben estar en el .env")

            existing = session.exec(
                select(Usuario).where(Usuario.email == admin_email)
            ).first()
            if not existing:
                admin = Usuario(
                    nombre="Admin",
                    apellido="Sistema",
                    email=admin_email,
                    password_hash=hash_password(admin_password),
                )
                session.add(admin)
                session.flush()
                admin_rol = UsuarioRol(
                    usuario_id=admin.id,
                    rol_codigo="ADMIN",
                )
                session.add(admin_rol)
                session.commit()

    app.include_router(producto_router, prefix="/productos", tags=["Productos"])
    app.include_router(categoria_router, prefix="/categorias", tags=["Categorias"])
    app.include_router(ingrediente_router, prefix="/ingredientes", tags=["Ingredientes"])
    app.include_router(usuario_router, prefix="/usuarios", tags=["Usuarios"])
    app.include_router(direccion_router, prefix="/direcciones", tags=["Direcciones"])
    app.include_router(pedido_router, prefix="/pedidos", tags=["Pedidos"])
    app.include_router(unidad_medida_router, prefix="/unidad-medida", tags=["Unidad Medida"])
    app.include_router(auth_router, prefix="", tags=["Auth"])
    
    @app.get("/")
    def root():
        return {"message": "Servidor FastAPI funcionando ."}

    return app


app = create_app()