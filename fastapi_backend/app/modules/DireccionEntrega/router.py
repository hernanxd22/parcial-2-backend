from typing import Annotated
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.DireccionEntrega.schemas import (
    DireccionEntregaCreate,
    DireccionEntregaPublic,
    DireccionEntregaUpdate,
    DireccionEntregaList,
)
from app.modules.DireccionEntrega.service import DireccionEntregaService

router = APIRouter()


def get_direccion_service(
    session: Session = Depends(get_session),
) -> DireccionEntregaService:
    return DireccionEntregaService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=DireccionEntregaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear dirección de entrega",
)
def create_direccion(
    data: DireccionEntregaCreate,
    svc: DireccionEntregaService = Depends(get_direccion_service),
) -> DireccionEntregaPublic:
    return svc.create(data)


@router.get(
    "/usuario/{usuario_id}",
    response_model=DireccionEntregaList,
    summary="Listar direcciones de un usuario",
)
def list_direcciones_by_usuario(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: DireccionEntregaService = Depends(get_direccion_service),
) -> DireccionEntregaList:
    return svc.get_all_by_usuario(usuario_id, offset, limit)


@router.get(
    "/{direccion_id}",
    response_model=DireccionEntregaPublic,
    summary="Obtener dirección por ID",
)
def get_direccion(
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    svc: DireccionEntregaService = Depends(get_direccion_service),
) -> DireccionEntregaPublic:
    return svc.get_by_id(direccion_id)


@router.patch(
    "/{usuario_id}/{direccion_id}",
    response_model=DireccionEntregaPublic,
    summary="Actualizar dirección de entrega",
)
def update_direccion(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    data: DireccionEntregaUpdate,
    svc: DireccionEntregaService = Depends(get_direccion_service),
) -> DireccionEntregaPublic:
    return svc.update(usuario_id, direccion_id, data)


@router.delete(
    "/{usuario_id}/{direccion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar dirección de entrega (soft delete)",
)
def delete_direccion(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    svc: DireccionEntregaService = Depends(get_direccion_service),
) -> None:
    svc.soft_delete(usuario_id, direccion_id)