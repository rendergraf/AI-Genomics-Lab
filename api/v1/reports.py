from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from core.deps import get_db, get_current_user, require_clinical_write

router = APIRouter(prefix="/cases", tags=["Reports"])


class ReportGenerate(BaseModel):
    sequencing_run_id: int
    modules: dict
    summary: Optional[str] = None
    actionable_variants: Optional[list] = None
    therapy_recommendations: Optional[list] = None
    biomarkers: Optional[dict] = None


class ReportResponse(BaseModel):
    id: int
    case_id: int
    sequencing_run_id: Optional[int] = None
    modules: dict = {}
    summary: Optional[str] = None
    actionable_variants: list = []
    therapy_recommendations: list = []
    biomarkers: dict = {}
    pdf_path: Optional[str] = None
    json_path: Optional[str] = None
    generated_by: Optional[int] = None
    generated_at: str


def _to_response(r) -> ReportResponse:
    return ReportResponse(
        id=r.id,
        case_id=r.case_id,
        sequencing_run_id=r.sequencing_run_id,
        modules=r.modules or {},
        summary=r.summary,
        actionable_variants=list(r.actionable_variants) if isinstance(r.actionable_variants, (list,)) else [],
        therapy_recommendations=list(r.therapy_recommendations) if isinstance(r.therapy_recommendations, (list,)) else [],
        biomarkers=r.biomarkers or {},
        pdf_path=r.pdf_path,
        json_path=r.json_path,
        generated_by=r.generated_by,
        generated_at=r.generated_at.isoformat()
    )


@router.get("/{case_id}/report", response_model=List[ReportResponse])
async def get_case_reports(
    case_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    reports = await db.get_clinical_reports_by_case(case_id)
    return [_to_response(r) for r in reports]


@router.get("/{case_id}/report/{module}", response_model=List[ReportResponse])
async def get_module_reports(
    case_id: int,
    module: str,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    reports = await db.get_clinical_reports_by_case(case_id)
    filtered = [r for r in reports if module in r.modules]
    return [_to_response(r) for r in filtered]


@router.post("/{case_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    case_id: int,
    report_data: ReportGenerate,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(require_clinical_write)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    report = await db.create_clinical_report(
        case_id=case_id,
        sequencing_run_id=report_data.sequencing_run_id,
        modules=report_data.modules,
        summary=report_data.summary,
        actionable_variants=report_data.actionable_variants or [],
        therapy_recommendations=report_data.therapy_recommendations or [],
        biomarkers=report_data.biomarkers or {},
        generated_by=current_user.get("id")
    )
    return _to_response(report)


@router.delete("/{case_id}/report/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    case_id: int,
    report_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    report = await db.get_clinical_report(report_id)
    if not report or report.case_id != case_id:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.delete_clinical_report(report_id)
    return None
