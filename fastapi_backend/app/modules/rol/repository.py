from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.rol.models import Rol


class RolRepository(BaseRepository[Rol]):

    def __init__(self, session: Session):
        super().__init__(session, Rol)

    def get_all(self) -> list[Rol]:
        return list(self.session.exec(select(Rol)).all())