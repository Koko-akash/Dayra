from pydantic import BaseModel
from typing import Optional

class TaskModel(BaseModel):
    date: str
    name: str
    priority: str
    completed: bool = False

class TaskUpdateModel(BaseModel):
    name: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None