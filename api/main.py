from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import Query
from pydantic import BaseModel
import os
from dotenv import load_dotenv

import google.generativeai as genai

import json

load_dotenv()

app = FastAPI()

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


class QueryRequest(BaseModel):
    prompt: str


def get_ai_response(request: QueryRequest):
    try:
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(request.prompt)
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}


GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def store_results_to_json(place_type: str, results: list):
    with open(f"{place_type}_nearby.json", "w") as f:
        json.dump(results, f, indent=4)


def get_places(lat: float, lng: float, radius: int, place_type: str):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": place_type,
        "key": GOOGLE_MAPS_API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    places = []
    for place in data.get("results", []):
        place_id = place.get("place_id")
        place_lat = place["geometry"]["location"]["lat"]
        place_lng = place["geometry"]["location"]["lng"]

        distance_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        distance_params = {
            "origins": f"{lat},{lng}",
            "destinations": f"{place_lat},{place_lng}",
            "units": "imperial",
            "key": GOOGLE_MAPS_API_KEY,
        }
        distance_response = requests.get(distance_url, params=distance_params).json()
        distance_text = (
            distance_response["rows"][0]["elements"][0]
            .get("distance", {})
            .get("text", "N/A")
        )

        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        details_params = {
            "place_id": place_id,
            "fields": "name,formatted_address,formatted_phone_number",
            "key": GOOGLE_MAPS_API_KEY,
        }
        details_response = requests.get(details_url, params=details_params).json()
        contact_info = details_response.get("result", {}).get(
            "formatted_phone_number", "N/A"
        )

        places.append(
            {
                "name": place.get("name"),
                "address": place.get("vicinity"),
                "distance_miles": distance_text,
                "contact": contact_info,
            }
        )

    store_results_to_json(place_type, places)
    return places


@app.get("/gas-stations/")
async def get_gas_stations(lat: float, lng: float, radius: int = 80500):
    places = get_places(lat, lng, radius, "gas_station")
    return {"gas_stations": places}


@app.get("/grocery-stores/")
async def get_grocery_stores(lat: float, lng: float, radius: int = 80500):
    places = get_places(lat, lng, radius, "grocery_or_supermarket")
    return {"grocery_stores": places}


@app.get("/fire-stations/")
async def get_fire_stations(lat: float, lng: float, radius: int = 80500):
    places = get_places(lat, lng, radius, "fire_station")
    return {"fire_stations": places}


@app.get("/public-shelters/")
async def get_public_shelters(lat: float, lng: float, radius: int = 80500):
    places = get_places(lat, lng, radius, "shelter")
    return {"public_shelters": places}

@app.get("/hospitals/")
async def get_hospitals(lat: float, lng: float, radius: int = 80500):
    places = get_places(lat, lng, radius, "hospital")
    return {"hospitals": places}


@app.get("/public-transportation/")
async def get_public_transportation(lat: float, lng: float, radius: int = 80500):
    places = []

    # Search for bus stations
    bus_station_places = get_places(lat, lng, radius, "bus_station")
    places.extend(bus_station_places)

    # Search for train stations
    train_station_places = get_places(lat, lng, radius, "train_station")
    places.extend(train_station_places)

    return {"public_transportation": places}


# New endpoint to find a custom place by type
@app.get("/custom-place/")
async def get_custom_place(lat: float, lng: float, radius: int = 80500, place_type: str = Query(...)):
    places = get_places(lat, lng, radius, place_type)
    return {f"{place_type}s": places}


class addressRequest(BaseModel):
    prompt: str 

def validate_addresses(request:addressRequest):
    url = f"https://addressvalidation.googleapis.com/v1:validateAddress?key={GOOGLE_MAPS_API_KEY}"
    
    payload = {"address": {"addressLines": [request.address]}
    }
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Error from Google API")

    return response.json()