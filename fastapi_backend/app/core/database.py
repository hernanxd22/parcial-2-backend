import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, SQLModel

load_dotenv()

# Importar TODOS los modelos para que se creen las tablas
from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.rol.models import Rol
from app.modules.refreshToken.models import RefreshToken
from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.categoria.models import Categoria
from app.modules.ingrediente.models import Ingrediente
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.DireccionEntrega.models import DireccionEntrega
from app.modules.FormaPago.models import FormaPago
from app.modules.EstadoPedido.models import EstadoPedido
from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:Nicolasxd22@localhost:5432/gestor_productos_tp4"
)

engine = create_engine("postgresql://postgres:Nicolasxd22@localhost:5432/gestor_productos_tp4", echo=True)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session