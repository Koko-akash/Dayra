from fastapi import APIRouter, HTTPException
from database import users_collection
from models.user import SignupModel, LoginModel
from jose import jwt
from dotenv import load_dotenv
from datetime import datetime, timedelta
import os
import bcrypt

load_dotenv()

router = APIRouter()

# Password hashing

JWT_SECRET = os.getenv("JWT_SECRET")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, remember_me: bool = False) -> str:
    expire = datetime.utcnow() + timedelta(days=30 if remember_me else 1)
    payload = {"user_id": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

# ── SIGNUP ──
@router.post("/signup")
def signup(data: SignupModel):
    # Check if email already exists
    existing = users_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered!")

    # Hash password and save user
    hashed = hash_password(data.password)
    user = {
        "name": data.name,
        "email": data.email,
        "password": hashed,
        "dob": data.dob,
        "gender": data.gender,
        "phone": data.phone,
        "friendEmail": data.friendEmail,
        "createdAt": datetime.utcnow().isoformat()
    }
    result = users_collection.insert_one(user)
    return {"message": "Account created successfully!! 🎉", "user_id": str(result.inserted_id)}

# ── LOGIN ──
@router.post("/login")
def login(data: LoginModel):
    # Find user by email
    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email!")

    # Check password
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Incorrect password!")

    # Create JWT token
    token = create_token(str(user["_id"]), data.rememberMe)
    return {
        "message": "Login successful!! 🌿",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
        }
    }

# ── VERIFY EMAIL EXISTS ──
@router.post("/verify-email")
def verify_email(data: dict):
    email = data.get("email")
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email!")
    return {"message": "Email verified!!", "exists": True}

# ── RESET PASSWORD ──
@router.post("/reset-password")
def reset_password(data: dict):
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        raise HTTPException(status_code=400, detail="Email and password required!")

    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email!")

    hashed = hash_password(new_password)
    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hashed}}
    )
    return {"message": "Password reset successfully!! ✅"}