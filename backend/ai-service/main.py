from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from routes import auth, users, diary, tasks, buddy, emotion

load_dotenv()

security = HTTPBearer()

app = FastAPI(
    title="Dayra API",
    description="Backend for Dayra - AI Powered Mental Wellness Journal",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://handsaw-truffle-subgroup.ngrok-free.dev", "https://dayra.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/user", tags=["User"])
app.include_router(diary.router, prefix="/api/diary", tags=["Diary"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(buddy.router, prefix="/api/buddy", tags=["Buddy"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["Emotion"])

@app.get("/")
def root():
    return {"message": "Welcome to Dayra API!! 🌿"}

@app.get("/health")
def health():
    return {"status": "healthy", "app": "Dayra"}