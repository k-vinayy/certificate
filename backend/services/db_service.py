import os
import json
from datetime import datetime
from typing import List, Dict, Any

HISTORY_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "history.json")

def load_history() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(history: List[Dict[str, Any]]):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

def add_history_entry(name: str, email: str, status: str, filename: str = ""):
    history = load_history()
    
    # Check if entry exists to update or add
    existing = next((item for item in history if item["email"] == email), None)
    if existing:
        existing["status"] = status
        existing["date_sent"] = datetime.now().isoformat()
        if filename:
            existing["filename"] = filename
    else:
        history.append({
            "name": name,
            "email": email,
            "status": status,
            "date_sent": datetime.now().isoformat(),
            "filename": filename or f"{name.replace(' ', '_')}.pdf"
        })
    save_history(history)

def update_history_status(email: str, status: str):
    history = load_history()
    for entry in history:
        if entry["email"] == email:
            entry["status"] = status
            entry["date_sent"] = datetime.now().isoformat()
            break
    save_history(history)
