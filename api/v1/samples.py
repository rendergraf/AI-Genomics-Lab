from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from services.minio_service import MinioService
from core.deps import get_db, get_minio, get_current_user, require_clinical_write

router = APIRouter(tags=["Samples"])


class SampleCreate(BaseModel):
    sample_code: str
    sample_type: str
    tissue_site: Optional[str] = None
    collection_method: Optional[str] = None


class SampleUpdate(BaseModel):
    tissue_site: Optional[str] = None
    collection_method: Optional[str] = None
    quality_status: Optional[str] = None


class SampleResponse(BaseModel):
    id: int
    case_id: int
    sample_code: str
    sample_type: str
    tissue_site: Optional[str] = None
    collection_method: Optional[str] = None
    quality_status: str
    created_at: str


def _to_response(s) -> SampleResponse:
    return SampleResponse(
        id=s.id,
        case_id=s.case_id,
        sample_code=s.sample_code,
        sample_type=s.sample_type,
        tissue_site=s.tissue_site,
        collection_method=s.collection_method,
        quality_status=s.quality_status,
        created_at=s.created_at.isoformat()
    )


@router.post("/cases/{case_id}/samples", response_model=SampleResponse, status_code=status.HTTP_201_CREATED)
async def create_sample(
    case_id: int,
    sample: SampleCreate,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    valid_types = ["tumor", "normal", "rna", "germline"]
    if sample.sample_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid type. Must be: {valid_types}")

    existing = await db.get_sample_by_code(sample.sample_code)
    if existing:
        raise HTTPException(status_code=409, detail=f"Sample '{sample.sample_code}' already exists")

    created = await db.create_clinical_sample(
        case_id=case_id,
        sample_code=sample.sample_code,
        sample_type=sample.sample_type,
        tissue_site=sample.tissue_site,
        collection_method=sample.collection_method
    )

    try:
        patient = await db.get_patient(case.patient_id)
        if patient:
            sp = minio.get_clinical_path(
                patient_id=patient.external_patient_id,
                case_code=case.case_code,
                sample_code=sample.sample_code
            )
            await minio.create_empty_marker(f"{sp}/.keep")
            await minio.create_empty_marker(f"{sp}/raw/fastq/.keep")
            await minio.create_empty_marker(f"{sp}/aligned/.keep")
            await minio.create_empty_marker(f"{sp}/variants/raw/.keep")
            await minio.create_empty_marker(f"{sp}/qc/.keep")
    except Exception as e:
        print(f"Warning: MinIO dirs creation failed: {e}")

    return _to_response(created)


@router.get("/cases/{case_id}/samples", response_model=List[SampleResponse])
async def list_samples_by_case(
    case_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    samples = await db.get_clinical_samples_by_case(case_id)
    return [_to_response(s) for s in samples]


@router.get("/samples/{sample_id}", response_model=SampleResponse)
async def get_sample(
    sample_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    s = await db.get_clinical_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    return _to_response(s)


@router.get("/samples/by-code/{sample_code}", response_model=SampleResponse)
async def get_sample_by_code(
    sample_code: str,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    s = await db.get_sample_by_code(sample_code)
    if not s:
        raise HTTPException(status_code=404, detail=f"Sample '{sample_code}' not found")
    return _to_response(s)


@router.put("/samples/{sample_id}", response_model=SampleResponse)
async def update_sample(
    sample_id: int,
    update: SampleUpdate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    existing = await db.get_clinical_sample(sample_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Sample not found")

    await db.update_clinical_sample(
        sample_id=sample_id,
        tissue_site=update.tissue_site,
        collection_method=update.collection_method,
        quality_status=update.quality_status
    )

    s = await db.get_clinical_sample(sample_id)
    return _to_response(s)


@router.post("/samples/{sample_id}/upload-fastq", status_code=status.HTTP_200_OK)
async def upload_sample_fastq(
    sample_id: int,
    r1: UploadFile = File(..., description="R1 FASTQ file (gzipped)"),
    r2: UploadFile = File(..., description="R2 FASTQ file (gzipped)"),
    sequencing_run_id: Optional[int] = None,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    s = await db.get_clinical_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")

    case = await db.get_case(s.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    patient = await db.get_patient(case.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = await minio.upload_fastq_to_case(
        r1_stream=r1.file,
        r2_stream=r2.file,
        patient_external_id=patient.external_patient_id,
        case_code=case.case_code,
        sample_code=s.sample_code,
        r1_filename=r1.filename or "R1.fastq.gz",
        r2_filename=r2.filename or "R2.fastq.gz"
    )

    r1_size = r1.size or 0
    r2_size = r2.size or 0

    await db.create_fastq_file(
        sequencing_run_id=sequencing_run_id or 0,
        read_pair="R1",
        file_path=result["r1"],
        file_size=r1_size
    )
    await db.create_fastq_file(
        sequencing_run_id=sequencing_run_id or 0,
        read_pair="R2",
        file_path=result["r2"],
        file_size=r2_size
    )

    return {
        "sample_id": sample_id,
        "r1_path": result["r1"],
        "r2_path": result["r2"],
        "r1_size": r1_size,
        "r2_size": r2_size,
        "status": "uploaded"
    }


@router.delete("/samples/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sample(
    sample_id: int,
    db: DatabaseService = Depends(get_db),
    minio: MinioService = Depends(get_minio),
    current_user: dict = Depends(require_clinical_write)
):
    s = await db.get_clinical_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")

    case = await db.get_case(s.case_id)
    if case:
        patient = await db.get_patient(case.patient_id)
        if patient:
            try:
                sp = minio.get_clinical_path(
                    patient_id=patient.external_patient_id,
                    case_code=case.case_code,
                    sample_code=s.sample_code
                )
                await minio.delete_prefix(f"{sp}/")
            except Exception as e:
                print(f"Warning: MinIO delete failed: {e}")

    await db.delete_clinical_sample(sample_id)
    return None
