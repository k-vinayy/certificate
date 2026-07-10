import os
import shutil
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/api")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

# Ensure subfolders exist
TEMPLATES_DIR = os.path.join(UPLOADS_DIR, "templates")
SIGNATURES_DIR = os.path.join(UPLOADS_DIR, "signatures")
FONTS_DIR = os.path.join(UPLOADS_DIR, "fonts")
DATA_DIR = os.path.join(UPLOADS_DIR, "data")

for d in [TEMPLATES_DIR, SIGNATURES_DIR, FONTS_DIR, DATA_DIR]:
    os.makedirs(d, exist_ok=True)

@router.post("/upload-template")
async def upload_template(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG, JPG, and PDF templates are supported.")
    
    target_path = os.path.join(TEMPLATES_DIR, "template" + ext)
    
    # Save file
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Template uploaded successfully", "filename": "template" + ext, "path": target_path}

@router.post("/upload-signature")
async def upload_signature(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG, JPG, and JPEG signatures are supported.")
        
    target_path = os.path.join(SIGNATURES_DIR, "signature" + ext)
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Signature uploaded successfully", "filename": "signature" + ext, "path": target_path}

@router.post("/upload-font")
async def upload_font(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".ttf", ".otf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only TTF and OTF font files are supported.")
        
    target_path = os.path.join(FONTS_DIR, "custom_font" + ext)
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Font uploaded successfully", "filename": "custom_font" + ext, "path": target_path}

@router.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only Excel files (.xlsx, .xls) are supported.")
        
    target_path = os.path.join(DATA_DIR, "participants" + ext)
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read and parse participants
    try:
        df = pd.read_excel(target_path)
        # Normalize columns
        df.columns = [c.strip().lower() for c in df.columns]
        
        # Verify required columns (must have Name and Email)
        name_col = next((c for c in df.columns if 'name' in c), None)
        email_col = next((c for c in df.columns if 'email' in c), None)
        
        if not name_col or not email_col:
            raise HTTPException(status_code=400, detail="Excel sheet must contain 'Name' and 'Email' columns.")
            
        participants = []
        for index, row in df.iterrows():
            name = str(row[name_col]).strip()
            email = str(row[email_col]).strip()
            if name and email and name.lower() != 'nan' and email.lower() != 'nan':
                participants.append({"name": name, "email": email})
                
        return {
            "message": "Excel uploaded and parsed successfully",
            "participants": participants,
            "count": len(participants)
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to parse Excel file: {str(e)}")
