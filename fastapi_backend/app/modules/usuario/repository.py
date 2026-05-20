from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.usuario.models import Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session):
        super().__init__(session, Usuario)

    def get_active(self,offset: int = 0,limit: int = 20) -> list[Usuario]:
        return list(
            self.session.exec(
                select(Usuario)
                .where(Usuario.activo == True)
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.email == email)
        ).first()

    def count(self) -> int:
        return len(
            self.session.exec(
                select(Usuario)
                .where(Usuario.activo == True)
            ).all()
        )


class UsuarioRolRepository(BaseRepository[UsuarioRol]):
    def __init__(self, session: Session):
        super().__init__(session, UsuarioRol)

    def get_by_usuario(self,usuario_id: int) -> list[UsuarioRol]:
        return list(
            self.session.exec(
                select(UsuarioRol)
                .where(
                    UsuarioRol.usuario_id == usuario_id
                )
            ).all()
        )

    def get_relacion(self,usuario_id: int,rol_codigo: str) -> UsuarioRol | None:
        return self.session.exec(
            select(UsuarioRol)
            .where(
                UsuarioRol.usuario_id == usuario_id,
                UsuarioRol.rol_codigo == rol_codigo
            )
        ).first()

    def exists(self,usuario_id: int,rol_codigo: str) -> bool:
        return (
            self.get_relacion(
                usuario_id,
                rol_codigo
            )
            is not None
        )