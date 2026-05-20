from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import engine
from app.modules.refreshToken.schemas import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutResponse,
)
from app.modules.refreshToken.service import AuthService


def get_session():
    with Session(engine) as session:
        yield session


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, session: Session = Depends(get_session)):
    """
    Iniciar sesión.
    
    Retorna:
    - access_token: JWT de corta duración (15 min)
    - refresh_token: Token para renovar sin hacer login de nuevo
    """
    service = AuthService(session)
    return service.login(data)


@router.post("/refresh", response_model=RefreshResponse)
def refresh(data: RefreshRequest, session: Session = Depends(get_session)):
    """
    Renovar access token usando refresh token.
    
    El refresh token anterior se invalida y se genera uno nuevo.
    """
    service = AuthService(session)
    return service.refresh(data)


@router.post("/logout", response_model=LogoutResponse)
def logout(data: RefreshRequest, session: Session = Depends(get_session)):
    """
    Cerrar sesión (invalidar refresh token).
    """
    service = AuthService(session)
    service.logout(data.refresh_token)
    return LogoutResponse()