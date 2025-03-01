from fastapi import FastAPI
import google.generativeai as genai
import os 
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}

class QueryRequest(BaseModel):
    prompt: str 


def get_ai_response(request: QueryRequest):
    try: 
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(request.prompt)
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}
