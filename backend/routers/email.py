import os
import time
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.email_service import send_certificate_email, get_smtp_config, save_smtp_config, create_smtp_session
from services.db_service import load_history, update_history_status

router = APIRouter(prefix="/api")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
GENERATED_DIR = os.path.join(BASE_DIR, "generated")

# Global in-memory progress tracker
sending_progress = {
    "status": "idle",
    "total": 0,
    "sent": 0,
    "failed": 0,
    "current_recipient": ""
}

class SMTPConfigModel(BaseModel):
    host: str
    port: int
    email: str
    password: str

class SendMailsRequest(BaseModel):
    retry_failed_only: Optional[bool] = False

@router.get("/smtp-config")
def get_smtp_settings():
    cfg = get_smtp_config()
    # Mask password for security
    masked_cfg = cfg.copy()
    if masked_cfg.get("SMTP_PASSWORD"):
        masked_cfg["SMTP_PASSWORD"] = "********"
    return masked_cfg

@router.post("/smtp-config")
def save_smtp_settings(config: SMTPConfigModel):
    try:
        save_smtp_config(
            host=config.host,
            port=config.port,
            email=config.email,
            password=config.password
        )
        return {"message": "SMTP settings saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")

@router.get("/send-status")
def get_send_status():
    return sending_progress

def start_email_dispatch_task(retry_failed_only: bool):
    global sending_progress
    sending_progress["status"] = "sending"
    sending_progress["sent"] = 0
    sending_progress["failed"] = 0
    sending_progress["current_recipient"] = ""
    
    history = load_history()
    
    # Filter participants based on criteria
    targets = []
    for entry in history:
        status = entry.get("status")
        if retry_failed_only:
            if status in ["Failed", "Failed Generation"]:
                targets.append(entry)
        else:
            if status in ["Generated", "Failed"]:
                targets.append(entry)
                
    sending_progress["total"] = len(targets)
    if not targets:
        sending_progress["status"] = "idle"
        return
        
    smtp_server = None
    try:
        try:
            smtp_server = create_smtp_session(timeout=60)
        except Exception as e:
            print(f"Warning: Could not pre-establish SMTP session: {e}")
            smtp_server = None

        for entry in targets:
            name = entry.get("name")
            email = entry.get("email")
            filename = entry.get("filename")
            pdf_path = os.path.join(GENERATED_DIR, filename)
            
            sending_progress["current_recipient"] = f"{name} ({email})"
            
            # Verify file exists
            if not os.path.exists(pdf_path):
                sending_progress["failed"] += 1
                update_history_status(email, "Failed")
                continue
                
            sent_successfully = False
            for attempt in range(2):
                try:
                    if smtp_server is None:
                        smtp_server = create_smtp_session(timeout=60)
                    send_certificate_email(name, email, pdf_path, server=smtp_server)
                    sent_successfully = True
                    break
                except Exception as e:
                    print(f"Email attempt {attempt + 1} failed for {email}: {e}")
                    if smtp_server is not None:
                        try:
                            smtp_server.quit()
                        except Exception:
                            try:
                                smtp_server.close()
                            except Exception:
                                pass
                        smtp_server = None
                    if attempt == 0:
                        time.sleep(2)
                        
            if sent_successfully:
                sending_progress["sent"] += 1
                update_history_status(email, "Sent")
            else:
                sending_progress["failed"] += 1
                update_history_status(email, "Failed")
                
            # Inter-message delay to avoid Gmail rate-limiting / spam flag
            time.sleep(1.2)
    finally:
        if smtp_server is not None:
            try:
                smtp_server.quit()
            except Exception:
                try:
                    smtp_server.close()
                except Exception:
                    pass
        sending_progress["status"] = "completed"

@router.post("/send-mails")
def trigger_sending(req: SendMailsRequest, background_tasks: BackgroundTasks):
    global sending_progress
    if sending_progress["status"] == "sending":
        raise HTTPException(status_code=400, detail="Mailing job is already running.")
        
    # Check SMTP configuration
    cfg = get_smtp_config()
    if not cfg["SMTP_HOST"] or not cfg["SMTP_EMAIL"] or not cfg["SMTP_PASSWORD"]:
        raise HTTPException(status_code=400, detail="SMTP credentials are not configured. Please save them in Settings first.")
        
    background_tasks.add_task(start_email_dispatch_task, req.retry_failed_only)
    return {"message": "Mailing job started in the background."}
