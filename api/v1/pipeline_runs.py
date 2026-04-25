from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from services.database_service import DatabaseService, PipelineRunStatus
from core.deps import get_db, get_current_user

router = APIRouter(prefix="/cases", tags=["Pipeline Execution"])


class PipelineRunCreate(BaseModel):
    sequencing_run_id: int
    module_set: List[str]
    module_dependencies: Optional[dict] = None
    config: Optional[dict] = None


class PipelineRunResponse(BaseModel):
    id: int
    case_id: int
    sequencing_run_id: int
    module_set: List[str]
    module_dependencies: dict = {}
    status: str
    config: dict = {}
    retry_count: int = 0
    max_retries: int = 3
    last_error: Optional[str] = None
    error_type: Optional[str] = None
    started_at: Optional[str] = None
    finished_at: Optional[str] = None
    logs_path: Optional[str] = None
    nextflow_run_id: Optional[str] = None
    created_by: Optional[int] = None
    created_at: str


VALID_MODULES = {"A", "B", "C", "D", "E", "F", "G"}
VALID_PIPELINE_STATUSES = {"pending", "validating", "running", "failed", "completed", "cancelled"}


def _to_response(run) -> PipelineRunResponse:
    return PipelineRunResponse(
        id=run.id,
        case_id=run.case_id,
        sequencing_run_id=run.sequencing_run_id,
        module_set=list(run.module_set) if run.module_set else [],
        module_dependencies=run.module_dependencies or {},
        status=run.status,
        config=run.config or {},
        retry_count=run.retry_count,
        max_retries=run.max_retries,
        last_error=run.last_error,
        error_type=run.error_type,
        started_at=run.started_at.isoformat() if run.started_at else None,
        finished_at=run.finished_at.isoformat() if run.finished_at else None,
        logs_path=run.logs_path,
        nextflow_run_id=run.nextflow_run_id,
        created_by=run.created_by,
        created_at=run.created_at.isoformat()
    )


@router.post("/{case_id}/run", response_model=PipelineRunResponse, status_code=status.HTTP_201_CREATED)
async def launch_pipeline(
    case_id: int,
    run_data: PipelineRunCreate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    invalid = [m for m in run_data.module_set if m not in VALID_MODULES]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid modules: {invalid}. Valid: {VALID_MODULES}")

    run = await db.create_pipeline_run(
        sequencing_run_id=run_data.sequencing_run_id,
        case_id=case_id,
        module_set=run_data.module_set,
        module_dependencies=run_data.module_dependencies,
        config=run_data.config,
        created_by=current_user.get("id")
    )

    await db.update_case_status(case_id, "running")

    return _to_response(run)


@router.get("/{case_id}/runs", response_model=List[PipelineRunResponse])
async def list_pipeline_runs(
    case_id: int,
    module: Optional[str] = Query(None),
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    runs = await db.get_pipeline_runs_by_case_and_module(case_id, module=module)
    return [_to_response(r) for r in runs]


@router.get("/{case_id}/runs/{run_id}", response_model=PipelineRunResponse)
async def get_pipeline_run(
    case_id: int,
    run_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    run = await db.get_pipeline_run(run_id)
    if not run or run.case_id != case_id:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return _to_response(run)


@router.get("/{case_id}/runs/{run_id}/logs")
async def get_pipeline_run_logs(
    case_id: int,
    run_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    run = await db.get_pipeline_run(run_id)
    if not run or run.case_id != case_id:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    if not run.logs_path:
        return {"run_id": run_id, "logs": None, "message": "No logs available yet"}

    from services.minio_service import get_minio_service
    minio = get_minio_service()

    try:
        stream = await minio.get_object_stream(
            bucket=minio.bucket_default,
            object_name=run.logs_path
        )
        log_content = b""
        async for chunk in stream:
            log_content += chunk
        return {"run_id": run_id, "logs": log_content.decode("utf-8", errors="replace")}
    except Exception as e:
        return {"run_id": run_id, "logs": None, "error": str(e)}


@router.post("/{case_id}/runs/{run_id}/cancel", response_model=PipelineRunResponse)
async def cancel_pipeline_run(
    case_id: int,
    run_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    run = await db.get_pipeline_run(run_id)
    if not run or run.case_id != case_id:
        raise HTTPException(status_code=404, detail="Pipeline run not found")

    if run.status not in {"pending", "validating", "running"}:
        raise HTTPException(status_code=400, detail=f"Cannot cancel run with status '{run.status}'")

    updated = await db.update_pipeline_run_status(
        run_id=run_id,
        status="cancelled",
        finished_at=datetime.utcnow()
    )
    return _to_response(updated)
