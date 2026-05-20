from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime, Numeric, ARRAY, Integer, SmallInteger
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.pedido.models import Pedido
    from app.modules.producto.models import Producto


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    pedido_id: int = Field(foreign_key="pedido.id", primary_key=True)
    producto_id: int = Field(foreign_key="producto.id", primary_key=True)

    cantidad: int = Field(ge=1, sa_type=SmallInteger())

    # Snapshot inmutable (RN-04) — se copian al crear el pedido
    nombre_snapshot: str = Field(max_length=200)
    precio_snapshot: float = Field(sa_type=Numeric(10, 2))
    subtotal_snap: float = Field(sa_type=Numeric(10, 2))
    personalizacion: Optional[List[int]] = Field(
        default=None, sa_type=ARRAY(Integer())
    )

    # Solo created_at — fila inmutable por diseño (RN-04)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_type=DateTime(timezone=True)
    )

    # Relaciones
    pedido: Optional["Pedido"] = Relationship(back_populates="detalles")
    producto: Optional["Producto"] = Relationship(back_populates="detalles_pedido")