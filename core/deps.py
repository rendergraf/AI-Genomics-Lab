from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.database_service import get_database_service, DatabaseService
from services.minio_service import get_minio_service, MinioService
from services.auth_service import get_auth_service

security_scheme = HTTPBearer()


def get_db() -> DatabaseService:
    return get_database_service()


def get_minio() -> MinioService:
    return get_minio_service()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme)
) -> Dict[str, Any]:
    auth_service = get_auth_service()
    token = credentials.credentials
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    db = get_database_service()
    user = await db.get_user(int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    roles = await auth_service.get_user_roles(user.id)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_active": user.is_active,
        "roles": roles or [],
    }


async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    if "admin" not in current_user["roles"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user


async def require_clinical_write(current_user: Dict[str, Any] = Depends(get_current_user)):
    allowed = {"admin", "analyst"}
    if not allowed.intersection(current_user["roles"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinical write access requires admin or analyst role"
        )
    return current_user


async def require_clinical_read(current_user: Dict[str, Any] = Depends(get_current_user)):
    allowed = {"admin", "analyst", "researcher", "viewer"}
    if not allowed.intersection(current_user["roles"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clinical read access requires admin, analyst, researcher, or viewer role"
        )
    return current_user
