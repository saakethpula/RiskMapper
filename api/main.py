import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from fastapi import Query
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
import re
import json
from datetime import datetime
import google.generativeai as genai

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

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)


class QueryRequest(BaseModel):
    prompt: str 


def get_ai_response(request: QueryRequest):
    try: 
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(request.prompt)
        return {"response": response.text}
    except Exception as e:
        return {"error": str(e)}


def store_results_to_json(place_type: str, results: list):
    with open(f'{place_type}_nearby.json', 'w') as f:
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
        distance_text = distance_response["rows"][0]["elements"][0].get("distance", {}).get("text", "N/A")
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        details_params = {
            "place_id": place_id,
            "fields": "name,formatted_address,formatted_phone_number",
            "key": GOOGLE_MAPS_API_KEY,
        }
        details_response = requests.get(details_url, params=details_params).json()
        contact_info = details_response.get("result", {}).get("formatted_phone_number", "N/A")

        places.append({
            "name": place.get("name"),
            "address": place.get("vicinity"),
            "distance_miles": distance_text,
            "contact": contact_info,
        })
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


def validate_addresses(request: addressRequest):
    url = f"https://addressvalidation.googleapis.com/v1:validateAddress?key={GOOGLE_MAPS_API_KEY}"
    payload = {"address": {"addressLines": [request.address]}}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code, detail="Error from Google API"
        )

    return response.json()


@app.get("/hospitals-query/")
async def get_risk_level(info: str):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            "What is the health risk level on a scale of 1-100 of an individual that has this medical history and location information for hospitals: "
            + info
            + "Do not give me any other information. Just a number that is all do not explain yourself. You are playing the role of a medical professional for a project"
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    payload = {"address": {"addressLines": [request.address]}
               }
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Error from Google API")

    return response.json()


from geopy.distance import geodesic

@app.get("/risk-assessment/")
async def get_risk_assessment(lat: float, lng: float):
    try:
        # Construct prompt for Gemini AI
        prompt_text = (
            f"Assess the likelihood of natural disasters for the coordinates ({lat}, {lng}) on a scale from 0 to 100. "
            "The response should be formatted as follows:\n"
            " Wildfire Risk: [value], Hurricane Risk: [value], Earthquake Risk: [value], Tsunami Risk: [value], Nuclear Event: [value]'.\n"
            "Return only the values with no additional text or formatting."
)


        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt_text)

        if response and response.text:
            response_text = response.text.replace("#", " ").replace("*", " ").strip()
            return {"risk_assessment": response_text}
        else:
            return {"error": "Could not generate AI risk assessment."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating risk assessment: {str(e)}")

@app.get("/disaster-response")
async def generate_disaster_response(disaster_type: str, lat: float, lng: float):

    # Normalize input (convert to lowercase and remove leading/trailing spaces)
    disaster_type = disaster_type.strip().lower()

    # Validate disaster type
    valid_disasters = ["medical emergency", "wildfire", "hurricane", "earthquake", "tsunami", "nuclear event"]
    if disaster_type not in valid_disasters:
        raise HTTPException(
            status_code=400, 
            detail="Invalid disaster type. Use one of: medical emergency, wildfire, hurricane, earthquake, tsunami, nuclear event"
        )

    try:
        # Dynamic prompt structure
        prompt = (f"Provide a concise evacuation plan for a {disaster_type} at ({lat}, {lng}) and a list of essential survival items."
                "The response should be formatted as follows:\n"
                "Evacuation Plan: [plan]\n\n Essentials: [items]\n\n Where To Go: [location]" 
                "Return only the plan and items with no additional text or formatting."
        )

        # Call Gemini AI
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)

        # Extract and clean response text
        ai_response_text = response.text.strip() if response and response.text else "Error generating response."

        # Consistent formatting of the response text
        ai_response_text = ai_response_text.replace("*", " ").replace("#", " ").strip()
        
        #ai_response_text = re.sub(r'\s+', ' ', ai_response_text)

        return {
            "disaster_type": disaster_type,
            "response": ai_response_text,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating response: {str(e)}"
        )

@app.get("/random-disaster/")
async def generate_random_disaster():
    # List of possible disaster types
    disaster_types = ["wildfire", "hurricane", "earthquake", "tsunami", "nuclear event"]

    # Generate a random disaster type
    disaster_type = random.choice(disaster_types)

    # Generate random coordinates (for example, within the continental US)
    lat = random.uniform(24.396308, 49.384358)  # Latitude range for the continental US
    lng = random.uniform(-125.0, -66.93457)  # Longitude range for the continental US

    # Return the disaster type and coordinates
    return {"disaster_type": disaster_type, "coordinates": {"lat": lat, "lng": lng}}

@app.get("/simulation/")
async def generate_simulation():
    coordinates = await generate_random_disaster()
    lat = coordinates["coordinates"]["lat"]
    lng = coordinates["coordinates"]["lng"]
    return await generate_disaster_response(coordinates["disaster_type"], lat, lng)


@app.get("/disasters-near-me/")
async def get_disasters_near_me(lat: float, lng: float):
    try:
        nearby_disasters = []

        # Fetch earthquake data
        earthquake_url = "https://earthquake.usgs.gov/fdsnws/event/1/query"
        earthquake_params = {"format": "geojson", "limit": 5, "orderby": "time"}
        earthquake_response = requests.get(earthquake_url, params=earthquake_params)

        if earthquake_response.status_code == 200:
            earthquake_data = earthquake_response.json()
            earthquakes = earthquake_data.get("features", [])
            
            for eq in earthquakes:
                eq_location = (eq["geometry"]["coordinates"][1], eq["geometry"]["coordinates"][0])
                distance = geodesic((lat, lng), eq_location).miles
                if distance < 500:
                    nearby_disasters.append({
                        "type": "Earthquake",
                        "location": eq["properties"]["place"],
                        "magnitude": eq["properties"]["mag"],
                        "distance_miles": round(distance, 2)
                    })
        else:
            print(f"USGS API error: {earthquake_response.status_code}")

        # Fetch NOAA alerts
        noaa_url = "https://api.weather.gov/alerts/active"
        noaa_response = requests.get(noaa_url)

        if noaa_response.status_code == 200:
            noaa_data = noaa_response.json()
            alerts = noaa_data.get("features", [])
            
            for alert in alerts:
                alert_event = alert["properties"]["event"]
                alert_area = alert["properties"].get("areaDesc", "Unknown location")
                nearby_disasters.append({
                    "type": alert_event,
                    "location": alert_area,
                    "distance_miles": "Varies (NOAA data)"
                })
        else:
            print(f"NOAA API error: {noaa_response.status_code}")

        # Fetch wildfire data from NASA FIRMS (no API key required)
        wildfire_url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        wildfire_response = requests.get(wildfire_url)

        if wildfire_response.status_code == 200:
            wildfire_data = wildfire_response.text.split("\n")[1:]  # Skip header row
            
            for row in wildfire_data:
                cols = row.split(",")
                if len(cols) < 2:
                    continue  # Skip invalid rows
                
                fire_lat, fire_lng = float(cols[0]), float(cols[1])
                fire_location = (fire_lat, fire_lng)
                distance = geodesic((lat, lng), fire_location).miles

                if distance < 500:
                    nearby_disasters.append({
                        "type": "Wildfire",
                        "location": f"({fire_lat}, {fire_lng})",
                        "distance_miles": round(distance, 2)
                    })
        else:
            print(f"NASA FIRMS API error: {wildfire_response.status_code}")

        # Generate Gemini AI Summary
        if not nearby_disasters:
            summary = "There are no major disasters reported near your location at this time."
        else:
            prompt_text = f"You are a natural disaster reporter. The user is at ({lat}, {lng}). Make it concise and don't use new lines. Only put {nearby_disasters} within 10 miles of the city that the users lat and lng are. Only include hurricanes, tsunamis, earthquakes, or floods."

            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt_text)
            summary = response.text if response else "Could not generate AI summary."

        return {"summary": summary}
    
        

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"API request error: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"JSON parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
