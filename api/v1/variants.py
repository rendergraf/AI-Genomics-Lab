from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from pydantic import BaseModel

from services.database_service import DatabaseService
from core.deps import get_db, get_current_user

router = APIRouter(prefix="/cases", tags=["Results"])


class VariantResponse(BaseModel):
    id: int
    case_id: int
    sequencing_run_id: Optional[int] = None
    pipeline_run_id: Optional[int] = None
    tumor_sample_id: Optional[int] = None
    normal_sample_id: Optional[int] = None
    variant_origin: Optional[str] = None
    gene: Optional[str] = None
    chromosome: Optional[str] = None
    position: Optional[int] = None
    ref: Optional[str] = None
    alt: Optional[str] = None
    variant_type: str
    qual: Optional[float] = None
    sample_data: Optional[dict] = None
    annotations: Optional[List[dict]] = None
    created_at: str


def _to_response(v, annotations=None) -> VariantResponse:
    return VariantResponse(
        id=v.id,
        case_id=v.case_id,
        sequencing_run_id=v.sequencing_run_id,
        pipeline_run_id=v.pipeline_run_id,
        tumor_sample_id=v.tumor_sample_id,
        normal_sample_id=v.normal_sample_id,
        variant_origin=v.variant_origin,
        gene=v.gene,
        chromosome=v.chromosome,
        position=v.position,
        ref=v.ref,
        alt=v.alt,
        variant_type=v.variant_type,
        qual=v.qual,
        sample_data=v.sample_data or {},
        annotations=annotations,
        created_at=v.created_at.isoformat()
    )


@router.get("/{case_id}/variants", response_model=List[VariantResponse])
async def list_variants(
    case_id: int,
    variant_type: Optional[str] = Query(None),
    gene: Optional[str] = Query(None),
    significance: Optional[str] = Query(None),
    impact: Optional[str] = Query(None),
    actionable: Optional[bool] = Query(None),
    limit: int = 500,
    offset: int = 0,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if significance:
        variants = await db.get_variants_by_significance(case_id, significance)
    elif impact:
        variants = await db.get_variants_by_impact(case_id, impact)
    elif actionable:
        variants = await db.get_actionable_variants(case_id)
    else:
        variants = await db.get_variants_by_case(
            case_id, limit=limit, offset=offset,
            variant_type=variant_type, gene=gene
        )

    result = []
    for v in variants[offset:offset + limit]:
        anns = await db.get_annotations_by_variant(v.id)
        result.append(_to_response(v, [dict(a.__dict__) for a in anns]))
    return result


@router.get("/{case_id}/variants/{variant_type_filter}", response_model=List[VariantResponse])
async def list_variants_by_type(
    case_id: int,
    variant_type_filter: str,
    limit: int = 500,
    offset: int = 0,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    case = await db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    valid = {"SNV", "INDEL", "CNV", "SV", "FUSION"}
    if variant_type_filter not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid type. Valid: {valid}")

    variants = await db.get_variants_by_case(
        case_id, limit=limit, offset=offset, variant_type=variant_type_filter
    )
    result = []
    for v in variants:
        anns = await db.get_annotations_by_variant(v.id)
        result.append(_to_response(v, [dict(a.__dict__) for a in anns]))
    return result


@router.get("/variants/{variant_id}", response_model=VariantResponse)
async def get_variant(
    variant_id: int,
    db: DatabaseService = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    v = await db.get_variant(variant_id)
    if not v:
        raise HTTPException(status_code=404, detail="Variant not found")
    anns = await db.get_annotations_by_variant(v.id)
    return _to_response(v, [dict(a.__dict__) for a in anns])
