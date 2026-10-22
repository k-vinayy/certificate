import os
import zipfile
import io
import glob
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from services.db_service import load_history, update_history_status
from services.email_service import send_certificate_email

router = APIRouter(prefix="/api")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

@router.get("/history")
def get_history():
    return load_history()

@router.get("/download/{filename}")
def download_pdf(filename: str):
    # Sanitize path to prevent directory traversal
    clean_filename = os.path.basename(filename)
    
    # Handle template requests from position editor
    if clean_filename.startswith("template"):
        templates_dir = os.path.join(UPLOADS_DIR, "templates")
        matching_files = glob.glob(os.path.join(templates_dir, "template.*"))
        if matching_files:
            matching_files.sort(key=os.path.getmtime, reverse=True)
            file_path = matching_files[0]
            ext = os.path.splitext(file_path)[1].lower()
            media_type = "image/png" if ext == ".png" else "image/jpeg"
            return FileResponse(
                file_path,
                media_type=media_type,
                filename=os.path.basename(file_path),
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
            )
        raise HTTPException(status_code=404, detail="Template certificate image not found.")
        
    file_path = os.path.join(GENERATED_DIR, clean_filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Certificate file not found.")
        
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=clean_filename,
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@router.get("/download-zip")
def download_all_zip():
    if not os.path.exists(GENERATED_DIR) or not os.listdir(GENERATED_DIR):
        raise HTTPException(status_code=400, detail="No certificates generated yet.")
        
    # Create in-memory zip file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for root, _, files in os.walk(GENERATED_DIR):
            for file in files:
                if file.endswith(".pdf") and file != "preview.pdf":
                    file_path = os.path.join(root, file)
                    zip_file.write(file_path, file)
                    
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=certificates.zip"}
    )

@router.post("/resend/{email}")
def resend_individual_email(email: str):
    history = load_history()
    entry = next((item for item in history if item["email"] == email), None)
    
    if not entry:
        raise HTTPException(status_code=404, detail="Participant record not found.")
        
    filename = entry.get("filename")
    name = entry.get("name")
    pdf_path = os.path.join(GENERATED_DIR, filename)
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=400, detail="Certificate PDF not found. Please regenerate first.")
        
    try:
        success = send_certificate_email(name, email, pdf_path)
        if success:
            update_history_status(email, "Sent")
            return {"message": f"Email successfully resent to {email}"}
        else:
            update_history_status(email, "Failed")
            raise HTTPException(status_code=500, detail="Failed to send email.")
    except Exception as e:
        update_history_status(email, "Failed")
        raise HTTPException(status_code=500, detail=f"SMTP Error: {str(e)}")
