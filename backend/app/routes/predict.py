from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.predict_service import predict_from_bytes

router = APIRouter(tags=["predict"])

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        result = predict_from_bytes(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
