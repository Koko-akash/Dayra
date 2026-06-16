from pydantic import BaseModel, EmailStr
from typing import Optional

# Model for signup request
class SignupModel(BaseModel):
    name: str
    email: str
    password: str
    dob: str
    gender: str
    phone: str
    friendEmail: Optional[str] = None

# Model for login request
class LoginModel(BaseModel):
    email: str
    password: str
    rememberMe: Optional[bool] = False

# Model for updating profile
class UpdateProfileModel(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    friendEmail: Optional[str] = None