from fastapi import APIRouter, Depends, HTTPException
from database import chat_collection
from models.chat import ChatMessageModel, NewConversationModel
from middleware.auth import verify_token
from bson import ObjectId
from datetime import datetime
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

@router.get("/models")
def list_models():
    try:
        models = client.models.list()
        return {"models": [m.name for m in models]}
    except Exception as e:
        return {"error": str(e)}



BUDDY_SYSTEM_PROMPT = """
You are Buddy 🫂 — a warm, caring AI companion inside Dayra, a personal mental wellness app.

Who you are:
- A close, trusted friend who genuinely listens
- Positive, supportive and non-judgmental
- You talk casually and use emojis naturally 😊
- You NEVER claim to be a doctor or therapist

How you respond:
- Always listen first before giving advice
- Ask follow up questions to understand better
- Keep responses short and conversational (2-4 sentences max)
- Match the user's energy — calm when they're sad, fun when they're happy

When someone is struggling:
- Validate their feelings first ("That sounds really tough 💙")
- Suggest helpful things like music, books, walks, breathing exercises
- Share positive affirmations gently

When situation seems serious:
- Always encourage professional help kindly
- Mention they can talk to a trusted friend or family member
- Never ignore signs of crisis

Remember:
- You are NOT a replacement for therapy
- You ARE a safe space to express feelings
- Every conversation is private and judgment-free 🌿
"""

# ── START NEW CONVERSATION ──
@router.post("/new")
def new_conversation(data: NewConversationModel, user_id: str = Depends(verify_token)):
    conversation = {
        "user_id": user_id,
        "title": data.title,
        "messages": [],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    result = chat_collection.insert_one(conversation)
    return {
        "message": "New conversation started!! 💬",
        "conversation_id": str(result.inserted_id)
    }

# ── SEND MESSAGE ──
@router.post("/chat")
def chat(data: ChatMessageModel, user_id: str = Depends(verify_token)):
    if not data.conversation_id:
        raise HTTPException(status_code=400, detail="conversation_id is required!")

    conversation = chat_collection.find_one({
        "_id": ObjectId(data.conversation_id),
        "user_id": user_id
    })
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found!")

    # Build conversation history for context
    history_text = ""
    for msg in conversation["messages"][-10:]:  # last 10 messages for context
        sender = "User" if msg["sender"] == "user" else "Buddy"
        history_text += f"{sender}: {msg['text']}\n"

    # Hybrid prompt — system + history + new message
    full_prompt = f"""{BUDDY_SYSTEM_PROMPT}

Previous conversation:
{history_text if history_text else "This is the start of the conversation."}

User: {data.message}
Buddy:"""

    try:
        response = client.models.generate_content(
    model="models/gemini-2.5-flash",
    contents=full_prompt
)
        buddy_reply = response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")

    # Save messages to MongoDB
    user_message = {
        "sender": "user",
        "text": data.message,
        "timestamp": datetime.utcnow().isoformat()
    }
    buddy_message = {
        "sender": "buddy",
        "text": buddy_reply,
        "timestamp": datetime.utcnow().isoformat()
    }

    update_data = {
        "$push": {"messages": {"$each": [user_message, buddy_message]}},
        "$set": {"updatedAt": datetime.utcnow().isoformat()}
    }

    # Auto title from first message
    if not conversation["messages"]:
        update_data["$set"]["title"] = data.message[:30]

    chat_collection.update_one(
        {"_id": ObjectId(data.conversation_id)},
        update_data
    )

    return {
        "reply": buddy_reply,
        "conversation_id": data.conversation_id
    }

# ── GET ALL CONVERSATIONS ──
@router.get("/conversations")
def get_conversations(user_id: str = Depends(verify_token)):
    conversations = chat_collection.find(
        {"user_id": user_id},
        {"messages": 0}
    ).sort("updatedAt", -1)
    result = []
    for conv in conversations:
        result.append({
            "id": str(conv["_id"]),
            "title": conv.get("title", "New Conversation"),
            "createdAt": conv.get("createdAt", ""),
            "updatedAt": conv.get("updatedAt", "")
        })
    return {"conversations": result}

# ── GET CONVERSATION MESSAGES ──
@router.get("/conversation/{conversation_id}")
def get_conversation(conversation_id: str, user_id: str = Depends(verify_token)):
    conversation = chat_collection.find_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id
    })
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found!")
    return {
        "id": str(conversation["_id"]),
        "title": conversation.get("title", "New Conversation"),
        "messages": conversation["messages"]
    }

# ── DELETE CONVERSATION ──
@router.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: str, user_id: str = Depends(verify_token)):
    result = chat_collection.delete_one({
        "_id": ObjectId(conversation_id),
        "user_id": user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found!")
    return {"message": "Conversation deleted!! 🗑️"}

# ── RENAME CONVERSATION ──
@router.put("/conversation/{conversation_id}/rename")
def rename_conversation(
    conversation_id: str,
    data: NewConversationModel,
    user_id: str = Depends(verify_token)
):
    result = chat_collection.update_one(
        {"_id": ObjectId(conversation_id), "user_id": user_id},
        {"$set": {"title": data.title}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found!")
    return {"message": "Conversation renamed!! ✅"}