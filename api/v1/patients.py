from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from services.minio_service import MinioService
from core.deps import get_db, get_minio, get_current_user, require_clinical_write

def _parse_date(d: Optional[str]) -> Optional[date]:
    if not d:
        return None
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except ValueError:
        return None

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientCreate(BaseModel):
    external_patient_id: str
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    hospital_id: Optional[int] = None


class PatientUpdate(BaseModel):
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    hospital_id: Optional[int] = None


class PatientResponse(BaseModel):
    id: int
    external_patient_id: str
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    hospital_id: Optional[int] = None
    created_at: str


def _to_response(p) -> PatientResponse:
    return PatientResponse(
        id=p.id,
        external_patient_id=p.external_patient_id,
        sex=p.sex,
        date_of_birth=p.date_of_birth.isoformat() if p.date_of_birth else None,
        hospital_id=p.hospital_id,
        created_at=p.created_at.isoformat()
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient: PatientCreate,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    existing = await db.get_patient_by_external_id(patient.external_patient_id)
    if existing:
        raise HTTPException(status_code=409, detail=f"Patient '{patient.external_patient_id}' already exists")

    created = await db.create_patient(
        external_patient_id=patient.external_patient_id,
        sex=patient.sex,
        date_of_birth=_parse_date(patient.date_of_birth),
        hospital_id=patient.hospital_id
    )

    try:
        p = minio.get_clinical_path(patient_id=patient.external_patient_id)
        await minio.create_empty_marker(f"{p}/.keep")
    except Exception as e:
        print(f"Warning: MinIO dir creation failed: {e}")

    return _to_response(created)


@router.get("", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if search:
        patients = await db.search_patients(search, limit=limit)
        return [_to_response(p) for p in patients]
    patients = await db.get_patients()
    return [_to_response(p) for p in patients][offset:offset + limit]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    p = await db.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_response(p)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    update: PatientUpdate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    existing = await db.get_patient(patient_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found")

    await db.update_patient(
        patient_id=patient_id,
        sex=update.sex,
        date_of_birth=_parse_date(update.date_of_birth),
        hospital_id=update.hospital_id
    )

    p = await db.get_patient(patient_id)
    return _to_response(p)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    p = await db.get_patient(patient_id)
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        path = minio.get_clinical_path(patient_id=p.external_patient_id)
        await minio.delete_prefix(f"{path}/")
    except Exception as e:
        print(f"Warning: MinIO delete failed: {e}")

    await db.delete_patient(patient_id)
    return None
