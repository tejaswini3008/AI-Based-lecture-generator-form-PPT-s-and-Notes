from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import shutil
import os
import json

from services.ppt_parser import extract_text_from_ppt
from services.pdf_parser import extract_text_from_pdf
from services.lecture_generator import generate_lecture_stream, generate_summary_stream, generate_quiz_stream

app = FastAPI(title="AI Lecture Generator")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "Backend Running Successfully"}


async def stream_content(content, subject, level, type):
    """Stream content generation in real-time based on type"""
    if type == "lecture":
        response = generate_lecture_stream(content, subject, level)
    elif type == "summary":
        response = generate_summary_stream(content, subject, level)
    elif type == "quiz":
        response = generate_quiz_stream(content, subject, level)
    else:
        response = generate_lecture_stream(content, subject, level)  # default
    
    for line in response.iter_lines():
        if line:
            data = json.loads(line)
            chunk = data.get("response", "")
            if chunk:
                yield chunk.encode() + b"\n"


@app.post("/generate-lecture/")
async def generate(
    file: UploadFile = File(...),
    subject: str = Form(...),
    level: str = Form(...),
    type: str = Form("lecture")
):

    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    if file.filename.endswith(".pptx"):
        content = extract_text_from_ppt(file_path)

    elif file.filename.endswith(".pdf"):
        content = extract_text_from_pdf(file_path)

    else:
        return {"error": "Unsupported file type"}

    # Return streaming response
    return StreamingResponse(
        stream_content(content, subject, level, type),
        media_type="text/event-stream"
    )


@app.post("/generate-qa/")
async def answer_question(
    file: UploadFile = File(...),
    question: str = Form(...),
    subject: str = Form(...),
    level: str = Form(...)
):
    file_path = f"{UPLOAD_DIR}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if file.filename.endswith(".pptx"):
        content = extract_text_from_ppt(file_path)
    elif file.filename.endswith(".pdf"):
        content = extract_text_from_pdf(file_path)
    else:
        return {"error": "Unsupported file type"}

    from services.lecture_generator import generate_qa_stream

    return StreamingResponse(
        generate_qa_stream(content, subject, level, question),
        media_type="text/event-stream"
    )
