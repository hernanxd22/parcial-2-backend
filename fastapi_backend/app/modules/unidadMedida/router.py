

from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import get_current_user
from app.modules.usuario.models import Usuario
from app.modules.unidadMedida.schemas import UnidadMedidaList
from app.modules.unidadMedida.service import UnidadMedidaService

router = APIRouter()


def get_unidad_service(session: Session = Depends(get_session)) -> UnidadMedidaService:
    return UnidadMedidaService(session)


OffsetQuery = Annotated[int, Query(ge=0, description="Registros a omitir")]
LimitQuery  = Annotated[int, Query(ge=1, le=100, description="Máximo de resultados")]


@router.get(
    "/",
    response_model=UnidadMedidaList,
    summary="Listar unidades de medida",
)
def list_unidades(
    offset: OffsetQuery = 0,
    limit: LimitQuery = 20,
    svc: UnidadMedidaService = Depends(get_unidad_service),
    _: Usuario = Depends(get_current_user),
):
    return svc.get_all(offset=offset, limit=limit)
