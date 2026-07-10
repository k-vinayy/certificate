import os
import json
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
GENERATED_DIR = os.path.join(BASE_DIR, "generated")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(GENERATED_DIR, exist_ok=True)

def load_config() -> Dict[str, Any]:
    if not os.path.exists(CONFIG_PATH):
        # Fallback default
        return {
            "name": {"x": 50, "y": 50, "font_size": 58, "color": "#000000"},
            "date": {"x": 20, "y": 80, "font_size": 24, "color": "#000000"},
            "signature": {"x": 80, "y": 80, "width": 15, "height": 10}
        }
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_config(config: Dict[str, Any]):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

def hex_to_rgb(hex_str: str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def generate_participant_certificate(
    name: str,
    date_str: str,
    template_path: str,
    font_path: str,
    signature_path: str,
    output_filename: str
) -> str:
    config = load_config()
    
    # Open template image
    with Image.open(template_path) as img:
        # Convert to RGB mode if not already (required for PDF export in Pillow)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        W, H = img.size
        draw = ImageDraw.Draw(img)
        
        # 1. Draw Name
        name_cfg = config.get("name", {})
        x_pct = name_cfg.get("x", 50)
        y_pct = name_cfg.get("y", 50)
        start_font_size = name_cfg.get("font_size", 58)
        color_hex = name_cfg.get("color", "#000000")
        color_rgb = hex_to_rgb(color_hex)
        
        font_size = start_font_size
        font = ImageFont.truetype(font_path, font_size)
        
        # Max width name can take (e.g., 85% of template width)
        max_width = int(W * 0.85)
        
        # Name Fitting: reduce font size until it fits
        while font_size > 12:
            # Get text bounding box: (left, top, right, bottom)
            bbox = draw.textbbox((0, 0), name, font=font)
            text_w = bbox[2] - bbox[0]
            if text_w <= max_width:
                break
            font_size -= 2
            font = ImageFont.truetype(font_path, font_size)
            
        # Re-calculate final text dimensions
        bbox = draw.textbbox((0, 0), name, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        # Centering calculations
        name_x = int((W * (x_pct / 100)) - (text_w / 2))
        name_y = int((H * (y_pct / 100)) - (text_h / 2))
        
        draw.text((name_x, name_y), name, font=font, fill=color_rgb)
        
        # 2. Draw Date
        date_cfg = config.get("date", {})
        date_x_pct = date_cfg.get("x", 20)
        date_y_pct = date_cfg.get("y", 80)
        date_font_size = date_cfg.get("font_size", 24)
        date_color_hex = date_cfg.get("color", "#000000")
        date_color_rgb = hex_to_rgb(date_color_hex)
        
        date_font = ImageFont.truetype(font_path, date_font_size)
        date_bbox = draw.textbbox((0, 0), date_str, font=date_font)
        date_w = date_bbox[2] - date_bbox[0]
        date_h = date_bbox[3] - date_bbox[1]
        
        # Draw date centered on its configured x percentage coordinate (or left-aligned relative to it)
        date_x = int((W * (date_x_pct / 100)) - (date_w / 2))
        date_y = int((H * (date_y_pct / 100)) - (date_h / 2))
        
        draw.text((date_x, date_y), date_str, font=date_font, fill=date_color_rgb)
        
        # 3. Paste Signature
        if signature_path and os.path.exists(signature_path):
            sig_cfg = config.get("signature", {})
            sig_x_pct = sig_cfg.get("x", 80)
            sig_y_pct = sig_cfg.get("y", 80)
            sig_w_pct = sig_cfg.get("width", 15)
            sig_h_pct = sig_cfg.get("height", 10)
            
            sig_w = int(W * (sig_w_pct / 100))
            sig_h = int(H * (sig_h_pct / 100))
            
            with Image.open(signature_path) as sig_img:
                sig_img = sig_img.resize((sig_w, sig_h), Image.Resampling.LANCZOS)
                
                sig_x = int((W * (sig_x_pct / 100)) - (sig_w / 2))
                sig_y = int((H * (sig_y_pct / 100)) - (sig_h / 2))
                
                # Check if signature has alpha channel for transparent pasting
                if sig_img.mode in ('RGBA', 'LA') or (sig_img.mode == 'P' and 'transparency' in sig_img.info):
                    img.paste(sig_img, (sig_x, sig_y), sig_img)
                else:
                    img.paste(sig_img, (sig_x, sig_y))
                    
        # Save as high-resolution PDF (300 DPI)
        output_path = os.path.join(GENERATED_DIR, output_filename)
        img.save(output_path, "PDF", resolution=300.0, quality=100)
        
        return output_path
