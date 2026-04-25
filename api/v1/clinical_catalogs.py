from fastapi import APIRouter, Depends
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from core.deps import get_db, get_current_user

router = APIRouter(prefix="/clinical-catalogs", tags=["Clinical Catalogs"])


class CancerTypeResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str | None = None


class PrimarySiteResponse(BaseModel):
    id: int
    name: str
    category: str | None = None
    is_primary: bool = False


class HistologySubtypeResponse(BaseModel):
    id: int
    name: str


class StageItem(BaseModel):
    code: str
    name: str


@router.get("/cancer-types", response_model=List[CancerTypeResponse])
async def list_cancer_types(
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await db.get_cancer_types()


@router.get("/primary-sites", response_model=List[PrimarySiteResponse])
async def list_primary_sites(
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await db.get_primary_sites()


@router.get("/primary-sites/{cancer_type_id}", response_model=List[PrimarySiteResponse])
async def list_primary_sites_by_cancer_type(
    cancer_type_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await db.get_primary_sites_by_cancer_type(cancer_type_id)


@router.get("/histology-subtypes/{cancer_type_id}", response_model=List[HistologySubtypeResponse])
async def list_histology_subtypes(
    cancer_type_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await db.get_histology_subtypes_by_cancer_type(cancer_type_id)


@router.get("/stages", response_model=List[StageItem])
async def list_stages(
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return await db.get_stages()
