from fastapi import APIRouter, Depends, HTTPException
from database import diary_collection
from models.diary import DiaryEntryModel, DiaryUpdateModel
from middleware.auth import verify_token
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# ── SAVE/UPDATE DIARY ENTRY ──
@router.post("/save")
def save_entry(data: DiaryEntryModel, user_id: str = Depends(verify_token)):
    existing = diary_collection.find_one({"user_id": user_id, "date": data.date})
    if existing:
        diary_collection.update_one(
            {"user_id": user_id, "date": data.date},
            {"$set": {
                "text": data.text,
                "mood": data.mood,
                "wordCount": data.wordCount,
                "updatedAt": datetime.utcnow().isoformat()
            }}
        )
        return {"message": "Entry updated successfully!! ✅"}
    else:
        entry = {
            "user_id": user_id,
            "date": data.date,
            "text": data.text,
            "mood": data.mood,
            "wordCount": data.wordCount,
            "createdAt": datetime.utcnow().isoformat()
        }
        diary_collection.insert_one(entry)
        return {"message": "Entry saved successfully!! 📓"}

# ── GET ALL ENTRIES ──
@router.get("/entries")
def get_all_entries(user_id: str = Depends(verify_token)):
    entries = diary_collection.find({"user_id": user_id})
    result = []
    for entry in entries:
        result.append({
            "id": str(entry["_id"]),
            "date": entry["date"],
            "text": entry["text"],
            "mood": entry["mood"],
            "wordCount": entry["wordCount"],
            "createdAt": entry.get("createdAt", "")
        })
    return {"entries": result}

# ── GET ENTRY BY DATE ──
@router.get("/entry/{date}")
def get_entry_by_date(date: str, user_id: str = Depends(verify_token)):
    entry = diary_collection.find_one({"user_id": user_id, "date": date})
    if not entry:
        raise HTTPException(status_code=404, detail="No entry found for this date!")
    return {
        "id": str(entry["_id"]),
        "date": entry["date"],
        "text": entry["text"],
        "mood": entry["mood"],
        "wordCount": entry["wordCount"],
        "createdAt": entry.get("createdAt", "")
    }

# ── DELETE ENTRY ──
@router.delete("/delete/{date}")
def delete_entry(date: str, user_id: str = Depends(verify_token)):
    result = diary_collection.delete_one({"user_id": user_id, "date": date})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No entry found for this date!")
    return {"message": "Entry deleted successfully!! 🗑️"}

# ── GET ENTRIES BY DATE RANGE ──
@router.get("/range")
def get_entries_by_range(start: str, end: str, user_id: str = Depends(verify_token)):
    entries = diary_collection.find({
        "user_id": user_id,
        "date": {"$gte": start, "$lte": end}
    })
    result = []
    for entry in entries:
        result.append({
            "id": str(entry["_id"]),
            "date": entry["date"],
            "text": entry["text"],
            "mood": entry["mood"],
            "wordCount": entry["wordCount"],
        })
    return {"entries": result}