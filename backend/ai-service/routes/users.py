from fastapi import APIRouter, Depends, HTTPException
from database import users_collection
from models.user import UpdateProfileModel
from middleware.auth import verify_token
from bson import ObjectId

router = APIRouter()

# Helper to convert MongoDB object to dict
def user_to_dict(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "dob": user.get("dob", ""),
        "gender": user.get("gender", ""),
        "phone": user.get("phone", ""),
        "friendEmail": user.get("friendEmail", ""),
        "createdAt": user.get("createdAt", "")
    }

# ── GET PROFILE ──
@router.get("/me")
def get_profile(user_id: str = Depends(verify_token)):
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found!")
    return user_to_dict(user)

# ── UPDATE PROFILE ──
@router.put("/update")
def update_profile(data: UpdateProfileModel, user_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in data.dict().items() if v is not None and v != ""}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update!")
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
    return {"message": "Profile updated successfully!! ✅", "user": user_to_dict(updated_user)}