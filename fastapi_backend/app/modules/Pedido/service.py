from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone

from app.modules.Pedido.models import Pedido
from app.modules.DetallePedido.models import DetallePedido 
from app.modules.HistorialEstadoPedido.models import HistorialEstadoPedido
from app.modules.Pedido.schemas import (
    PedidoCreate,
    PedidoAvanzarEstado,
    PedidoPublic,
    PedidoPublicSimple,
    PedidoList,
    DetallePedidoPublic,
    HistorialEstadoPublic,
)
from app.modules.Pedido.unit_of_work import PedidoUnitOfWork
from app.modules.producto.models import Producto
from app.modules.EstadoPedido.models import EstadoPedido


def _now() -> datetime:
    return datetime.now(timezone.utc)


# FSM: transiciones válidas según el UML
FSM: dict[str, list[str]] = {
    "PENDIENTE":   ["CONFIRMADO", "CANCELADO"],
    "CONFIRMADO":  ["EN_PREP", "CANCELADO"],
    "EN_PREP":     ["EN_CAMINO", "CANCELADO"],
    "EN_CAMINO":   ["ENTREGADO"],
    "ENTREGADO":   [],
    "CANCELADO":   [],
}


class PedidoService:
    def __init__(self, session: Session) -> None:
        self._session = session

    # ── helpers privados ──────────────────────────────────────────────────────

    def _get_or_404(self, uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_active_by_id(pedido_id)
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def _get_producto_or_404(self, session: Session, producto_id: int) -> Producto:
        producto = session.get(Producto, producto_id)
        if not producto or producto.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={producto_id} no encontrado",
            )
        return producto

    def _assert_disponible(self, producto: Producto, cantidad: int) -> None:
        if not producto.disponible:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Producto '{producto.nombre}' no está disponible",
            )
        if producto.stock_cantidad < cantidad:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock insuficiente para '{producto.nombre}' "
                       f"(disponible: {producto.stock_cantidad}, pedido: {cantidad})",
            )

    def _assert_transicion_valida(
        self, estado_actual: str, estado_hacia: str
    ) -> None:
        permitidos = FSM.get(estado_actual, [])
        if estado_hacia not in permitidos:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Transición inválida: {estado_actual} → {estado_hacia}. "
                       f"Permitidas: {permitidos}",
            )

    def _assert_motivo_si_cancelado(
        self, estado_hacia: str, motivo: str | None
    ) -> None:
        # RN-05: motivo obligatorio si se cancela
        if estado_hacia == "CANCELADO" and not motivo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El campo 'motivo' es obligatorio al cancelar un pedido",
            )

    def _to_public(self, pedido: Pedido) -> PedidoPublic:
        return PedidoPublic(
            **pedido.model_dump(),
            detalles=[DetallePedidoPublic.model_validate(d) for d in pedido.detalles],
            historial=[HistorialEstadoPublic.model_validate(h) for h in pedido.historial],
        )

    # ── operaciones públicas ──────────────────────────────────────────────────

    def create(self, data: PedidoCreate) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            subtotal = 0.0
            detalles: list[DetallePedido] = []
            for item in data.items:
                producto = self._get_producto_or_404(self._session, item.producto_id)
                self._assert_disponible(producto, item.cantidad)

                precio = float(producto.precio_base)
                sub = round(precio * item.cantidad, 2)
                subtotal += sub

                detalles.append(DetallePedido(
                    producto_id=item.producto_id,
                    cantidad=item.cantidad,
                    nombre_snapshot=producto.nombre,
                    precio_snapshot=precio,
                    subtotal_snap=sub,
                    personalizacion=item.personalizacion,
                ))

                # Descontar stock
                producto.stock_cantidad -= item.cantidad
                self._session.add(producto)

            descuento = 0.00
            costo_envio = 0.00 if data.direccion_id is None else 50.00
            total = round(subtotal - descuento + costo_envio, 2)

            pedido = Pedido(
                usuario_id=data.usuario_id,
                direccion_id=data.direccion_id,
                estado_codigo="PENDIENTE",
                forma_pago_codigo=data.forma_pago_codigo,
                subtotal=subtotal,
                descuento=descuento,
                costo_envio=costo_envio,
                total=total,
                notas=data.notas,
            )
            uow.pedidos.add(pedido)

            for detalle in detalles:
                detalle.pedido_id = pedido.id
                uow.detalles.add(detalle)

            # RN-02: primer historial con estado_desde=NULL
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde_codigo=None,
                estado_hacia_codigo="PENDIENTE",
                usuario_id=data.usuario_id,
            )
            uow.historial.add(historial)

            uow._session.refresh(pedido)
            result = self._to_public(pedido)

        return result

    def get_all(self, offset: int = 0, limit: int = 20) -> PedidoList:
        with PedidoUnitOfWork(self._session) as uow:
            pedidos = uow.pedidos.get_all(offset=offset, limit=limit)
            total = uow.pedidos.count()
            result = PedidoList(
                data=[PedidoPublicSimple.model_validate(p) for p in pedidos],
                total=total,
            )
        return result

    def get_by_usuario(
        self, usuario_id: int, offset: int = 0, limit: int = 20
    ) -> PedidoList:
        with PedidoUnitOfWork(self._session) as uow:
            pedidos = uow.pedidos.get_by_usuario(usuario_id, offset=offset, limit=limit)
            total = uow.pedidos.count_by_usuario(usuario_id)
            result = PedidoList(
                data=[PedidoPublicSimple.model_validate(p) for p in pedidos],
                total=total,
            )
        return result

    def get_by_id(self, pedido_id: int) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            result = self._to_public(pedido)
        return result

    def avanzar_estado(
        self, pedido_id: int, data: PedidoAvanzarEstado
    ) -> PedidoPublic:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)

            self._assert_transicion_valida(pedido.estado_codigo, data.estado_hacia_codigo)
            self._assert_motivo_si_cancelado(data.estado_hacia_codigo, data.motivo)

            estado_anterior = pedido.estado_codigo

            # 1. UPDATE estado en Pedido
            pedido.estado_codigo = data.estado_hacia_codigo
            pedido.updated_at = _now()
            uow.pedidos.add(pedido)

            # 2. INSERT en historial (RN-03: append-only)
            historial = HistorialEstadoPedido(
                pedido_id=pedido.id,
                estado_desde_codigo=estado_anterior,
                estado_hacia_codigo=data.estado_hacia_codigo,
                usuario_id=data.usuario_id,
                motivo=data.motivo,
            )
            uow.historial.add(historial)

            uow._session.refresh(pedido)
            result = self._to_public(pedido)

        return result

    def soft_delete(self, pedido_id: int) -> None:
        with PedidoUnitOfWork(self._session) as uow:
            pedido = self._get_or_404(uow, pedido_id)
            pedido.deleted_at = _now()
            pedido.updated_at = _now()
            uow.pedidos.add(pedido)