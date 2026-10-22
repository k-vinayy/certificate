import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from dotenv import load_dotenv, set_key

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Load existing environment variables
load_dotenv(ENV_PATH)

def get_smtp_config():
    # Reload environment variables to pick up runtime updates
    load_dotenv(ENV_PATH, override=True)
    return {
        "SMTP_HOST": os.getenv("SMTP_HOST", ""),
        "SMTP_PORT": int(os.getenv("SMTP_PORT", "587")),
        "SMTP_EMAIL": os.getenv("SMTP_EMAIL", ""),
        "SMTP_PASSWORD": os.getenv("SMTP_PASSWORD", "")
    }

def save_smtp_config(host: str, port: int, email: str, password: str):
    # Ensure .env file exists
    if not os.path.exists(ENV_PATH):
        open(ENV_PATH, "w").close()
    
    set_key(ENV_PATH, "SMTP_HOST", host)
    set_key(ENV_PATH, "SMTP_PORT", str(port))
    set_key(ENV_PATH, "SMTP_EMAIL", email)
    set_key(ENV_PATH, "SMTP_PASSWORD", password)

def create_smtp_session(timeout: int = 60):
    config = get_smtp_config()
    if not config["SMTP_HOST"] or not config["SMTP_EMAIL"] or not config["SMTP_PASSWORD"]:
        raise ValueError("SMTP configuration is incomplete. Please set it in Settings.")
        
    port = config["SMTP_PORT"]
    if port == 465:
        server = smtplib.SMTP_SSL(config["SMTP_HOST"], port, timeout=timeout)
    else:
        server = smtplib.SMTP(config["SMTP_HOST"], port, timeout=timeout)
        server.ehlo()
        server.starttls()
        server.ehlo()
        
    server.login(config["SMTP_EMAIL"], config["SMTP_PASSWORD"])
    return server

def send_certificate_email(name: str, email: str, pdf_path: str, server=None) -> bool:
    config = get_smtp_config()
    
    if not config["SMTP_HOST"] or not config["SMTP_EMAIL"]:
        raise ValueError("SMTP configuration is incomplete. Please set it in Settings.")
        
    msg = MIMEMultipart()
    msg['From'] = f"Google Student Ambassador <{config['SMTP_EMAIL']}>"
    msg['To'] = email
    msg['Subject'] = "Your Participation Certificate"
    
    body = f"""Hello {name},

Thank you for participating in our Google Student Ambassador event.

Please find your participation certificate attached.

Regards,
Google Student Ambassador"""
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach PDF
    filename = os.path.basename(pdf_path)
    try:
        with open(pdf_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f"attachment; filename= {filename}",
            )
            msg.attach(part)
    except Exception as e:
        print(f"Error attaching PDF: {e}")
        return False
        
    owns_server = False
    active_server = server
    try:
        if active_server is None:
            active_server = create_smtp_session(timeout=60)
            owns_server = True
            
        active_server.sendmail(config["SMTP_EMAIL"], email, msg.as_string())
        return True
    except Exception as e:
        print(f"SMTP error sending to {email}: {e}")
        raise e
    finally:
        if owns_server and active_server is not None:
            try:
                active_server.quit()
            except Exception:
                try:
                    active_server.close()
                except Exception:
                    pass
