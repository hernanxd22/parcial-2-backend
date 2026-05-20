from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class LoginRequest(SQLModel):
    """Request para iniciar sesión."""
    email: str = Field(max_length=254)
    password: str = Field(min_length=6)


class LoginResponse(SQLModel):
    """Response con los tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(SQLModel):
    """Request para refresh de token."""
    refresh_token: str


class RefreshResponse(SQLModel):
    """Response con nuevos tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutResponse(SQLModel):
    """Response de logout."""
    message: str = "Token invalidado correctamente"