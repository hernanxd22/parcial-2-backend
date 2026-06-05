from typing import Optional, List
from sqlmodel import SQLModel, Field
from decimal import Decimal
from datetime import datetime


class PagoCreate(SQLModel):
    pedido_id: int


class PagoPreferenciaResponse(SQLModel):
    preference_id: str
    init_point: str
    public_key: str


class PagoWebhookPayload(SQLModel):
    type: str
    data: dict


class PagoPublic(SQLModel):
    id: int
    pedido_id: int
    mp_payment_id: Optional[int] = None
    mp_status: str
    mp_status_detail: Optional[str] = None
    external_reference: str
    transaction_amount: Decimal
    payment_method_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PagoList(SQLModel):
    data: List[PagoPublic]
    total: int