from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google import genai
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
import fitz
import os
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "https://legal-doc-analyzer-dun.vercel.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
security = HTTPBearer()

# --- Database Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    filename = Column(String)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)

Base.metadata.create_all(bind=engine)

# --- Auth Helpers ---

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: int, email: str, name: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
# --- Auth Routes ---

@app.get("/")
def read_root():
    return {"message": "Legal Doc Analyzer API is running"}

@app.post("/signup")
def signup(data: dict):
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Name, email and password required")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(name=name, email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)

        token = create_token(user.id, user.email, user.name)
        return {"token": token, "email": user.email, "name": user.name}
    finally:
        db.close()

@app.post("/login")
def login(data: dict):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        token = create_token(user.id, user.email, user.name)
        return {"token": token, "email": user.email, "name": user.name}
    finally:
        db.close()

# --- Analysis Route ---

@app.post("/analyze")
async def analyze_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    try:
        contents = await file.read()
        doc = fitz.open(stream=contents, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
        prompt = f"""
        You are a legal document analyzer.
        Analyze the following legal text and return a JSON array.
        Each item must have exactly these fields:
        - clause: the problematic clause from the text
        - risk_level: either "high", "medium", or "low"
        - explanation: plain English explanation of why it is risky

        Return only a valid JSON array. No extra text. No markdown. No backticks.

        Legal text: {text}
        """

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        try:
            result = json.loads(response.text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI returned invalid response. Please try again.")

        if not isinstance(result, list):
            raise HTTPException(status_code=500, detail="Unexpected AI response format.")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    db = SessionLocal()
    try:
        analysis = Analysis(
            user_id=current_user["user_id"],
            filename = file.filename, 
            result = result
        )
        db.add(analysis)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Analysis complete but failed to save to history. Please try again.")
    finally:
        db.close()

    return JSONResponse(content=result)

@app.get("/history")
def get_history(current_user: dict = Depends(get_current_user)):
    db = SessionLocal()
    try:
        analyses = db.query(Analysis).filter(
            Analysis.user_id == current_user["user_id"]
        ).order_by(Analysis.created_at.desc()).all()

        return [
            {
                "id": a.id,
                "filename": a.filename,
                "created_at": a.created_at.isoformat(),
                "result": a.result,
                "risk_summary": {
                    "high": sum(1 for r in a.result if r["risk_level"] == "high"),
                    "medium": sum(1 for r in a.result if r["risk_level"] == "medium"),
                    "low": sum(1 for r in a.result if r["risk_level"] == "low"),
                }
            }
            for a in analyses
        ]
    finally:
        db.close()
