
from typing import Optional, List
from sqlmodel import SQLModel, Field
from datetime import datetime


class UnidadMedidaPublic(SQLModel):
    id: int
    nombre: str
    simbolo: str
    tipo: str
    created_at: datetime


class UnidadMedidaList(SQLModel):
    data: List[UnidadMedidaPublic]
    total: int
