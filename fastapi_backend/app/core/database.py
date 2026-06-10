import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, SQLModel
from sqlalchemy import text

load_dotenv()

from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.rol.models import Rol
from app.modules.auth.models import RefreshToken
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

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("ENVIRONMENT") != "production",
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    _apply_migrations()


def _apply_migrations():
    with engine.begin() as conn:
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='ingrediente' AND column_name='costo'
                ) THEN
                    ALTER TABLE ingrediente ADD COLUMN costo FLOAT DEFAULT 0 NOT NULL;
                END IF;
            END $$;
        """))


def get_session():
    with Session(engine) as session:
        yield session           