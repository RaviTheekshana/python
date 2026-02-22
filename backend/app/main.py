from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.routes import auth
from app.database.session import Base, engine
from app.routes import auth, user
from app.routes import predict
from app.routes import verify
from app.routes import scan
from app.routes import admin_scans
from app.routes import vendors
from app.routes import parts

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# Static files (saved scan images)
STATIC_DIR = Path(__file__).resolve().parent / "uploads"
STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(user.router, tags=["User"])
app.include_router(predict.router)
app.include_router(verify.router)
app.include_router(scan.router)
app.include_router(admin_scans.router)
app.include_router(vendors.router)
app.include_router(parts.router)

@app.get("/")
def root():
    return {"message": "Hello from FastAPI!"}
