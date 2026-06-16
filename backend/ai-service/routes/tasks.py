from fastapi import APIRouter, Depends, HTTPException
from database import tasks_collection
from models.task import TaskModel, TaskUpdateModel
from middleware.auth import verify_token
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# ── ADD TASK ──
@router.post("/add")
def add_task(data: TaskModel, user_id: str = Depends(verify_token)):
    task = {
        "user_id": user_id,
        "date": data.date,
        "name": data.name,
        "priority": data.priority,
        "completed": data.completed,
        "createdAt": datetime.utcnow().isoformat()
    }
    result = tasks_collection.insert_one(task)
    return {"message": "Task added!! ✅", "task_id": str(result.inserted_id)}

# ── GET ALL TASK DATES ──
@router.get("/all-dates")
def get_all_task_dates(user_id: str = Depends(verify_token)):
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$date", "count": {"$sum": 1}}},
    ]
    results = list(tasks_collection.aggregate(pipeline))
    dates_with_tasks = [r["_id"] for r in results if r["count"] > 0]
    return {"dates": dates_with_tasks}

# ── GET TASKS BY DATE ──
@router.get("/{date}")
def get_tasks_by_date(date: str, user_id: str = Depends(verify_token)):
    tasks = tasks_collection.find({"user_id": user_id, "date": date})
    result = []
    for task in tasks:
        result.append({
            "id": str(task["_id"]),
            "date": task["date"],
            "name": task["name"],
            "priority": task["priority"],
            "completed": task["completed"],
            "createdAt": task.get("createdAt", "")
        })
    return {"tasks": result}

# ── UPDATE TASK ──
@router.put("/update/{task_id}")
def update_task(task_id: str, data: TaskUpdateModel, user_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update!")
    result = tasks_collection.update_one(
        {"_id": ObjectId(task_id), "user_id": user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found!")
    return {"message": "Task updated!! ✅"}

# ── DELETE TASK ──
@router.delete("/delete/{task_id}")
def delete_task(task_id: str, user_id: str = Depends(verify_token)):
    result = tasks_collection.delete_one(
        {"_id": ObjectId(task_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found!")
    return {"message": "Task deleted!! 🗑️"}

# ── DELETE ALL COMPLETED TASKS BY DATE ──
@router.delete("/clear-completed/{date}")
def clear_completed_tasks(date: str, user_id: str = Depends(verify_token)):
    result = tasks_collection.delete_many(
        {"user_id": user_id, "date": date, "completed": True}
    )
    return {"message": f"Cleared {result.deleted_count} completed tasks!! 🧹"}