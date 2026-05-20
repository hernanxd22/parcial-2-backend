from sqlmodel import Session, select
from app.core.repository import BaseRepository
from app.modules.refreshToken.models import RefreshToken
from datetime import datetime


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: Session):
        super().__init__(session, RefreshToken)

    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        """Buscar token por su hash."""
        return self.session.exec(
            select(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
        ).first()

    def get_active_by_usuario(self, usuario_id: int) -> list[RefreshToken]:
        """Obtener todos los tokens activos de un usuario."""
        return list(
            self.session.exec(
                select(RefreshToken)
                .where(
                    RefreshToken.usuario_id == usuario_id,
                    RefreshToken.revoked_at == None,  # noqa: E711
                    RefreshToken.expires_at > datetime.utcnow()
                )
            ).all()
        )

    def get_valid_token(self, token_hash: str) -> RefreshToken | None:
        """Obtener token válido (no vencido, no revocado)."""
        return self.session.exec(
            select(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at == None,  # noqa: E711
                RefreshToken.expires_at > datetime.utcnow()
            )
        ).first()

    def revoke(self, token: RefreshToken) -> None:
        """Invalidar un token."""
        token.revoked_at = datetime.utcnow()
        self.session.add(token)
        self.session.flush()

    def revoke_all_by_usuario(self, usuario_id: int) -> None:
        """Invalidar todos los tokens de un usuario (logout de todos los dispositivos)."""
        tokens = self.get_active_by_usuario(usuario_id)
        for token in tokens:
            token.revoked_at = datetime.utcnow()
            self.session.add(token)
        self.session.flush()

    def delete_expired(self) -> int:
        """Eliminar tokens vencidos. Retorna la cantidad eliminada."""
        tokens = list(
            self.session.exec(
                select(RefreshToken)
                .where(RefreshToken.expires_at < datetime.utcnow())
            ).all()
        )
        for token in tokens:
            self.session.delete(token)
        self.session.flush()
        return len(tokens)