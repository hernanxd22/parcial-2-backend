from typing import Annotated
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.Pedido.schemas import (
    PedidoCreate,
    PedidoPublic,
    PedidoAvanzarEstado,
    PedidoList,
)
from app.modules.Pedido.service import PedidoService

router = APIRouter()


def get_pedido_service(session: Session = Depends(get_session),) -> PedidoService:
    return PedidoService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=PedidoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear pedido",
)
def create_pedido(
    data: PedidoCreate,
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=PedidoList,
    summary="Listar todos los pedidos",
)
def list_pedidos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
    return svc.get_all(offset, limit)


@router.get(
    "/usuario/{usuario_id}",
    response_model=PedidoList,
    summary="Listar pedidos de un usuario",
)
def list_pedidos_by_usuario(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
    return svc.get_by_usuario(usuario_id, offset, limit)


@router.get(
    "/{pedido_id}",
    response_model=PedidoPublic,
    summary="Obtener pedido por ID (con detalles e historial)",
)
def get_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
    return svc.get_by_id(pedido_id)


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoPublic,
    summary="Avanzar estado del pedido (FSM)",
)
def avanzar_estado(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    data: PedidoAvanzarEstado,
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
    return svc.avanzar_estado(pedido_id, data)


@router.delete(
    "/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar pedido (soft delete)",
)
def delete_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
) -> None:
    svc.soft_delete(pedido_id)