from typing import Annotated
from fastapi import APIRouter, Depends, Path, Request, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.usuario.models import Usuario
from app.modules.Pago.schemas import (
    PagoCreate, PagoPreferenciaResponse, PagoPublic, PagoList,
)
from app.modules.Pago.service import PagoService

router = APIRouter()


def get_pago_service(session: Session = Depends(get_session)) -> PagoService:
    return PagoService(session)


@router.post(
    "/preferencia",
    response_model=PagoPreferenciaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear preferencia de pago en MercadoPago",
)
def crear_preferencia(
    data: PagoCreate,
    svc: PagoService = Depends(get_pago_service),
    current_user: Usuario = Depends(get_current_user),
) -> PagoPreferenciaResponse:
    return svc.crear_preferencia(data.pedido_id, current_user.id)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Webhook de notificaciones de MercadoPago",
)
async def webhook(
    request: Request,
    svc: PagoService = Depends(get_pago_service),
) -> dict:
    payload = await request.json()
    return svc.procesar_webhook(payload)


@router.get(
    "/pedido/{pedido_id}",
    response_model=PagoPublic,
    summary="Obtener pago por ID de pedido",
)
def get_pago_por_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PagoService = Depends(get_pago_service),
    _: Usuario = Depends(get_current_user),
) -> PagoPublic:
    return svc.get_by_pedido(pedido_id)


@router.get(
    "/",
    response_model=PagoList,
    summary="Listar todos los pagos (solo ADMIN)",
)
def list_pagos(
    svc: PagoService = Depends(get_pago_service),
    _: Usuario = Depends(get_current_user),
) -> PagoList:
    return svc.get_all()