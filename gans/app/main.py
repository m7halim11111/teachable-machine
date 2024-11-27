from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from PIL import Image
import io

# Import the model loading function and the prediction function
from app.model import load_pix2pix_model, predict

app = FastAPI()

# Load the Pix2Pix model
model = load_pix2pix_model()

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    input_image = Image.open(io.BytesIO(contents))
    output_image_path = predict(input_image, model)
    return FileResponse(output_image_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
