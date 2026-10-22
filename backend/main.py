import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import upload, generate, email, history

app = FastAPI(title="Certificate Generator & Mailer API", version="1.0.0")

# CORS middleware config to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload.router)
app.include_router(generate.router)
app.include_router(email.router)
app.include_router(history.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Certificate Generator & Mailer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
