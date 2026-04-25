from fastapi import APIRouter
from . import patients, cases, samples, variants, reports
from . import pipeline_runs, hospitals, clinical_catalogs

router = APIRouter(prefix="/v1")

router.include_router(patients.router)
router.include_router(cases.router)
router.include_router(samples.router)
router.include_router(pipeline_runs.router)
router.include_router(variants.router)
router.include_router(reports.router)
router.include_router(hospitals.router)
router.include_router(clinical_catalogs.router)
