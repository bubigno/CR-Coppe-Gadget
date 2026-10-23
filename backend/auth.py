import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from .db import LoginAttempt, User, get_sessions

JWT_ALGORITHM = "HS256"
ACCESS_TTL = 900  # 15 minuti
REFRESH_TTL = 604800  # 7 giorni


def get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET non configurata")
    return secret


def hash_password(password: str) -> str:
    # troncamento a 72 byte: bcrypt 5 rifiuta password più lunghe (bcrypt 4 le troncava)
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TTL),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=REFRESH_TTL),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=ACCESS_TTL, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=REFRESH_TTL, path="/")


class LoginIn(BaseModel):
    model_config = {"extra": "ignore"}

    username: str = Field(min_length=3, max_length=80)
    password: str


def client_ip(request: Request) -> str:
    # dietro l'edge proxy l'IP reale arriva nell'header X-Forwarded-For
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token non valido")
        try:
            uid = payload["sub"]
        except KeyError:
            raise HTTPException(status_code=401, detail="Token non valido")
        async with get_sessions()() as s:
            user = (await s.execute(select(User).where(User.id == uid))).scalar_one_or_none()
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token non valido")
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "name": user.name or "",
        "role": user.role,
    }


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return user


async def register_failed_attempt(s, ident: str) -> None:
    now = datetime.now(timezone.utc)
    stmt = pg_insert(LoginAttempt).values(
        identifier=ident,
        count=1,
        locked_until=now + timedelta(minutes=15),
        updated_at=now,
    ).on_conflict_do_update(
        index_elements=["identifier"],
        set_={"count": LoginAttempt.count + 1, "locked_until": now + timedelta(minutes=15), "updated_at": now},
    )
    await s.execute(stmt)
    await s.commit()


auth_router = APIRouter(prefix="/api/auth")


@auth_router.post("/login")
async def login(data: LoginIn, request: Request, response: Response):
    username = data.username.lower().strip()
    password = data.password.strip()  # elimina spazi accidentali da copia-incolla
    ident = f"{client_ip(request)}:{username}"
    now = datetime.now(timezone.utc)

    async with get_sessions()() as s:
        attempt = (await s.execute(select(LoginAttempt).where(LoginAttempt.identifier == ident))).scalar_one_or_none()
        if (
            attempt
            and attempt.count >= 5
            and attempt.locked_until
            and attempt.locked_until > now
        ):
            raise HTTPException(status_code=423, detail="Troppi tentativi: riprova tra qualche minuto.")

        user = (await s.execute(select(User).where(User.username == username))).scalar_one_or_none()
        if not user or not verify_password(password, user.password_hash):
            await register_failed_attempt(s, ident)
            raise HTTPException(status_code=401, detail="Credenziali non valide")

        await s.execute(delete(LoginAttempt).where(LoginAttempt.identifier == ident))
        await s.commit()

        access = create_access_token(str(user.id), user.username)
        refresh = create_refresh_token(str(user.id))
        set_auth_cookies(response, access, refresh)
        return {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "name": user.name or "",
            "role": user.role,
        }


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@auth_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token non valido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessione scaduta")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")

    async with get_sessions()() as s:
        try:
            user = (await s.execute(select(User).where(User.id == payload.get("sub", "")))).scalar_one_or_none()
        except Exception:
            user = None
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")

        access = create_access_token(str(user.id), user.username)
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=ACCESS_TTL, path="/")
        return {"ok": True}