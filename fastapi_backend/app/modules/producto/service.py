from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone

from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente
from app.modules.producto.schemas import (
    ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList,
    ProductoCategoriaPublic, ProductoCategoriaList,
    ProductoIngredientePublic, ProductoIngredienteList,
)
from app.modules.producto.unit_of_work import ProductoUnitOfWork


def _now() -> datetime:
    return datetime.now(timezone.utc)


class ProductoService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        return producto

    def _to_public(self, producto: Producto) -> ProductoPublic:
        result = ProductoPublic.model_validate(producto)
        result.categoria_id = (
            producto.producto_categorias[0].categoria_id
            if producto.producto_categorias
            else None
        )
        result.es_principal = (
            producto.producto_categorias[0].es_principal
            if producto.producto_categorias
            else False
        )
        return result

    def _get_relacion_categoria_or_404(
        self, uow: ProductoUnitOfWork, producto_id: int, categoria_id: int
    ) -> ProductoCategoria:
        relacion = uow.producto_categorias.get_by_pk(producto_id, categoria_id)
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relación entre producto id={producto_id} y categoría id={categoria_id} no encontrada",
            )
        return relacion

    def _get_relacion_ingrediente_or_404(
        self, uow: ProductoUnitOfWork, producto_id: int, ingrediente_id: int
    ) -> ProductoIngrediente:
        relacion = uow.producto_ingredientes.get_by_pk(producto_id, ingrediente_id)
        if not relacion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Relación entre producto id={producto_id} e ingrediente id={ingrediente_id} no encontrada",
            )
        return relacion

    def create(self, data: ProductoCreate) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            from app.modules.categoria.models import Categoria
            categoria = uow.productos.session.get(Categoria, data.categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Categoría con id={data.categoria_id} no encontrada",
                )

            create_data = data.model_dump(exclude={"categoria_id", "es_principal", "ingredientes"})
            producto = Producto.model_validate(create_data)
            uow.productos.add(producto)

            from app.modules.producto.models import ProductoCategoria
            relacion_cat = ProductoCategoria(
                producto_id=producto.id,
                categoria_id=data.categoria_id,
                es_principal=data.es_principal,
            )
            uow.producto_categorias.add(relacion_cat)

            from app.modules.producto.models import ProductoIngrediente
            for ing_data in data.ingredientes:
                from app.modules.ingrediente.models import Ingrediente
                ingrediente = uow.productos.session.get(Ingrediente, ing_data.ingrediente_id)
                if not ingrediente:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Ingrediente con id={ing_data.ingrediente_id} no encontrada",
                    )

                um_id = ing_data.unidad_medida_id or ingrediente.unidad_medida_id
                if um_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"El ingrediente '{ingrediente.nombre}' no tiene unidad de medida asignada",
                    )

                relacion_ing = ProductoIngrediente(
                    producto_id=producto.id,
                    ingrediente_id=ing_data.ingrediente_id,
                    es_removible=ing_data.es_removible,
                    cantidad=ing_data.cantidad,
                    unidad_medida_id=um_id,
                )
                uow.producto_ingredientes.add(relacion_ing)

            result = self._to_public(producto)
        return result

    def get_all(self, offset: int = 0, limit: int = 20) -> ProductoList:
        with ProductoUnitOfWork(self._session) as uow:
            productos = uow.productos.get_all_paged(offset=offset, limit=limit)
            total = uow.productos.count()
            result = ProductoList(
                data=[self._to_public(p) for p in productos],
                total=total,
            )
        return result

    def get_by_id(self, producto_id: int) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            result = self._to_public(producto)
        return result

    def get_by_categoria(self, categoria_id: int, offset: int = 0, limit: int = 20) -> ProductoList:
        with ProductoUnitOfWork(self._session) as uow:
            productos = uow.productos.get_by_categoria(categoria_id, offset=offset, limit=limit)
            result = ProductoList(
                data=[self._to_public(p) for p in productos],
                total=len(productos),
            )
        return result

    def update(self, producto_id: int, data: ProductoUpdate) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)

            # --- Campos directos del producto ---
            patch = data.model_dump(exclude_unset=True, exclude={"categoria_id", "es_principal", "ingredientes"})
            for field, value in patch.items():
                setattr(producto, field, value)

            # --- Categoria ---
            if data.categoria_id is not None or data.es_principal is not None:
                from app.modules.producto.models import ProductoCategoria

                relaciones = uow.producto_categorias.get_by_producto(producto_id)
                relacion = relaciones[0] if relaciones else None

                cat_id = data.categoria_id if data.categoria_id is not None else (relacion.categoria_id if relacion else None)

                if cat_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="El producto no tiene categoría asignada. Especificá categoria_id.",
                    )

                if relacion and relacion.categoria_id != cat_id:
                    uow.producto_categorias.delete(relacion)
                    # ✅ flush para ejecutar el DELETE antes del INSERT
                    uow.productos.session.flush()
                    relacion = None

                if not relacion:
                    from app.modules.categoria.models import Categoria
                    if not uow.productos.session.get(Categoria, cat_id):
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Categoría con id={cat_id} no encontrada",
                        )
                    relacion = ProductoCategoria(
                        producto_id=producto_id,
                        categoria_id=cat_id,
                        es_principal=False,
                    )
                    uow.producto_categorias.add(relacion)

                if data.es_principal is not None:
                    relacion.es_principal = data.es_principal
                    uow.producto_categorias.add(relacion)

            # --- Ingredientes ---
            if data.ingredientes is not None:
                from app.modules.producto.models import ProductoIngrediente

                # Eliminar ingredientes existentes
                for ing in uow.producto_ingredientes.get_by_producto(producto_id):
                    uow.producto_ingredientes.delete(ing)

                # ✅ flush para ejecutar los DELETEs antes de los INSERTs
                uow.productos.session.flush()

                # Crear los nuevos
                for ing_data in data.ingredientes:
                    from app.modules.ingrediente.models import Ingrediente
                    ingrediente = uow.productos.session.get(Ingrediente, ing_data.ingrediente_id)
                    if not ingrediente:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Ingrediente con id={ing_data.ingrediente_id} no encontrada",
                        )

                    um_id = ing_data.unidad_medida_id or ingrediente.unidad_medida_id
                    if um_id is None:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"El ingrediente '{ingrediente.nombre}' no tiene unidad de medida asignada",
                        )

                    relacion_ing = ProductoIngrediente(
                        producto_id=producto_id,
                        ingrediente_id=ing_data.ingrediente_id,
                        es_removible=ing_data.es_removible,
                        cantidad=ing_data.cantidad,
                        unidad_medida_id=um_id,
                    )
                    uow.producto_ingredientes.add(relacion_ing)

            producto.updated_at = _now()
            result = self._to_public(producto)
        return result

    def soft_delete(self, producto_id: int) -> None:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            producto.disponible = False
            producto.deleted_at = _now()
            producto.updated_at = _now()
            uow.productos.add(producto)

    def get_all_relaciones(self) -> ProductoCategoriaList:
        with ProductoUnitOfWork(self._session) as uow:
            relaciones = uow.producto_categorias.get_all_relaciones()
            result = ProductoCategoriaList(
                data=[ProductoCategoriaPublic.model_validate(r) for r in relaciones],
                total=len(relaciones),
            )
        return result

    def delete_relacion(self, producto_id: int, categoria_id: int) -> None:
        with ProductoUnitOfWork(self._session) as uow:
            relacion = self._get_relacion_categoria_or_404(uow, producto_id, categoria_id)
            uow.producto_categorias.delete(relacion)

    def get_all_relaciones_ingrediente(self) -> ProductoIngredienteList:
        with ProductoUnitOfWork(self._session) as uow:
            relaciones = uow.producto_ingredientes.get_all_relaciones()
            result = ProductoIngredienteList(
                data=[ProductoIngredientePublic.model_validate(r) for r in relaciones],
                total=len(relaciones),
            )
        return result

    def delete_relacion_ingrediente(self, producto_id: int, ingrediente_id: int) -> None:
        with ProductoUnitOfWork(self._session) as uow:
            relacion = self._get_relacion_ingrediente_or_404(uow, producto_id, ingrediente_id)
            uow.producto_ingredientes.delete(relacion)