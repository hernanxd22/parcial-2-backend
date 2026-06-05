from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.usuario.models import Usuario, UsuarioRol
from app.modules.Pedido.schemas import (
    PedidoCreate,
    PedidoPublic,
    PedidoAvanzarEstado,
    PedidoList,
    CancelarPedidoRequest,
    PedidoEstadoPedido,
    PedidoEstadoList,
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
    current_user: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    if data.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear pedidos para otro usuario",
        )
    return svc.create(data)


@router.get(
    "/",
    response_model=PedidoList,
    summary="Listar pedidos (con filtro por rol)",
)
def list_pedidos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    usuario_filter: Annotated[Optional[int], Query(alias="usuario_id", ge=1, description="Filtrar por usuario (solo ADMIN/PEDIDOS)")] = None,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PedidoList:

    stmt = select(UsuarioRol).where(UsuarioRol.usuario_id == current_user.id)
    roles = session.exec(stmt).all()
    role_codes = [ur.rol_codigo for ur in roles] if roles else ["CLIENTE"]

    if "ADMIN" in role_codes or "PEDIDOS" in role_codes:
        return svc.get_all(offset, limit, usuario_id=usuario_filter)
    else:
        return svc.get_all(offset, limit, usuario_id=current_user.id)


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
    _: Usuario = Depends(require_roles("ADMIN")),
) -> PedidoList:
    return svc.get_by_usuario(usuario_id, offset, limit)


@router.get(
    "/mi-estado",
    response_model=PedidoEstadoList,
    summary="Ver estado de mis pedidos (frontend-store)",
)
def ver_estado_mis_pedidos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 12,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoEstadoList:
    return svc.get_estado_pedidos(current_user.id, offset=offset, limit=limit)


@router.get(
    "/{pedido_id}",
    response_model=PedidoPublic,
    summary="Obtener pedido por ID (con detalles e historial)",
)
def get_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    return svc.get_by_id(pedido_id)


@router.patch(
    "/{pedido_id}/cancelar",
    response_model=PedidoPublic,
    summary="Cancelar pedido (CLIENTE dueño)",
)
def cancelar_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    data: CancelarPedidoRequest,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(get_current_user),
) -> PedidoPublic:
    return svc.cancelar(pedido_id, current_user.id, data.motivo)


@router.patch(
    "/{pedido_id}/estado",
    response_model=PedidoPublic,
    summary="Avanzar estado del pedido (FSM)",
)
def avanzar_estado(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    data: PedidoAvanzarEstado,
    svc: PedidoService = Depends(get_pedido_service),
    current_user: Usuario = Depends(require_roles("ADMIN", "STOCK", "PEDIDOS")),
) -> PedidoPublic:
    data.usuario_id = current_user.id
    return svc.avanzar_estado(pedido_id, data)


@router.delete(
    "/{pedido_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar pedido (soft delete)",
)
def delete_pedido(
    pedido_id: Annotated[int, Path(gt=0, description="ID del pedido")],
    svc: PedidoService = Depends(get_pedido_service),
    _: Usuario = Depends(require_roles("ADMIN")),
) -> None:
    svc.soft_delete(pedido_id)