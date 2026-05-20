
from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.producto.models import Producto, ProductoCategoria, ProductoIngrediente


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_all_paged(self, offset: int = 0, limit: int = 20) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto).offset(offset).limit(limit)
            ).all()
        )

    def get_by_categoria(self, categoria_id: int, offset: int = 0, limit: int = 20) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto)
                .join(ProductoCategoria)
                .where(ProductoCategoria.categoria_id == categoria_id)
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count(self) -> int:
        return len(self.session.exec(select(Producto)).all())


class ProductoCategoriaRepository(BaseRepository[ProductoCategoria]):

    def __init__(self, session: Session) -> None:
        super().__init__(session, ProductoCategoria)

    def get_all_relaciones(self) -> list[ProductoCategoria]:
        return list(self.session.exec(select(ProductoCategoria)).all())

    def get_by_producto(self, producto_id: int) -> list[ProductoCategoria]:
        return list(
            self.session.exec(
                select(ProductoCategoria).where(
                    ProductoCategoria.producto_id == producto_id
                )
            ).all()
        )

    def get_by_pk(self, producto_id: int, categoria_id: int) -> ProductoCategoria | None:
        return self.session.get(ProductoCategoria, (producto_id, categoria_id))

    def exists(self, producto_id: int, categoria_id: int) -> bool:
        return self.get_by_pk(producto_id, categoria_id) is not None


class ProductoIngredienteRepository(BaseRepository[ProductoIngrediente]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, ProductoIngrediente)

    def get_all_relaciones(self) -> list[ProductoIngrediente]:
        return list(self.session.exec(select(ProductoIngrediente)).all())

    def get_by_producto(self, producto_id: int) -> list[ProductoIngrediente]:
        return list(
            self.session.exec(
                select(ProductoIngrediente).where(
                    ProductoIngrediente.producto_id == producto_id
                )
            ).all()
        )

    def get_by_pk(self, producto_id: int, ingrediente_id: int) -> ProductoIngrediente | None:
        return self.session.get(ProductoIngrediente, (producto_id, ingrediente_id))

    def exists(self, producto_id: int, ingrediente_id: int) -> bool:
        return self.get_by_pk(producto_id, ingrediente_id) is not None