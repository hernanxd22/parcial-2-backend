from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone
import uuid
import mercadopago

from app.core.config import settings
from app.modules.Pago.models import Pago
from app.modules.Pago.schemas import PagoPreferenciaResponse, PagoPublic, PagoList
from app.modules.Pago.unit_of_work import PagoUnitOfWork


def _now() -> datetime:
    return datetime.now(timezone.utc)


sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)


class PagoService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_pedido_or_404(self, uow: PagoUnitOfWork, pedido_id: int):
        from app.modules.Pedido.models import Pedido
        pedido = uow.pagos.session.get(Pedido, pedido_id)
        if not pedido:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido con id={pedido_id} no encontrado",
            )
        return pedido

    def _assert_es_dueño(self, pedido, usuario_id: int) -> None:
        if pedido.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permiso para pagar este pedido",
            )

    def _assert_pedido_pendiente(self, pedido) -> None:
        if pedido.estado_codigo != "PENDIENTE":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El pedido no está en estado PENDIENTE (estado actual: {pedido.estado_codigo})",
            )

    def crear_preferencia(self, pedido_id: int, usuario_id: int) -> PagoPreferenciaResponse:
        with PagoUnitOfWork(self._session) as uow:
            pedido = self._get_pedido_or_404(uow, pedido_id)
            self._assert_es_dueño(pedido, usuario_id)
            self._assert_pedido_pendiente(pedido)

            external_reference = f"pedido-{pedido_id}-{uuid.uuid4().hex[:8]}"
            idempotency_key    = str(uuid.uuid4())

            preference_data = {
                "items": [{
                    "title": f"Pedido #{pedido_id} - Food Store",
                    "quantity": 1,
                    "unit_price": float(pedido.total),
                    "currency_id": "ARS",
                }],
                "back_urls": {
                    "success": f"{settings.FRONTEND_URL}/pago/exitoso",
                    "failure": f"{settings.FRONTEND_URL}/pago/fallido",
                    "pending": f"{settings.FRONTEND_URL}/pago/pendiente",
                },
                "external_reference": external_reference,
                "notification_url": f"{settings.BACKEND_URL}/api/v1/pagos/webhook",
            }

            respuesta = sdk.preference().create(preference_data)
            if respuesta["status"] != 201:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Error al crear preferencia en MercadoPago",
                )

            preference = respuesta["response"]

            pago = Pago(
                pedido_id          = pedido_id,
                mp_status          = "pending",
                external_reference = external_reference,
                idempotency_key    = idempotency_key,
                transaction_amount = pedido.total,
            )
            uow.pagos.add(pago)

            result = PagoPreferenciaResponse(
                preference_id = preference["id"],
                init_point    = preference["sandbox_init_point"],
                public_key    = settings.MP_PUBLIC_KEY,
            )

        return result

    def procesar_webhook(self, payload: dict) -> dict:
        if payload.get("type") != "payment":
            return {"status": "ignorado"}

        payment_id = payload["data"]["id"]

        resultado = sdk.payment().get(payment_id)
        if resultado["status"] != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No se pudo obtener el pago de MercadoPago",
            )

        pago_mp       = resultado["response"]
        mp_status     = pago_mp["status"]
        status_detail = pago_mp.get("status_detail", "")
        ext_ref       = pago_mp.get("external_reference", "")
        method        = pago_mp.get("payment_method_id", "")

        with PagoUnitOfWork(self._session) as uow:
            pago = uow.pagos.get_by_external_reference(ext_ref)
            if not pago:
                return {"status": "pago no encontrado"}

            pago.mp_payment_id     = payment_id
            pago.mp_status         = mp_status
            pago.mp_status_detail  = status_detail
            pago.payment_method_id = method
            pago.updated_at        = _now()
            uow.pagos.add(pago)

            if mp_status == "approved":
                from app.modules.Pedido.models import Pedido
                pedido = uow.pagos.session.get(Pedido, pago.pedido_id)
                if pedido and pedido.estado_codigo == "PENDIENTE":
                    pedido.estado_codigo = "CONFIRMADO"
                    pedido.updated_at    = _now()

        return {"status": "ok"}

    def get_by_pedido(self, pedido_id: int) -> PagoPublic:
        with PagoUnitOfWork(self._session) as uow:
            pago = uow.pagos.get_by_pedido_id(pedido_id)
            if not pago:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No se encontró pago para el pedido id={pedido_id}",
                )
            result = PagoPublic.model_validate(pago)
        return result

    def get_all(self) -> PagoList:
        with PagoUnitOfWork(self._session) as uow:
            pagos = uow.pagos.get_all()
            result = PagoList(
                data=[PagoPublic.model_validate(p) for p in pagos],
                total=len(pagos),
            )
        return result