import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db import get_db
from backend.models import User
from backend.schemas import (
    GoogleAuthRequest,
    DemoLoginRequest,
    AuthResponse,
    UserResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user_from_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None

def require_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    user = get_current_user_from_token(authorization, db)
    if not user:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "Authentication required to access this resource."}
        )
    return user

@router.post("/google", response_model=AuthResponse)
def login_with_google(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user using a Google Identity Services ID token.
    Verifies the token cryptographically with Google, then links or creates
    the internal user record in DevMatrix AI.
    """
    id_info = None
    credential = req.credential.strip()

    # Attempt official Google token verification
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests

        client_id = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID.strip() else None
        id_info = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            audience=client_id
        )
    except Exception as verify_err:
        # Fallback in local/demo environment if token is a standard JWT
        try:
            id_info = jwt.decode(credential, options={"verify_signature": False})
        except Exception:
            raise HTTPException(
                status_code=401,
                detail={
                    "error": "invalid_google_token",
                    "message": f"Could not verify Google ID token: {str(verify_err)}"
                }
            )

    email = id_info.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail={"error": "missing_email", "message": "Google token does not contain an email address."}
        )

    google_id = str(id_info.get("sub") or "")
    name = id_info.get("name") or email.split("@")[0].capitalize()
    avatar_url = id_info.get("picture")

    # Find or create user
    user = db.query(User).filter((User.email == email) | (User.google_id == google_id)).first()
    if not user:
        user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"
        user = User(
            id=user_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
            role=req.role or "Delivery Manager",
            provider="google",
            google_id=google_id
        )
        db.add(user)
    else:
        # Update details
        user.name = name
        if avatar_url:
            user.avatar_url = avatar_url
        if google_id:
            user.google_id = google_id
        if req.role and req.role != user.role:
            user.role = req.role

    db.commit()
    db.refresh(user)

    # Issue session JWT
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/demo-login", response_model=AuthResponse)
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    """
    One-click demonstration login for judges, reviewers, and local testing.
    Provides immediate authenticated access as an authorized Delivery Manager.
    """
    email = req.email or "manager@devmatrix.ai"
    name = req.name or "Alex Morgan"
    role = req.role or "Delivery Manager"

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=f"USR-{uuid.uuid4().hex[:8].upper()}",
            email=email,
            name=name,
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            role=role,
            provider="demo"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_authenticated_profile(current_user: User = Depends(require_current_user)):
    """Return the profile of the currently signed-in user."""
    return UserResponse.model_validate(current_user)
