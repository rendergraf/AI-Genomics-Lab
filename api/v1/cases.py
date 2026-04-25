import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from services.minio_service import MinioService
from core.deps import get_db, get_minio, get_current_user, require_clinical_write

router = APIRouter(prefix="/cases", tags=["Cases"])


class CaseCreate(BaseModel):
    patient_id: int
    case_code: str
    diagnosis: Optional[str] = None
    cancer_type: Optional[str] = None
    primary_site: Optional[str] = None
    stage: Optional[str] = None
    histology_subtype: Optional[str] = None
    metastatic_sites: Optional[List[str]] = None
    clinical_question: Optional[str] = None
    requested_modules: Optional[str] = None
    metadata: Optional[dict] = None


class CaseUpdate(BaseModel):
    diagnosis: Optional[str] = None
    cancer_type: Optional[str] = None
    primary_site: Optional[str] = None
    stage: Optional[str] = None
    histology_subtype: Optional[str] = None
    metastatic_sites: Optional[List[str]] = None
    clinical_question: Optional[str] = None
    requested_modules: Optional[str] = None
    metadata: Optional[dict] = None
    status: Optional[str] = None


class CaseResponse(BaseModel):
    id: int
    patient_id: int
    case_code: str
    diagnosis: Optional[str] = None
    cancer_type: Optional[str] = None
    primary_site: Optional[str] = None
    stage: Optional[str] = None
    histology_subtype: Optional[str] = None
    metastatic_sites: Optional[List[str]] = None
    clinical_question: Optional[str] = None
    requested_modules: Optional[str] = None
    metadata: Optional[dict] = None
    status: str
    created_at: str
    updated_at: str


def _to_response(c) -> CaseResponse:
    md = c.metadata
    if isinstance(md, str):
        md = json.loads(md) if md else {}
    metastatic = c.metastatic_sites
    if isinstance(metastatic, str):
        metastatic = json.loads(metastatic) if metastatic else None
    return CaseResponse(
        id=c.id,
        patient_id=c.patient_id,
        case_code=c.case_code,
        diagnosis=c.diagnosis,
        cancer_type=c.cancer_type,
        primary_site=c.primary_site,
        stage=c.stage,
        histology_subtype=c.histology_subtype,
        metastatic_sites=metastatic or [],
        clinical_question=c.clinical_question,
        requested_modules=c.requested_modules,
        metadata=md or {},
        status=c.status,
        created_at=c.created_at.isoformat(),
        updated_at=c.updated_at.isoformat()
    )


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    case: CaseCreate,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    patient = await db.get_patient(case.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    existing = await db.get_case_by_code(case.case_code)
    if existing:
        raise HTTPException(status_code=409, detail=f"Case '{case.case_code}' already exists")

    created = await db.create_case(
        patient_id=case.patient_id,
        case_code=case.case_code,
        diagnosis=case.diagnosis,
        cancer_type=case.cancer_type,
        primary_site=case.primary_site,
        stage=case.stage,
        histology_subtype=case.histology_subtype,
        metastatic_sites=case.metastatic_sites,
        clinical_question=case.clinical_question,
        requested_modules=case.requested_modules,
        metadata=case.metadata or {}
    )

    try:
        cp = minio.get_clinical_path(patient_id=patient.external_patient_id, case_code=case.case_code)
        await minio.create_empty_marker(f"{cp}/.keep")
    except Exception as e:
        print(f"Warning: MinIO dir creation failed: {e}")

    return _to_response(created)


@router.get("", response_model=List[CaseResponse])
async def list_cases(
    patient_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = 100,
    offset: int = 0,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if patient_id:
        cases = await db.get_cases_by_patient(patient_id)
    elif status:
        cases = await db.get_cases_by_status(status)
    else:
        cases = await db.get_cases()
    return [_to_response(c) for c in cases][offset:offset + limit]


@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(
    case_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    c = await db.get_case(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    return _to_response(c)


@router.get("/by-code/{case_code}", response_model=CaseResponse)
async def get_case_by_code(
    case_code: str,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    c = await db.get_case_by_code(case_code)
    if not c:
        raise HTTPException(status_code=404, detail=f"Case '{case_code}' not found")
    return _to_response(c)


@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    update: CaseUpdate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    existing = await db.get_case(case_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")

    await db.update_case(
        case_id=case_id,
        diagnosis=update.diagnosis,
        cancer_type=update.cancer_type,
        primary_site=update.primary_site,
        stage=update.stage,
        histology_subtype=update.histology_subtype,
        metastatic_sites=update.metastatic_sites,
        clinical_question=update.clinical_question,
        requested_modules=update.requested_modules,
        metadata=update.metadata
    )

    if update.status:
        await db.update_case_status(case_id, update.status)

    c = await db.get_case(case_id)
    return _to_response(c)


@router.patch("/{case_id}/status")
async def update_case_status(
    case_id: int,
    status: str,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    valid = ["draft", "running", "completed", "reported"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")

    existing = await db.get_case(case_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Case not found")

    await db.update_case_status(case_id, status)
    return {"case_id": case_id, "status": status}


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: int,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    c = await db.get_case(case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    patient = await db.get_patient(c.patient_id)
    if patient:
        try:
            cp = minio.get_clinical_path(patient_id=patient.external_patient_id, case_code=c.case_code)
            await minio.delete_prefix(f"{cp}/")
        except Exception as e:
            print(f"Warning: MinIO delete failed: {e}")

    await db.delete_case(case_id)
    return None
