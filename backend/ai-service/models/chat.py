from pydantic import BaseModel
from typing import Optional

class ChatMessageModel(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class NewConversationModel(BaseModel):
    title: Optional[str] = "New Conversation"