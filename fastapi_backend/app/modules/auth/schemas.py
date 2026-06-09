from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime


class LoginRequest(SQLModel):
    email: str = Field(max_length=254)
    password: str = Field(min_length=6)


class LoginResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(SQLModel):
    refresh_token: str


class RefreshResponse(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LogoutResponse(SQLModel):
    message: str = "Token invalidado correctamente"


class MeResponse(SQLModel):
    id: int
    email: str
    nombre: str
    apellido: str
    roles: list[str]
