from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.refreshToken.schemas import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutResponse,
    MeResponse,
)
from app.modules.refreshToken.service import AuthService
from app.modules.usuario.models import Usuario, UsuarioRol


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(data: LoginRequest, session: Session = Depends(get_session)):
    """
    Iniciar sesión.

    Retorna:
    - access_token: JWT de corta duración (15 min)
    - refresh_token: Token para renovar sin hacer login de nuevo
    """
    service = AuthService(session)
    result = service.login(data)
    response = JSONResponse(content=result.model_dump())
    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=900,
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=604800,
    )
    return response


@router.post("/refresh")
def refresh(data: RefreshRequest, session: Session = Depends(get_session)):
    """
    Renovar access token usando refresh token.

    El refresh token anterior se invalida y se genera uno nuevo.
    """
    service = AuthService(session)
    result = service.refresh(data)
    response = JSONResponse(content=result.model_dump())
    response.set_cookie(
        key="access_token",
        value=result.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=900,
    )
    response.set_cookie(
        key="refresh_token",
        value=result.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=604800,
    )
    return response


@router.post("/logout", response_model=LogoutResponse)
def logout(data: RefreshRequest, session: Session = Depends(get_session)):
    """
    Cerrar sesión (invalidar refresh token).
    """
    service = AuthService(session)
    service.logout(data.refresh_token)
    return LogoutResponse()


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