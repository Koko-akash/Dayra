from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URL from .env
MONGODB_URL = os.getenv("MONGODB_URL")

# Connect to MongoDB Atlas
client = MongoClient(MONGODB_URL)

# Select our database
db = client["dayra_db"]

# Collections (like tables in SQL)
users_collection = db["users"]
diary_collection = db["diary_entries"]
tasks_collection = db["tasks"]
chat_collection = db["chat_history"]

print("✅ Connected to MongoDB Atlas successfully!!")