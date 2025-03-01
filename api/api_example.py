import requests
from api_keys import GEMINI_API_KEY, GOOGLE_MAPS_API_KEY

# Example: Using Gemini API (Google AI)
def query_gemini(prompt):
    url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
    headers = {
        "Content-Type": "application/json"
    }
    params = {
        "key": GEMINI_API_KEY
    }
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    response = requests.post(url, json=data, headers=headers, params=params)
    return response.json()

# Example: Using Google Maps API
def get_geocode(address):
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_MAPS_API_KEY
    }

    response = requests.get(url, params=params)
    return response.json()

# Test the functions
if __name__ == "__main__":
    # Gemini Example
    prompt = "Tell me a fun fact about space."
    gemini_response = query_gemini(prompt)
    print("Gemini Response:", gemini_response)

    # Google Maps Example
    address = "1600 Amphitheatre Parkway, Mountain View, CA"
    maps_response = get_geocode(address)
    print("Google Maps Response:", maps_response)
