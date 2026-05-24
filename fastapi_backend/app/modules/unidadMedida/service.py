

from sqlmodel import Session
from app.modules.unidadMedida.unit_of_work import UnidadMedidaUnitOfWork


class UnidadMedidaService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_all(self, offset: int = 0, limit: int = 20) -> list:
        from app.modules.unidadMedida.schemas import UnidadMedidaPublic, UnidadMedidaList
        with UnidadMedidaUnitOfWork(self._session) as uow:
            unidades = uow.unidades.get_all()
            result = UnidadMedidaList(
                data=[UnidadMedidaPublic.model_validate(u) for u in unidades],
                total=len(unidades),
            )
        return result
