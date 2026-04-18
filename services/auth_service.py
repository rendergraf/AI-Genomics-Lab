"""
🧬 AI Genomics Lab - Authentication Service
JWT-based authentication with password hashing and role management

Author: Xavier Araque
Email: xavieraraque@gmail.com
GitHub: https://github.com/rendergraf/AI-Genomics-Lab
Version: 0.1
License: MIT
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

from services.database_service import get_database_service, User, Role

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password hashing context - Argon2 for new hashes
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

class AuthService:
    """Service for authentication and authorization"""
    
    def __init__(self):
        self.db = get_database_service()
    
    # ==================== PASSWORD HASHING ====================
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password using Argon2"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash using Argon2"""
        return pwd_context.hash(password)
    
    # ==================== USER AUTHENTICATION ====================
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.db.get_user_by_email(email)
        if not user:
            return None
        if not user.is_active:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user
    
    async def create_user(
        self,
        email: str,
        password: str,
        name: Optional[str] = None,
        is_active: bool = True,
        roles: Optional[List[str]] = None
    ) -> Optional[User]:
        """Create a new user with hashed password"""
        # Check if user already exists
        existing = await self.db.get_user_by_email(email)
        if existing:
            return None
        
        # Hash password
        password_hash = self.get_password_hash(password)
        
        # Create user
        user = await self.db.create_user(email, password_hash, name, is_active)
        
        # Assign roles
        if roles:
            all_roles = await self.db.get_roles()
            role_map = {role.name: role.id for role in all_roles}
            for role_name in roles:
                if role_name in role_map:
                    await self.db.assign_role_to_user(user.id, role_map[role_name])
        
        return user
    
    # ==================== TOKEN MANAGEMENT ====================
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != token_type:
                return None
            return payload
        except JWTError:
            return None
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """Generate new access token from refresh token"""
        payload = self.verify_token(refresh_token, "refresh")
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Verify user still exists and is active
        user = await self.db.get_user(int(user_id))
        if not user or not user.is_active:
            return None
        
        # Create new access token
        new_access_token = self.create_access_token({"sub": str(user.id), "email": user.email})
        return new_access_token
    
    # ==================== AUTHORIZATION ====================
    
    async def get_user_roles(self, user_id: int) -> List[str]:
        """Get role names for a user"""
        roles = await self.db.get_user_roles(user_id)
        return [role.name for role in roles]
    
    async def user_has_role(self, user_id: int, role_name: str) -> bool:
        """Check if user has a specific role"""
        roles = await self.get_user_roles(user_id)
        return role_name in roles
    
    async def user_has_any_role(self, user_id: int, role_names: List[str]) -> bool:
        """Check if user has any of the specified roles"""
        roles = await self.get_user_roles(user_id)
        return any(role in roles for role in role_names)
    
    async def user_has_all_roles(self, user_id: int, role_names: List[str]) -> bool:
        """Check if user has all of the specified roles"""
        roles = await self.get_user_roles(user_id)
        return all(role in roles for role in role_names)
    
    # ==================== PERMISSION CHECKING ====================
    
    async def can_edit_genome_references(self, user_id: int) -> bool:
        """Check if user can edit genome references (admin only)"""
        return await self.user_has_role(user_id, "admin")
    
    async def can_edit_pipeline_settings(self, user_id: int) -> bool:
        """Check if user can edit pipeline settings (admin only)"""
        return await self.user_has_role(user_id, "admin")
    
    async def can_edit_ai_provider_settings(self, user_id: int) -> bool:
        """Check if user can edit AI provider settings (superadmin only)"""
        # For now, treat superadmin as admin - can be extended later
        return await self.user_has_role(user_id, "admin")
    
    async def can_manage_users(self, user_id: int) -> bool:
        """Check if user can manage users (admin only)"""
        return await self.user_has_role(user_id, "admin")
    
    # ==================== AUDIT LOGGING ====================
    
    async def log_auth_event(
        self,
        user_id: Optional[int],
        action: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log authentication event"""
        try:
            logger.info(f"Logging auth event: user_id={user_id}, action={action}, details={details}")
            await self.db.create_audit_log(
                user_id=user_id,
                action=action,
                resource_type="auth",
                details=details,
                ip_address=ip_address,
                user_agent=user_agent
            )
        except Exception as e:
            logger.error(f"Failed to log auth event: {e}")
    
    # ==================== SESSION MANAGEMENT ====================
    
    async def create_login_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, str]:
        """Create login session with access and refresh tokens"""
        # Create tokens
        access_token = self.create_access_token({"sub": str(user.id), "email": user.email})
        refresh_token = self.create_refresh_token({"sub": str(user.id)})
        
        # Log login event
        await self.log_auth_event(
            user_id=user.id,
            action="login",
            ip_address=ip_address,
            user_agent=user_agent,
            details={"method": "password"}
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    async def logout(self, user_id: int, ip_address: Optional[str] = None) -> None:
        """Log logout event"""
        await self.log_auth_event(
            user_id=user_id,
            action="logout",
            ip_address=ip_address
        )


# Singleton instance
_auth_service: Optional[AuthService] = None

def get_auth_service() -> AuthService:
    """Get singleton auth service instance"""
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service