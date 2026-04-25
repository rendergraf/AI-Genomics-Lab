from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from core.deps import get_db, get_current_user, require_clinical_write

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


class HospitalCreate(BaseModel):
    name: str
    code: str


class HospitalResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: str


def _to_response(h) -> HospitalResponse:
    return HospitalResponse(
        id=h.id,
        name=h.name,
        code=h.code,
        created_at=h.created_at.isoformat()
    )


@router.get("", response_model=List[HospitalResponse])
async def list_hospitals(
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    hospitals = await db.get_hospitals()
    return [_to_response(h) for h in hospitals]


@router.post("", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(
    hospital: HospitalCreate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    created = await db.create_hospital(
        name=hospital.name,
        code=hospital.code
    )
    return _to_response(created)


@router.delete("/{hospital_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hospital(
    hospital_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    h = await db.get_hospital(hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    await db.delete_hospital(hospital_id)
    return None
