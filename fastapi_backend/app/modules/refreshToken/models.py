from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import DateTime
from datetime import datetime

if TYPE_CHECKING:
    from app.modules.usuario.models import Usuario


class RefreshToken(SQLModel, table=True):
    """
    Tabla de refresh tokens para autenticación.
    Cada usuario puede tener múltiples refresh tokens activos.
    
    Invalidación segura en logout:
    - revoked_at = None → token válido
    - revoked_at = datetime → token invalidado
    
    Validar: expires_at > now() AND revoked_at IS NULL
    """
    __tablename__ = "refresh_token"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # FK al usuario
    usuario_id: int = Field(foreign_key="usuario.id")
    
    # Token hasheado (SHA-256 -> 64 chars)
    token_hash: str = Field(max_length=64, unique=True)
    
    # Fechas de validez e invalidación
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))
    revoked_at: Optional[datetime] = Field(default=None, sa_type=DateTime(timezone=True))
    
    # Audit
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_type=DateTime(timezone=True)
    )

    # Relaciones
    usuario: Optional["Usuario"] = Relationship(
        back_populates="refresh_tokens",
        sa_relationship_kwargs={
            "foreign_keys": "[RefreshToken.usuario_id]"
        }
    )