import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth_router, employee_router, admin_router, chat_router

# Ensure tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Chatbot-Driven HRMS API",
    description="Full-stack HRMS with dual portals and autonomous AI Assistant powered by Google Gemini",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(employee_router.router)
app.include_router(admin_router.router)
app.include_router(chat_router.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "AI-Driven HRMS Backend",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
