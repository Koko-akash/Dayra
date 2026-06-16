from pydantic import BaseModel

class EmotionAnalysisModel(BaseModel):
    text: str

class MoodReportModel(BaseModel):
    start_date: str
    end_date: str