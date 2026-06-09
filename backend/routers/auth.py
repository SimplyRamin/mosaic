# =================================================================================================
#                                           Written by Ramin F.
#                                      AI Engineer & Data Scientist
#                            Ferdos.ramin@gmail.com | simplyramin.github.io
# =================================================================================================

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel
from core.database import run_sql, execute_sql
from core.security import (
    verify_password, create_access_token,
    create_refresh_token, hash_refresh_token, decode_token
)
from core.auth import get_current_user
from core.config import settings
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])

SCHEMA = settings.sql_schema


class LoginRequest(BaseModel):
    employee_code: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
def login(body: LoginRequest, request: Request):
    users = run_sql(
        f"""SELECT User_id, Employee_id, Employee_Code, Username, 
        Password_hash, Is_active, Last_login, Failed_attempts, 
        Locked_until, Created_by, Created_at, Updated_at 
        FROM {SCHEMA}.Users WHERE Employee_Code = ? AND Is_active = 1""",
        (body.employee_code,)
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کد پرسنلی یا رمز عبور اشتباه است"
        )
    
    user = users[0]


    # Check if locked
    if user['Locked_until'] and user['Locked_until'] > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="حساب کاربری موقتا غیرفعال شده است"
        )
    
    # Verify password
    if not verify_password(body.password, user['Password_hash']):
        # Increment failed attempts
        attempts = (user['Failed_attempts'] or 0) + 1
        if attempts >= 5:
            execute_sql(
                f"UPDATE {SCHEMA}.Users SET Failed_attempts = ?, "
                f"Locked_until = DATEADD(MINUTE, 30, GETDATE()) "
                f"WHERE User_id = ?",
                (attempts, user['User_id'])
            )
        else:
            execute_sql(
                f"UPDATE {SCHEMA}.Users SET Failed_attempts = ? WHERE User_id = ?",
                (attempts, user['User_id'])
            )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کد پرسنلی یا رمز عبور اشتباه است"
        )
    
    # Reset failed attempts
    execute_sql(
        f"UPDATE {SCHEMA}.Users SET Failed_attempts = 0, "
        f"Locked_until = NULL, Last_login = GETDATE() WHERE User_id = ?",
        (user['User_id'])
    )

    # Create tokens
    token_data = {
        "user_id":       user['User_id'],
        "employee_id":   user['Employee_id'],
        "employee_code": user['Employee_Code'],
        "username":      user['Username']
    }

    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Store refresh token in sessions
    device_name = request.headers.get("X-Device-Name", "Unknown")
    device_os   = request.headers.get("X-Device-OS", "Unknown")
    ip_address  = request.client.host if request.client else "unknown"

    # Revoke existing sessions from same device before creating new one
    execute_sql(
        f"UPDATE {SCHEMA}.Sessions SET Revoked_at = GETDATE() "
        f" WHERE User_id = ? AND Device_name = ? AND Revoked_at IS NULL",
        (user['User_id'], device_name)
    )

    # Cleanup expired and revoked sessions for this user
    execute_sql(
        f"DELETE FROM {SCHEMA}.Sessions "
        f"WHERE User_id = ? AND "
        f"(Expires_at < GETDATE() OR Revoked_at IS NOT NULL)",
        (user['User_id'],)
    )

    execute_sql(
        f"INSERT INTO {SCHEMA}.Sessions "
        f"(User_id, Refresh_token, Device_name, Device_os, Ip_address, "
        f"Created_at, Last_used_at, Expires_at) "
        f"VALUES (?, ?, ?, ?, ?, GETDATE(), GETDATE(), "
        f"DATEADD(DAY, 30, GETDATE()))",
        (
            user['User_id'],
            hash_refresh_token(refresh_token),
            device_name,
            device_os,
            ip_address
        )
    )

    # Log the action
    execute_sql(
        f"INSERT INTO {SCHEMA}.Audit_log "
        f"(User_id, Action, Result, Ip_address, Created_at) "
        f"VALUES (?, 'login', 'allowed', ?, GETDATE())",
        (user['User_id'], ip_address)
    )

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user": {
            "user_id":       user['User_id'],
            "employee_code": user['Employee_Code'],
            "username":      user['Username']
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
    sessions = run_sql(
        f"SELECT * FROM {SCHEMA}.Sessions "
        f"WHERE Refresh_token = ? AND Revoked_at IS NULL "
        f"AND Expires_at > GETDATE()",
        (hashed,)
    )

    if not sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessions expired or revoked"
        )
    
    # Update last used
    execute_sql(
        f"UPDATE {SCHEMA}.Sessions SET Last_used_at = GETDATE() "
        f"WHERE Refresh_token = ?",
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
    execute_sql(
        f"UPDATE {SCHEMA}.Sessions SET Revoked_at = GETDATE() "
        f"WHERE Refresh_token = ? AND User_id = ?",
        (hashed, current_user["user_id"])
    )
    return {"message": "logged out"}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user