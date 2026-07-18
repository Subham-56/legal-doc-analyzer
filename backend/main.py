from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import fitz
import os
import json

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True)
    filename = Column(String)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)

@app.get("/")
def read_root():
    return {"message": "Legal Doc Analyzer API is running"}

@app.post("/analyze")
async def analyze_document(file: UploadFile = File(...)):
    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()

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

    result = json.loads(response.text)

    db = SessionLocal()
    analysis = Analysis(
        filename = file.filename,
        result = result
    )
    db.add(analysis)
    db.commit()
    db.close()

    return JSONResponse(content=result)