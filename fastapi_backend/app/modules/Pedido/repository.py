from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido 
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(session, Pedido)

    def get_by_usuario(self,usuario_id: int,offset: int = 0,limit: int = 20,) -> list[Pedido]:
        return list(
            self.session.exec(
                select(Pedido)
                .where(
                    Pedido.usuario_id == usuario_id,
                    Pedido.deleted_at == None,
                )
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_active_by_id(self, pedido_id: int) -> Pedido | None:
        return self.session.exec(
            select(Pedido)
            .where(
                Pedido.id == pedido_id,
                Pedido.deleted_at == None,
            )
        ).first()

    def count_by_usuario(self, usuario_id: int) -> int:
        return len(
            self.session.exec(
                select(Pedido)
                .where(
                    Pedido.usuario_id == usuario_id,
                    Pedido.deleted_at == None,
                )
            ).all()
        )

    def count(self) -> int:
        return len(
            self.session.exec(
                select(Pedido)
                .where(Pedido.deleted_at == None)
            ).all()
        )


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session: Session):
        super().__init__(session, DetallePedido)

    def get_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
        return list(
            self.session.exec(
                select(DetallePedido)
                .where(DetallePedido.pedido_id == pedido_id)
            ).all()
        )


class HistorialEstadoRepository(BaseRepository[HistorialEstadoPedido]):
    def __init__(self, session: Session):
        super().__init__(session, HistorialEstadoPedido)

    def get_by_pedido(self, pedido_id: int) -> list[HistorialEstadoPedido]:
        return list(
            self.session.exec(
                select(HistorialEstadoPedido)
                .where(HistorialEstadoPedido.pedido_id == pedido_id)
                .order_by(HistorialEstadoPedido.created_at)
            ).all()
        )