from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.unidad_medida.models import UnidadMedida


class UnidadMedidaRepository(BaseRepository[UnidadMedida]):
    def __init__(self, session: Session):
        super().__init__(session, UnidadMedida)

    def get_all(self) -> list[UnidadMedida]:
        return list(self.session.exec(select(UnidadMedida)).all())