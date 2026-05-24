from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime


# ── DetallePedido schemas ─────────────────────────────────────────────────────

class ItemPedidoRequest(SQLModel):
    """Un ítem dentro del request de creación de pedido."""
    producto_id: int = Field(gt=0)
    cantidad: int = Field(ge=1)
    personalizacion: Optional[List[int]] = None  


class DetallePedidoPublic(SQLModel):
    pedido_id: int
    producto_id: int
    cantidad: int
    nombre_snapshot: str
    precio_snapshot: float
    subtotal_snap: float
    personalizacion: Optional[List[int]]
    created_at: datetime


# ── HistorialEstadoPedido schemas ─────────────────────────────────────────────

class HistorialEstadoPublic(SQLModel):
    id: int
    pedido_id: int
    estado_desde_codigo: Optional[str]
    estado_hacia_codigo: str
    usuario_id: Optional[int]
    motivo: Optional[str]
    created_at: datetime


# ── Pedido schemas ────────────────────────────────────────────────────────────

class PedidoCreate(SQLModel):
    usuario_id: int = Field(gt=0)
    direccion_id: Optional[int] = Field(default=None, gt=0)
    forma_pago_codigo: str
    notas: Optional[str] = None
    items: List[ItemPedidoRequest] = Field(min_length=1)


class PedidoAvanzarEstado(SQLModel):
    estado_hacia_codigo: str
    motivo: Optional[str] = None
    usuario_id: Optional[int] = None  # None = actor es el sistema/webhook


class PedidoPublic(SQLModel):
    id: int
    usuario_id: int
    direccion_id: Optional[int]
    estado_codigo: str
    forma_pago_codigo: str
    subtotal: float
    descuento: float
    costo_envio: float
    total: float
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]
    detalles: List[DetallePedidoPublic] = []
    historial: List[HistorialEstadoPublic] = []


class PedidoPublicSimple(SQLModel):
    """Para listados sin detalles ni historial."""
    id: int
    usuario_id: int
    direccion_id: Optional[int]
    estado_codigo: str
    forma_pago_codigo: str
    subtotal: float
    descuento: float
    costo_envio: float
    total: float
    notas: Optional[str]
    created_at: datetime
    updated_at: datetime


class PedidoList(SQLModel):
    data: List[PedidoPublicSimple]
    total: int


class CancelarPedidoRequest(SQLModel):
    """Request para cancelar un pedido."""
    motivo: str