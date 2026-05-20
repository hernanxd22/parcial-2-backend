
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.categoria.schemas import (
    CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
)
from app.modules.categoria.service import CategoriaService

router = APIRouter()


def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    return CategoriaService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery  = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]



@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una categoría",
)
def create_categoria(
    data: CategoriaCreate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=CategoriaList,
    summary="Listar categorías activas (paginado)",
)
def list_categorias(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/padre/{parent_id}",
    response_model=CategoriaList,
    summary="Listar subcategorías de una categoría padre",
)
def list_by_parent(
    parent_id: Annotated[int, Path(gt=0, description="ID de la categoría padre")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaList:
    return svc.get_by_parent(parent_id, offset=offset, limit=limit)


@router.get(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Obtener categoría por ID",
)
def get_categoria(
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    return svc.get_by_id(categoria_id)


@router.patch(
    "/{categoria_id}",
    response_model=CategoriaPublic,
    summary="Actualización parcial de categoría",
)
def update_categoria(
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_categoria_service),
) -> CategoriaPublic:
    return svc.update(categoria_id, data)


@router.delete(
    "/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de categoría",
)
def delete_categoria(
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    svc: CategoriaService = Depends(get_categoria_service),
) -> None:
    svc.soft_delete(categoria_id)
