from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import cloudinary
import cloudinary.uploader
import json
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ['CLOUDINARY_CLOUD_NAME'],
    api_key=os.environ['CLOUDINARY_API_KEY'],
    api_secret=os.environ['CLOUDINARY_API_SECRET']
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Define Models
class FloorPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    file_type: str  # pdf, image, canvas
    file_url: Optional[str] = None
    canvas_data: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str = "uploaded"  # uploaded, processing, ready, error
    three_d_data: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FloorPlanCreate(BaseModel):
    user_id: str
    name: str
    file_type: str
    canvas_data: Optional[str] = None

class FloorPlanUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    three_d_data: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: str  # user, assistant
    content: str
    model: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    conversation_id: str
    content: str
    model: str = "gpt-5"  # gpt-5 or claude-4-sonnet-20250514

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConversationCreate(BaseModel):
    user_id: str
    title: str = "Nuova conversazione"

class UserPreference(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    preferred_model: str = "gpt-5"
    render_quality: str = "high"
    default_wall_height: float = 2.8
    preferences: Dict[str, Any] = {}
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserPreferenceUpdate(BaseModel):
    preferred_model: Optional[str] = None
    render_quality: Optional[str] = None
    default_wall_height: Optional[float] = None
    preferences: Optional[Dict[str, Any]] = None

class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    floor_plan_id: Optional[str] = None
    feedback_type: str  # suggestion, correction, rating
    content: str
    rating: Optional[int] = None
    applied: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    user_id: str
    floor_plan_id: Optional[str] = None
    feedback_type: str
    content: str
    rating: Optional[int] = None

class RenderRequest(BaseModel):
    floor_plan_id: str
    quality: str = "high"  # low, medium, high
    style: str = "realistic"  # realistic, wireframe, stylized

class ChatRequest(BaseModel):
    conversation_id: str
    message: str
    model: str = "gpt-5"

# Routes
@api_router.get("/")
async def root():
    return {"message": "3D Floor Plan API", "version": "1.0.0"}

# FloorPlans endpoints
@api_router.post("/floorplans", response_model=FloorPlan)
async def create_floorplan(input: FloorPlanCreate):
    floorplan_dict = input.model_dump()
    floorplan_obj = FloorPlan(**floorplan_dict)
    
    doc = floorplan_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.floorplans.insert_one(doc)
    return floorplan_obj

@api_router.get("/floorplans", response_model=List[FloorPlan])
async def get_floorplans(user_id: Optional[str] = None):
    query = {"user_id": user_id} if user_id else {}
    floorplans = await db.floorplans.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for fp in floorplans:
        if isinstance(fp.get('created_at'), str):
            fp['created_at'] = datetime.fromisoformat(fp['created_at'])
        if isinstance(fp.get('updated_at'), str):
            fp['updated_at'] = datetime.fromisoformat(fp['updated_at'])
    
    return floorplans

@api_router.get("/floorplans/{floorplan_id}", response_model=FloorPlan)
async def get_floorplan(floorplan_id: str):
    floorplan = await db.floorplans.find_one({"id": floorplan_id}, {"_id": 0})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    
    if isinstance(floorplan.get('created_at'), str):
        floorplan['created_at'] = datetime.fromisoformat(floorplan['created_at'])
    if isinstance(floorplan.get('updated_at'), str):
        floorplan['updated_at'] = datetime.fromisoformat(floorplan['updated_at'])
    
    return floorplan

@api_router.patch("/floorplans/{floorplan_id}", response_model=FloorPlan)
async def update_floorplan(floorplan_id: str, update: FloorPlanUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.floorplans.update_one(
        {"id": floorplan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    
    return await get_floorplan(floorplan_id)

@api_router.delete("/floorplans/{floorplan_id}")
async def delete_floorplan(floorplan_id: str):
    result = await db.floorplans.delete_one({"id": floorplan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    return {"message": "Floor plan deleted successfully"}

@api_router.post("/floorplans/{floorplan_id}/upload")
async def upload_floorplan_file(floorplan_id: str, file: UploadFile = File(...)):
    try:
        # Upload to Cloudinary
        contents = await file.read()
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="floorplans",
            resource_type="auto"
        )
        
        # Update floor plan with file URL
        await db.floorplans.update_one(
            {"id": floorplan_id},
            {"$set": {
                "file_url": upload_result['secure_url'],
                "thumbnail_url": upload_result.get('thumbnail_url', upload_result['secure_url']),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "message": "File uploaded successfully",
            "file_url": upload_result['secure_url'],
            "thumbnail_url": upload_result.get('thumbnail_url', upload_result['secure_url'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.post("/floorplans/{floorplan_id}/convert-3d")
async def convert_to_3d(floorplan_id: str):
    floorplan = await db.floorplans.find_one({"id": floorplan_id}, {"_id": 0})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    
    # Simple mock 3D conversion - in production, this would use actual image processing/AI
    three_d_data = {
        "rooms": [
            {"id": "room1", "type": "living", "width": 5, "depth": 4, "height": 2.8},
            {"id": "room2", "type": "bedroom", "width": 3.5, "depth": 3, "height": 2.8}
        ],
        "walls": [
            {"start": [0, 0], "end": [5, 0], "height": 2.8, "thickness": 0.2},
            {"start": [5, 0], "end": [5, 4], "height": 2.8, "thickness": 0.2}
        ],
        "doors": [{"position": [2.5, 0], "width": 0.9, "height": 2.1}],
        "windows": [{"position": [1, 2.8], "width": 1.2, "height": 1.5}]
    }
    
    await db.floorplans.update_one(
        {"id": floorplan_id},
        {"$set": {
            "three_d_data": json.dumps(three_d_data),
            "status": "ready",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Conversion completed", "three_d_data": three_d_data}

# Chat endpoints
@api_router.post("/conversations", response_model=Conversation)
async def create_conversation(input: ConversationCreate):
    conv_dict = input.model_dump()
    conv_obj = Conversation(**conv_dict)
    
    doc = conv_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.conversations.insert_one(doc)
    return conv_obj

@api_router.get("/conversations", response_model=List[Conversation])
async def get_conversations(user_id: str):
    conversations = await db.conversations.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for conv in conversations:
        if isinstance(conv.get('created_at'), str):
            conv['created_at'] = datetime.fromisoformat(conv['created_at'])
    
    return conversations

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(conversation_id: str):
    messages = await db.messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return messages

@api_router.post("/chat")
async def chat_with_ai(request: ChatRequest):
    try:
        # Store user message
        user_msg = Message(
            conversation_id=request.conversation_id,
            role="user",
            content=request.message
        )
        user_doc = user_msg.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        await db.messages.insert_one(user_doc)
        
        # Get conversation history
        messages = await db.messages.find(
            {"conversation_id": request.conversation_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(1000)
        
        # Determine provider and model
        if request.model.startswith("gpt"):
            provider = "openai"
            model = request.model
        elif request.model.startswith("claude"):
            provider = "anthropic"
            model = request.model
        else:
            provider = "openai"
            model = "gpt-5"
        
        # Create AI chat
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=request.conversation_id,
            system_message="""Sei un assistente AI esperto in architettura e design 3D. 
            Aiuti gli utenti a convertire piantine 2D in modelli 3D, suggerisci miglioramenti 
            e rispondi a domande su design, rendering e layout degli spazi. Impari dalle 
            preferenze degli utenti e dai loro feedback per offrire suggerimenti sempre più personalizzati."""
        ).with_model(provider, model)
        
        # Send message
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Store assistant message
        assistant_msg = Message(
            conversation_id=request.conversation_id,
            role="assistant",
            content=response,
            model=f"{provider}/{model}"
        )
        assistant_doc = assistant_msg.model_dump()
        assistant_doc['timestamp'] = assistant_doc['timestamp'].isoformat()
        await db.messages.insert_one(assistant_doc)
        
        return {
            "message": response,
            "model": f"{provider}/{model}"
        }
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

# User preferences
@api_router.get("/preferences/{user_id}", response_model=UserPreference)
async def get_user_preferences(user_id: str):
    prefs = await db.user_preferences.find_one({"user_id": user_id}, {"_id": 0})
    if not prefs:
        # Create default preferences
        default_prefs = UserPreference(user_id=user_id)
        doc = default_prefs.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.user_preferences.insert_one(doc)
        return default_prefs
    
    if isinstance(prefs.get('updated_at'), str):
        prefs['updated_at'] = datetime.fromisoformat(prefs['updated_at'])
    
    return prefs

@api_router.patch("/preferences/{user_id}", response_model=UserPreference)
async def update_user_preferences(user_id: str, update: UserPreferenceUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.user_preferences.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return await get_user_preferences(user_id)

# Feedback endpoints
@api_router.post("/feedback", response_model=Feedback)
async def create_feedback(input: FeedbackCreate):
    feedback_dict = input.model_dump()
    feedback_obj = Feedback(**feedback_dict)
    
    doc = feedback_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.feedback.insert_one(doc)
    
    # Learn from feedback (simple implementation)
    if feedback_obj.feedback_type == "suggestion":
        # Store suggestion for future use
        await db.learning_data.insert_one({
            "user_id": feedback_obj.user_id,
            "type": "suggestion",
            "content": feedback_obj.content,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    return feedback_obj

@api_router.get("/feedback", response_model=List[Feedback])
async def get_feedback(user_id: Optional[str] = None):
    query = {"user_id": user_id} if user_id else {}
    feedback_list = await db.feedback.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for fb in feedback_list:
        if isinstance(fb.get('created_at'), str):
            fb['created_at'] = datetime.fromisoformat(fb['created_at'])
    
    return feedback_list

# Render endpoint
@api_router.post("/render")
async def create_render(request: RenderRequest):
    floorplan = await db.floorplans.find_one({"id": request.floor_plan_id}, {"_id": 0})
    if not floorplan:
        raise HTTPException(status_code=404, detail="Floor plan not found")
    
    if not floorplan.get('three_d_data'):
        raise HTTPException(status_code=400, detail="Floor plan not converted to 3D yet")
    
    # Mock render process - in production, this would trigger actual rendering
    render_result = {
        "status": "completed",
        "quality": request.quality,
        "style": request.style,
        "render_url": floorplan.get('file_url', ''),
        "processing_time": "15s"
    }
    
    return render_result

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()