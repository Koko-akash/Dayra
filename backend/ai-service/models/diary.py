from pydantic import BaseModel
from typing import Optional

class DiaryEntryModel(BaseModel):
    date: str
    text: str
    mood: str
    wordCount: int

class DiaryUpdateModel(BaseModel):
    text: Optional[str] = None
    mood: Optional[str] = None
    wordCount: Optional[int] = None