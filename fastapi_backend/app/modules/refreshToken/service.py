import os
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException, status
from sqlmodel import Session
from passlib.context import CryptContext
from sqlmodel import select

from app.modules.refreshToken.models import RefreshToken
from app.modules.refreshToken.schemas import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
)
from app.modules.refreshToken.unit_of_work import RefreshTokenUnitOfWork
from app.modules.usuario.models import Usuario, UsuarioRol

# Configuración de JWT
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_dev_only")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Configuración de bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_token(token: str) -> str:
    """Hashear token con SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()


def _create_access_token(
    usuario: Usuario,
    session: Session
) -> str:
    """Crear access token (JWT)."""

    stmt = (
        select(UsuarioRol)
        .where(
            UsuarioRol.usuario_id == usuario.id
        )
    )

    usuario_rol = session.exec(stmt).first()

    rol = (
        usuario_rol.rol_codigo
        if usuario_rol
        else "CLIENTE"
    )

    payload = {
        "sub": str(usuario.id),
        "email": usuario.email,
        "rol": rol,
        "exp": datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def _create_refresh_token() -> str:
    """Crear refresh token (random string)."""
    return secrets.token_urlsafe(32)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar password."""
    return pwd_context.verify(plain_password, hashed_password)


class AuthService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_usuario_by_email(self, email: str) -> Optional[Usuario]:
        statement = select(Usuario).where(Usuario.email == email,Usuario.activo == True)
        return self._session.exec(statement).first()

    def login(self, data: LoginRequest) -> LoginResponse:
        """Iniciar sesión."""
        with RefreshTokenUnitOfWork(self._session) as uow:
            # Buscar usuario
            usuario = self._get_usuario_by_email(data.email)
            if not usuario:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas",
                )

            # Verificar password
            if not _verify_password(data.password, usuario.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas",
                )

            # Generar tokens
            access_token = _create_access_token(usuario,self._session)
            refresh_token = _create_refresh_token()
            refresh_token_hash = _hash_token(refresh_token)

            # Calcular fecha de expiración
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

            # Guardar refresh token
            rt = RefreshToken(
                usuario_id=usuario.id,
                token_hash=refresh_token_hash,
                expires_at=expires_at,
            )
            uow.refresh_tokens.add(rt)

            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
            )

    def refresh(self, data: RefreshRequest) -> RefreshResponse:
        """Renovar tokens."""
        with RefreshTokenUnitOfWork(self._session) as uow:
            # Hashear el token recibido
            token_hash = _hash_token(data.refresh_token)

            # Buscar token válido
            rt = uow.refresh_tokens.get_valid_token(token_hash)
            if not rt:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Refresh token inválido o vencido",
                )

            # Obtener usuario
            usuario = rt.usuario
            if not usuario or not usuario.activo:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no encontrado o inactivo",
                )

            # Revocar el token antiguo
            uow.refresh_tokens.revoke(rt)

            # Generar nuevos tokens
            access_token = _create_access_token(usuario, self._session)
            new_refresh_token = _create_refresh_token()
            new_refresh_token_hash = _hash_token(new_refresh_token)

            # Guardar nuevo refresh token
            expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            new_rt = RefreshToken(
                usuario_id=usuario.id,
                token_hash=new_refresh_token_hash,
                expires_at=expires_at,
            )
            uow.refresh_tokens.add(new_rt)

            return RefreshResponse(
                access_token=access_token,
                refresh_token=new_refresh_token,
            )

    def logout(self, refresh_token: str) -> None:
        """Cerrar sesión (invalidar refresh token)."""
        with RefreshTokenUnitOfWork(self._session) as uow:
            token_hash = _hash_token(refresh_token)
            
            rt = uow.refresh_tokens.get_by_token_hash(token_hash)
            if rt and not rt.revoked_at:
                uow.refresh_tokens.revoke(rt)

    def logout_all(self, usuario_id: int) -> None:
        """Cerrar sesión en todos los dispositivos."""
        with RefreshTokenUnitOfWork(self._session) as uow:
            uow.refresh_tokens.revoke_all_by_usuario(usuario_id)