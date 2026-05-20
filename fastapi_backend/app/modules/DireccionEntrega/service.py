from fastapi import HTTPException, status
from sqlmodel import Session
from datetime import datetime, timezone

from app.modules.DireccionEntrega.models import DireccionEntrega
from app.modules.DireccionEntrega.schemas import (
    DireccionEntregaCreate,
    DireccionEntregaPublic,
    DireccionEntregaUpdate,
    DireccionEntregaList,
)
from app.modules.DireccionEntrega.unit_of_work import DireccionEntregaUnitOfWork


def _now() -> datetime:
    return datetime.now(timezone.utc)


class DireccionEntregaService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(
        self,
        uow: DireccionEntregaUnitOfWork,
        direccion_id: int,
    ) -> DireccionEntrega:
        direccion = uow.direcciones.get_active_by_id(direccion_id)
        if not direccion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dirección con id={direccion_id} no encontrada",
            )
        return direccion

    def _assert_pertenece_a_usuario(
        self,
        direccion: DireccionEntrega,
        usuario_id: int,
    ) -> None:
        if direccion.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La dirección no pertenece al usuario indicado",
            )

    def _desmarcar_principal(
        self,
        uow: DireccionEntregaUnitOfWork,
        usuario_id: int,
    ) -> None:
        """Si ya existe una dirección principal, la desmarca."""
        actual = uow.direcciones.get_principal(usuario_id)
        if actual:
            actual.es_principal = False
            actual.updated_at = _now()
            uow.direcciones.add(actual)

    def create(self, data: DireccionEntregaCreate) -> DireccionEntregaPublic:
        with DireccionEntregaUnitOfWork(self._session) as uow:
            if data.es_principal:
                self._desmarcar_principal(uow, data.usuario_id)

            direccion = DireccionEntrega.model_validate(data)
            uow.direcciones.add(direccion)
            result = DireccionEntregaPublic.model_validate(direccion)
        return result

    def get_all_by_usuario(self,usuario_id: int,offset: int = 0,limit: int = 20,) -> DireccionEntregaList:
        with DireccionEntregaUnitOfWork(self._session) as uow:
            direcciones = uow.direcciones.get_by_usuario(usuario_id, offset=offset, limit=limit)
            total = uow.direcciones.count_by_usuario(usuario_id)
            result = DireccionEntregaList(
                data=[DireccionEntregaPublic.model_validate(d) for d in direcciones],
                total=total,
            )
        return result

    def get_by_id(self, direccion_id: int) -> DireccionEntregaPublic:
        with DireccionEntregaUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id)
            result = DireccionEntregaPublic.model_validate(direccion)
        return result

    def update(self,usuario_id: int,direccion_id: int,data: DireccionEntregaUpdate,) -> DireccionEntregaPublic:
        with DireccionEntregaUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id)
            self._assert_pertenece_a_usuario(direccion, usuario_id)
            patch = data.model_dump(exclude_unset=True)
            if patch.get("es_principal"):
                self._desmarcar_principal(uow, usuario_id)

            for field, value in patch.items():
                setattr(direccion, field, value)

            direccion.updated_at = _now()
            uow.direcciones.add(direccion)
            result = DireccionEntregaPublic.model_validate(direccion)
        return result

    def soft_delete(self, usuario_id: int, direccion_id: int) -> None:
        with DireccionEntregaUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id)
            self._assert_pertenece_a_usuario(direccion, usuario_id)
            direccion.deleted_at = _now()
            direccion.updated_at = _now()
            uow.direcciones.add(direccion)