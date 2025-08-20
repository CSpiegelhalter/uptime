from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
import jwt, datetime
from ..db import get_db
from ..models import User
from ..utils import ulid

JWT_SECRET = "change-me"  # from env
JWT_EXP_MIN = 60 * 24 * 7

class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(409, "Email already registered")
    u = User(
        id=ulid(),
        email=body.email.lower(),
        password_hash=bcrypt.hash(body.password),
    )
    db.add(u); db.commit()
    token = jwt.encode(
        {"sub": u.id, "email": u.email, "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXP_MIN)},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"access_token": token}

@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == body.email.lower()).first()
    if not u or not bcrypt.verify(body.password, u.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = jwt.encode(
        {"sub": u.id, "email": u.email, "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=JWT_EXP_MIN)},
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"access_token": token}
