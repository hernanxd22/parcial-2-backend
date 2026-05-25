from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import String, ARRAY, DateTime
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.modules.producto.models import Producto
    from app.modules.producto.models import Producto, ProductoIngrediente
    from app.modules.ingrediente.models import Ingrediente


class UnidadMedida(SQLModel, table=True):
    __tablename__ = "unidad_medida"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=50, unique=True)
    simbolo: str = Field(max_length=10, unique=True)
    tipo: str = Field(max_length=20)


    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=DateTime(timezone=True)
    )

    productos: List["Producto"] = Relationship(back_populates="unidad_venta")
    producto_ingredientes: List["ProductoIngrediente"] = Relationship(back_populates="unidad_medida")
    ingredientes: List["Ingrediente"] = Relationship(back_populates="unidad_medida")
