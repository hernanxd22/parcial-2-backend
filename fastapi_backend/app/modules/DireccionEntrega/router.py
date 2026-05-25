from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user, require_roles
from app.modules.usuario.models import Usuario, UsuarioRol
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
    current_user: Usuario = Depends(get_current_user),
) -> DireccionEntregaPublic:
    if data.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear direcciones para otro usuario",
        )
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
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DireccionEntregaList:
    if current_user.id != usuario_id:
        stmt = session.exec(
            select(UsuarioRol).where(UsuarioRol.usuario_id == current_user.id)
        ).all()
        roles = [ur.rol_codigo for ur in stmt] if stmt else ["CLIENTE"]
        if "ADMIN" not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes ver direcciones de otro usuario",
            )
    return svc.get_all_by_usuario(usuario_id, offset, limit)


@router.get(
    "/{direccion_id}",
    response_model=DireccionEntregaPublic,
    summary="Obtener dirección por ID",
)
def get_direccion(
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    svc: DireccionEntregaService = Depends(get_direccion_service),
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> DireccionEntregaPublic:
    direccion = svc.get_by_id(direccion_id)
    if direccion.usuario_id != current_user.id:
        stmt = session.exec(
            select(UsuarioRol).where(UsuarioRol.usuario_id == current_user.id)
        ).all()
        roles = [ur.rol_codigo for ur in stmt] if stmt else ["CLIENTE"]
        if "ADMIN" not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes ver direcciones de otro usuario",
            )
    return direccion


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
    current_user: Usuario = Depends(get_current_user),
) -> DireccionEntregaPublic:
    if current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes modificar direcciones de otro usuario",
        )
    return svc.update(usuario_id, direccion_id, data)


@router.patch(
    "/{direccion_id}/principal",
    response_model=DireccionEntregaPublic,
    summary="Marcar dirección como principal",
)
def set_principal(
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    svc: DireccionEntregaService = Depends(get_direccion_service),
    current_user: Usuario = Depends(get_current_user),
) -> DireccionEntregaPublic:
    return svc.set_principal(direccion_id, current_user.id)


@router.delete(
    "/{usuario_id}/{direccion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar dirección de entrega (soft delete)",
)
def delete_direccion(
    usuario_id: Annotated[int, Path(gt=0, description="ID del usuario")],
    direccion_id: Annotated[int, Path(gt=0, description="ID de la dirección")],
    svc: DireccionEntregaService = Depends(get_direccion_service),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    if current_user.id != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar direcciones de otro usuario",
        )
    svc.soft_delete(usuario_id, direccion_id)