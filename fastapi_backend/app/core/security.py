import os
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlmodel import Session, select

from app.core.database import get_session
from app.modules.usuario.models import Usuario, UsuarioRol

# Esquema OpenAPI para que Swagger muestre el candado
security_scheme = HTTPBearer(auto_error=False)

# Lee la misma config que usa refreshToken/service.py
JWT_SECRET = os.getenv("JWT_SECRET", "fallback_dev_only")
JWT_ALGORITHM = "HS256"


def get_current_user(
    token_data: Optional[HTTPBearer] = Depends(security_scheme),
    session: Session = Depends(get_session),
    request: Request = None,
) -> Usuario:
    """Valida el JWT (header Authorization o cookie httpOnly) y devuelve el usuario.

    Uso en cualquier endpoint protegido:
        @router.get(...)
        def mi_endpoint(usuario: Usuario = Depends(get_current_user)):
            ...
    """
    token = None
    if token_data is not None:
        token = token_data.credentials

    # Fallback: cookie httpOnly
    if token is None and request is not None:
        token = request.cookies.get("access_token")

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación requerido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = int(payload["sub"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = session.get(Usuario, user_id)
    if not usuario or not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )

    return usuario


def require_roles(*roles: str):
    """Factory de dependencia que exige uno o más roles.

    Uso:
        @router.delete(...)
        def eliminar(usuario: Usuario = Depends(require_roles("ADMIN"))):
            ...

        @router.patch(...)
        def actualizar(usuario: Usuario = Depends(require_roles("ADMIN", "STOCK"))):
            ...
    """

    def role_checker(
        current_user: Usuario = Depends(get_current_user),
        session: Session = Depends(get_session),
    ) -> Usuario:
        stmt = select(UsuarioRol).where(
            UsuarioRol.usuario_id == current_user.id
        )
        usuario_roles = session.exec(stmt).all()
        user_role_codes = [ur.rol_codigo for ur in usuario_roles]

        # Sin rol asignado → CLIENTE por defecto
        if not user_role_codes:
            user_role_codes = ["CLIENTE"]

        if not any(r in user_role_codes for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de estos roles: {', '.join(roles)}",
            )
        return current_user

    return role_checker
