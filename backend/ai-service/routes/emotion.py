from fastapi import APIRouter, Depends, HTTPException
from database import diary_collection
from models.emotion import EmotionAnalysisModel, MoodReportModel
from middleware.auth import verify_token
from transformers import pipeline
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

router = APIRouter()

# Load emotion model once at startup
print("🧠 Loading emotion detection model...")
emotion_pipeline = pipeline(
    "text-classification",
    model="SamLowe/roberta-base-go_emotions",
    top_k=None
)
print("✅ Emotion model loaded!!")

# Emotion weights for wellness score
emotion_weights = {
    "admiration": 3, "amusement": 3, "approval": 2, "caring": 3,
    "curiosity": 2, "desire": 1, "excitement": 4, "gratitude": 4,
    "joy": 5, "love": 5, "optimism": 4, "pride": 3, "relief": 3,
    "realization": 1, "surprise": 1, "neutral": 0,
    "confusion": -1, "embarrassment": -1, "nervousness": -2,
    "annoyance": -2, "disappointment": -2, "disapproval": -2,
    "disgust": -3, "fear": -3, "remorse": -3, "sadness": -3,
    "anger": -4, "grief": -5
}

# Map emotions to emojis
emotion_to_emoji = {
    # Very positive
    "joy": "😄",
    "excitement": "🤩",
    "love": "🥰",
    "admiration": "😍",
    "amusement": "😂",
    "gratitude": "🙏",
    "pride": "😎",
    "relief": "😮‍💨",
    "optimism": "🌟",
    "caring": "🤗",

    # Mildly positive
    "approval": "👍",
    "desire": "😏",
    "realization": "💡",

    # Neutral
    "neutral": "😐",
    "surprise": "😲",
    "curiosity": "🤔",
    "confusion": "😕",

    # Mildly negative
    "nervousness": "😰",
    "embarrassment": "😳",
    "disappointment": "😔",
    "disapproval": "🙁",
    "annoyance": "😒",

    # Very negative
    "sadness": "😢",
    "grief": "😭",
    "remorse": "😞",
    "fear": "😨",
    "anger": "😠",
    "disgust": "🤢",
}

# ── ANALYSE SINGLE ENTRY ──
@router.post("/analyse")
def analyse_emotion(data: EmotionAnalysisModel, user_id: str = Depends(verify_token)):
    if not data.text or len(data.text.strip()) < 3:
        raise HTTPException(status_code=400, detail="Text too short for analysis!")

    try:
        # Run emotion detection
        results = emotion_pipeline(data.text[:512])[0]

        # Filter emotions above threshold
        threshold = 0.10
        detected = [r for r in results if r["score"] > threshold]
        detected.sort(key=lambda x: x["score"], reverse=True)

        # Calculate wellness score
        wellness_score = 0
        for emotion in detected:
            weight = emotion_weights.get(emotion["label"], 0)
            wellness_score += emotion["score"] * weight

        # Normalize to 0-10
        normalized_score = max(0, min(10, (wellness_score + 5) * 1.0))

        # Top 3 emotions
        top_emotions = detected[:3]

        # Get dominant emotion and its emoji
        dominant = top_emotions[0]["label"] if top_emotions else "neutral"
        suggested_emoji = emotion_to_emoji.get(dominant, "😐")

        return {
            "emotions": [
                {
                    "label": e["label"],
                    "score": round(e["score"], 3),
                    "weight": emotion_weights.get(e["label"], 0)
                }
                for e in top_emotions
            ],
            "wellness_score": round(normalized_score, 2),
            "dominant_emotion": dominant,
            "suggested_emoji": suggested_emoji
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# ── GENERATE MOOD REPORT ──
@router.post("/report")
def generate_mood_report(data: MoodReportModel, user_id: str = Depends(verify_token)):
    # Get entries in date range
    entries = list(diary_collection.find({
        "user_id": user_id,
        "date": {"$gte": data.start_date, "$lte": data.end_date}
    }))

    if not entries:
        raise HTTPException(status_code=404, detail="No entries found in this date range!")

    # Analyse each entry
    analysed = []
    for entry in entries:
        try:
            results = emotion_pipeline(entry["text"][:512])[0]
            detected = [r for r in results if r["score"] > 0.10]
            detected.sort(key=lambda x: x["score"], reverse=True)

            wellness_score = sum(
                r["score"] * emotion_weights.get(r["label"], 0)
                for r in detected
            )
            normalized = max(0, min(10, (wellness_score + 5) * 1.0))

            analysed.append({
                "date": entry["date"],
                "mood": entry.get("mood", "😐"),
                "dominant_emotion": detected[0]["label"] if detected else "neutral",
                "wellness_score": round(normalized, 2),
                "text_preview": entry["text"][:100]
            })
        except:
            continue

    # Generate AI summary using Gemini
    summary_prompt = f"""
    Based on these journal entries from {data.start_date} to {data.end_date}:
    {[f"Date: {a['date']}, Emotion: {a['dominant_emotion']}, Score: {a['wellness_score']}" for a in analysed]}

    Write a warm, empathetic 3-4 sentence summary of the user's emotional journey
    during this period. Be encouraging and supportive. Don't use bullet points.
    """

    try:
        response = gemini_client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=summary_prompt
        )
        ai_summary = response.text
    except:
        ai_summary = "Your emotional journey during this period shows meaningful patterns of growth and self-reflection. Keep journaling to track your progress! 🌱"

    avg_score = sum(a["wellness_score"] for a in analysed) / len(analysed)

    # Calculate trend
    def get_trend(analysed):
        if len(analysed) < 2:
            return "stable"
        mid = len(analysed) // 2
        first_half = sum(a["wellness_score"] for a in analysed[:mid]) / mid
        second_half = sum(a["wellness_score"] for a in analysed[mid:]) / (len(analysed) - mid)
        diff = second_half - first_half
        if diff > 0.5:
            return "improving"
        elif diff < -0.5:
            return "declining"
        return "stable"

    # Calculate wellness status
    def get_wellness_status(avg):
        if avg >= 8:
            return {"label": "Thriving", "emoji": "🌟", "color": "#2D6A4F"}
        elif avg >= 6:
            return {"label": "Doing Well", "emoji": "😊", "color": "#4A9B6F"}
        elif avg >= 4:
            return {"label": "Balanced", "emoji": "🌤️", "color": "#B7770D"}
        elif avg >= 2:
            return {"label": "Struggling", "emoji": "💙", "color": "#2980B9"}
        return {"label": "Needs Support", "emoji": "🆘", "color": "#C0392B"}

    trend = get_trend(analysed)
    wellness_status = get_wellness_status(avg_score)

    trend_data = {
        "improving": {"label": "Improving", "emoji": "📈", "color": "#2D6A4F"},
        "declining": {"label": "Declining", "emoji": "📉", "color": "#C0392B"},
        "stable": {"label": "Stable", "emoji": "➡️", "color": "#B7770D"}
    }

    return {
        "entries_analysed": len(analysed),
        "average_wellness_score": round(avg_score, 2),
        "daily_analysis": analysed,
        "ai_summary": ai_summary,
        "period": f"{data.start_date} to {data.end_date}",
        "wellness_status": wellness_status,
        "trend": trend_data[trend]
    }