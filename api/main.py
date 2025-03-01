from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

load_dotenv()

load_dotenv
app = FastAPI()

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


@app.get("/hospitals/")
async def get_hospitals(lat: float, lng: float, radius: int = 1000000):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": "hospital",
        "key": GOOGLE_MAPS_API_KEY,
    }

    # Log the API request and parameters
    print(f"Requesting nearby hospitals at lat: {lat}, lng: {lng}, radius: {radius}")

    response = requests.get(url, params=params)
    data = response.json()

    # Log the response data
    print(f"Google Maps API Response: {data}")

    hospitals = []
    for place in data.get("results", []):
        place_id = place.get("place_id")
        hospital_lat = place["geometry"]["location"]["lat"]
        hospital_lng = place["geometry"]["location"]["lng"]

        # Get Distance from user to hospital
        distance_url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        distance_params = {
            "origins": f"{lat},{lng}",
            "destinations": f"{hospital_lat},{hospital_lng}",
            "units": "imperial",
            "key": GOOGLE_MAPS_API_KEY,
        }
        distance_response = requests.get(distance_url, params=distance_params).json()
        distance_text = (
            distance_response["rows"][0]["elements"][0]
            .get("distance", {})
            .get("text", "N/A")
        )

        # Get Hospital Contact Info
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

        hospitals.append(
            {
                "name": place.get("name"),
                "address": place.get("vicinity"),
                "distance_miles": distance_text,
                "contact": contact_info,
            }
        )

    return {"hospitals": hospitals}
