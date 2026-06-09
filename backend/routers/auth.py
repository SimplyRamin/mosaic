# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel
from core.database import run_pg, execute_pg
from core.security import (
    verify_password, create_access_token,
    create_refresh_token, hash_refresh_token, decode_token
)
from core.auth import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    employee_code: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
def login(body: LoginRequest, request: Request):
    users = run_pg(
        """SELECT user_id, employee_id, employee_code, username,
        password_hash, is_active, last_login, failed_attempts,
        locked_until, created_at
        FROM users WHERE employee_code = %s AND is_active = TRUE""",
        (body.employee_code,)
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کد پرسنلی یا رمز عبور اشتباه است"
        )
    
    user = users[0]


    # Check if locked
    if user['locked_until'] and user['locked_until'] > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="حساب کاربری موقتا غیرفعال شده است"
        )
    
    # Verify password
    if not verify_password(body.password, user['password_hash']):
        # Increment failed attempts
        attempts = (user['failed_attempts'] or 0) + 1
        if attempts >= 5:
            locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
            execute_pg(
                "UPDATE users SET failed_attempts = %s, locked_until = %s WHERE user_id = %s",
                (attempts, locked_until, user['user_id'])
            )
        else:
            execute_pg(
                "UPDATE users SET failed_attempts = %s WHERE user_id = %s",
                (attempts, user['user_id'])
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کد پرسنلی یا رمز عبور اشتباه است"
        )
    
    # Reset failed attempts
    execute_pg(
        "UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE user_id = %s",
        (user['user_id'],)
    )

    # Create tokens
    token_data = {
        "user_id":       user['user_id'],
        "employee_id":   user['employee_id'],
        "employee_code": user['employee_code'],
        "username":      user['username']
    }

    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token in sessions
    device_name = request.headers.get("X-Device-Name", "Unknown")
    device_os   = request.headers.get("X-Device-OS", "Unknown")
    ip_address  = request.client.host if request.client else "unknown"

    # Revoke existing sessions from same device before creating new one
    execute_pg(
        "UPDATE sessions SET revoked_at = NOW() WHERE user_id = %s AND device_name = %s AND revoked_at IS NULL",
        (user['user_id'], device_name)
    )

    # Cleanup expired and revoked sessions for this user
    execute_pg(
        "DELETE FROM sessions WHERE user_id = %s AND (expires_at < NOW() OR revoked_at IS NOT NULL)",
        (user['user_id'],)
    )

    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    execute_pg(
        """INSERT INTO sessions
        (user_id, refresh_token, device_name, device_os, ip_address, expires_at)
        VALUES (%s, %s, %s, %s, %s, %s)""",
        (user['user_id'], hash_refresh_token(refresh_token), device_name, device_os, ip_address, expires_at)
    )

    # Log the action
    execute_pg(
        "INSERT INTO audit_log (user_id, action, result, ip_address) VALUES (%s, 'login', 'allowed', %s)",
        (user['user_id'], ip_address)
    )

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user": {
            "user_id":       user['user_id'],
            "employee_code": user['employee_code'],
            "username":      user['username']
        }
    }


@router.post("/refresh")
def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Check sessions exists and not revoked
    hashed = hash_refresh_token(body.refresh_token)
    sessions = run_pg(
        "SELECT * FROM sessions WHERE refresh_token = %s AND revoked_at IS NULL AND expires_at > NOW()",
        (hashed,)
    )

    if not sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessions expired or revoked"
        )
    
    # Update last used
    execute_pg(
        "UPDATE sessions SET last_used_at = NOW() WHERE refresh_token = %s",
        (hashed,)
    )

    # Issue new access token
    token_data = {
        "user_id":       payload["user_id"],
        "employee_id":   payload["employee_id"],
        "employee_code": payload["employee_code"],
        "username":      payload["username"]
    }

    return {
        "access_token": create_access_token(token_data),
        "token_type":   "bearer"
    }


@router.post("/logout")
def logout(
    body: RefreshRequest,
    current_user: dict = Depends(get_current_user)
):
    hashed  = hash_refresh_token(body.refresh_token)
    execute_pg(
        "UPDATE sessions SET revoked_at = NOW() WHERE refresh_token = %s AND user_id = %s",
        (hashed, current_user["user_id"])
    )
    return {"message": "logged out"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user