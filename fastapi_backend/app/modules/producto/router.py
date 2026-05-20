
from typing import Annotated
from fastapi import APIRouter, Depends, Query, Path, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.producto.schemas import (
    ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList,
    ProductoCategoriaCreate, ProductoCategoriaPublic, ProductoCategoriaList,
    ProductoIngredienteCreate, ProductoIngredientePublic, ProductoIngredienteList,
)
from app.modules.producto.service import ProductoService

router = APIRouter()


def get_producto_service(session: Session = Depends(get_session)) -> ProductoService:
    return ProductoService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery  = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un producto",
)
def create_producto(
    data: ProductoCreate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=ProductoList,
    summary="Listar productos (paginado)",
)
def list_productos(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/categorias",
    response_model=ProductoCategoriaList,
    summary="Listar todas las relaciones producto-categoría",
)
def list_relaciones_categoria(
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoCategoriaList:
    return svc.get_all_relaciones()


@router.post(
    "/categorias",
    response_model=ProductoCategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Asignar una categoría a un producto",
)
def create_relacion_categoria(
    data: ProductoCategoriaCreate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoCategoriaPublic:
    return svc.create_relacion(data)


@router.delete(
    "/categorias/{producto_id}/{categoria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar relación producto ↔ categoría",
)
def delete_relacion_categoria(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    svc: ProductoService = Depends(get_producto_service),
) -> None:
    svc.delete_relacion(producto_id, categoria_id)


@router.get(
    "/ingredientes",
    response_model=ProductoIngredienteList,
    summary="Listar todas las relaciones producto-ingrediente",
)
def list_relaciones_ingrediente(
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoIngredienteList:
    return svc.get_all_relaciones_ingrediente()


@router.post(
    "/ingredientes",
    response_model=ProductoIngredientePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Asignar un ingrediente a un producto",
)
def create_relacion_ingrediente(
    data: ProductoIngredienteCreate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoIngredientePublic:
    return svc.create_relacion_ingrediente(data)


@router.delete(
    "/ingredientes/{producto_id}/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar relación producto ↔ ingrediente",
)
def delete_relacion_ingrediente(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    ingrediente_id: Annotated[int, Path(gt=0, description="ID del ingrediente")],
    svc: ProductoService = Depends(get_producto_service),
) -> None:
    svc.delete_relacion_ingrediente(producto_id, ingrediente_id)


@router.get(
    "/categoria/{categoria_id}",
    response_model=ProductoList,
    summary="Listar productos de una categoría",
)
def list_por_categoria(
    categoria_id: Annotated[int, Path(gt=0, description="ID de la categoría")],
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoList:
    return svc.get_by_categoria(categoria_id, offset=offset, limit=limit)


@router.get(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Obtener producto por ID",
)
def get_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.get_by_id(producto_id)


@router.patch(
    "/{producto_id}",
    response_model=ProductoPublic,
    summary="Actualización parcial de producto",
)
def update_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_producto_service),
) -> ProductoPublic:
    return svc.update(producto_id, data)


@router.delete(
    "/{producto_id}/desactivar",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de producto",
)
def soft_delete_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
) -> None:
    svc.soft_delete(producto_id)


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar producto físicamente",
)
def hard_delete_producto(
    producto_id: Annotated[int, Path(gt=0, description="ID del producto")],
    svc: ProductoService = Depends(get_producto_service),
) -> None:
    svc.hard_delete(producto_id)