import React, { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById("googleMaps");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.id = "googleMaps";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error("Google Maps failed to load."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load Google Maps script."));
      document.body.appendChild(script);
    } else {
      existingScript.onload = () => resolve();
    }
  });
};

const Map: React.FC = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setMapLoaded(true))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
        zoom: 10,
      });
    }
  }, [mapLoaded]);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(userLocation);
            mapInstanceRef.current.setZoom(14);

            // Remove old marker
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // Create new marker
            markerRef.current = new google.maps.Marker({
              position: userLocation,
              map: mapInstanceRef.current,
              title: "You are here!",
            });
          }
        },
        () => {
          alert("Error: Could not get location. Please enter your location manually.");
          const locationInput = prompt("Enter your location (e.g., San Francisco, CA):");
          if (locationInput) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: locationInput }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const userLocation = results[0].geometry.location;
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setCenter(userLocation);
                  mapInstanceRef.current.setZoom(14);

                  // Remove old marker
                  if (markerRef.current) {
                    markerRef.current.setMap(null);
                  }

                  // Create new marker
                  markerRef.current = new google.maps.Marker({
                    position: userLocation,
                    map: mapInstanceRef.current,
                    title: "You are here!",
                  });
                }
              } else {
                alert("Error: Could not find the location.");
              }
            });
          }
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div ref={mapRef} style={{ height: "500px", width: "50%" }}></div>
      <button onClick={locateUser} style={{ marginTop: "10px", padding: "10px" }}>
        Find My Location
      </button>
    </div>
  );
};

export default Map;
