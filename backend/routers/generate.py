import os
import glob
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.cert_service import load_config, save_config, generate_participant_certificate
from services.db_service import add_history_entry

router = APIRouter(prefix="/api")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")

class PositionItem(BaseModel):
    x: float
    y: float
    font_size: Optional[int] = None
    color: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None

class ConfigModel(BaseModel):
    name: Optional[PositionItem] = None
    date: Optional[PositionItem] = None
    signature: Optional[PositionItem] = None

class GenerateRequest(BaseModel):
    event_date: str
    participants: List[Dict[str, str]]  # list of {"name": "...", "email": "..."}

def find_uploaded_file(folder: str, prefix: str) -> Optional[str]:
    search_path = os.path.join(UPLOADS_DIR, folder, f"{prefix}.*")
    files = glob.glob(search_path)
    if files:
        return files[0]
    return None

@router.get("/config")
def get_current_config():
    return load_config()

@router.post("/config")
def update_current_config(config: ConfigModel):
    # Convert Pydantic model to dict, filtering out None values
    config_dict = load_config()
    new_data = config.dict(exclude_unset=True, exclude_none=True)
    
    for key, value in new_data.items():
        if key in config_dict:
            config_dict[key].update(value)
        else:
            config_dict[key] = value
            
    save_config(config_dict)
    return {"message": "Config updated successfully", "config": config_dict}

@router.post("/preview")
def generate_preview(req: GenerateRequest):
    template_path = find_uploaded_file("templates", "template")
    signature_path = find_uploaded_file("signatures", "signature")
    font_path = find_uploaded_file("fonts", "custom_font")
    
    if not template_path:
        raise HTTPException(status_code=400, detail="Template certificate image has not been uploaded yet.")
    
    # Fallback font if custom_font is not uploaded
    if not font_path:
        # Use default Arial or similar if system font, or we can use standard reportlab/PIL fallback
        # Let's search standard path or just return error
        font_path = "arial.ttf" # standard on windows, but let's be safe
        # Check if arial.ttf is accessible, otherwise use path to basic font
        if not os.path.exists(font_path):
            # Check C:\Windows\Fonts\arial.ttf
            win_font = r"C:\Windows\Fonts\arial.ttf"
            if os.path.exists(win_font):
                font_path = win_font
            else:
                raise HTTPException(status_code=400, detail="Font file (.ttf) has not been uploaded.")

    preview_name = "Jane Doe"
    output_filename = "preview.pdf"
    
    try:
        pdf_path = generate_participant_certificate(
            name=preview_name,
            date_str=req.event_date,
            template_path=template_path,
            font_path=font_path,
            signature_path=signature_path,
            output_filename=output_filename
        )
        return {
            "message": "Preview generated successfully",
            "filename": output_filename,
            "url": f"/api/download/{output_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")

@router.post("/generate")
def generate_certificates(req: GenerateRequest, background_tasks: BackgroundTasks):
    template_path = find_uploaded_file("templates", "template")
    signature_path = find_uploaded_file("signatures", "signature")
    font_path = find_uploaded_file("fonts", "custom_font")
    
    if not template_path:
        raise HTTPException(status_code=400, detail="Template certificate image has not been uploaded.")
    if not font_path:
        win_font = r"C:\Windows\Fonts\arial.ttf"
        if os.path.exists(win_font):
            font_path = win_font
        else:
            raise HTTPException(status_code=400, detail="Font file (.ttf) has not been uploaded.")

    success_count = 0
    errors = []
    
    # Clean duplicates in request if duplicate email detection is desired
    seen_emails = set()
    unique_participants = []
    for p in req.participants:
        email = p.get("email", "").strip().lower()
        if email not in seen_emails:
            seen_emails.add(email)
            unique_participants.append(p)

    for participant in unique_participants:
        name = participant.get("name", "").strip()
        email = participant.get("email", "").strip()
        if not name or not email:
            continue
            
        safe_name = name.replace(" ", "_")
        output_filename = f"{safe_name}.pdf"
        
        try:
            generate_participant_certificate(
                name=name,
                date_str=req.event_date,
                template_path=template_path,
                font_path=font_path,
                signature_path=signature_path,
                output_filename=output_filename
            )
            # Add to history database with status "Generated"
            add_history_entry(name, email, "Generated", output_filename)
            success_count += 1
        except Exception as e:
            errors.append({"name": name, "email": email, "error": str(e)})
            add_history_entry(name, email, "Failed Generation")

    return {
        "message": "Certificate generation completed",
        "total": len(unique_participants),
        "generated": success_count,
        "failed": len(errors),
        "errors": errors
    }
