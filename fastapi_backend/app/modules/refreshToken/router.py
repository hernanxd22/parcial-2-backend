from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
import os

from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.refreshToken.schemas import (
    LoginRequest,
    RefreshRequest,
    LogoutResponse,
    MeResponse,
)
from app.modules.refreshToken.service import AuthService
from app.modules.usuario.models import Usuario, UsuarioRol

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

router = APIRouter(prefix="/auth", tags=["Auth"])


def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> None:
    """Setear cookies httponly con los tokens."""
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=900,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax",
        path="/",
        max_age=604800,
    )


def _clear_auth_cookies(response: JSONResponse) -> None:
    """Eliminar cookies de autenticación."""
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    """
    Iniciar sesión.

    Setea cookies httponly con access_token (15 min) y refresh_token (7 días).
    El frontend NO necesita leer estos tokens desde JS — el navegador los envía solo.
    """
    service = AuthService(session)
    result = service.login(data)
    response = JSONResponse(content={"message": "Inicio de sesión exitoso"})
    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return response


@router.post("/refresh")
def refresh(request: Request, session: Session = Depends(get_session)):
    """
    Renovar access token usando refresh token de la cookie httponly.

    El refresh token anterior se invalida (rotation).
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado",
        )
    service = AuthService(session)
    result = service.refresh(RefreshRequest(refresh_token=refresh_token))
    response = JSONResponse(content={"message": "Token renovado"})
    _set_auth_cookies(response, result.access_token, result.refresh_token)
    return response


@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    session: Session = Depends(get_session),
    _: Usuario = Depends(get_current_user),
):
    """
    Cerrar sesión: invalida refresh token y limpia cookies httponly.
    """
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        service = AuthService(session)
        service.logout(refresh_token)
    response = JSONResponse(content=LogoutResponse().model_dump())
    _clear_auth_cookies(response)
    return response


@router.get("/me", response_model=MeResponse)
def get_me(
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Obtener datos del usuario autenticado.
    """
    stmt = select(UsuarioRol).where(
        UsuarioRol.usuario_id == current_user.id
    )
    usuario_roles = session.exec(stmt).all()
    roles = [ur.rol_codigo for ur in usuario_roles] if usuario_roles else ["CLIENTE"]

    return MeResponse(
        id=current_user.id,
        email=current_user.email,
        nombre=current_user.nombre,
        apellido=current_user.apellido,
        roles=roles,
    )