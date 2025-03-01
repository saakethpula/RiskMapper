import React, { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const loadGoogleMapsScript = () => {
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

const Map = () => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [data, setData] = useState(null);
    const [directionsVisible, setDirectionsVisible] = useState({});

    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => setMapLoaded(true))
            .catch((error) => console.error(error));
    }, []);

    useEffect(() => {
        if (mapLoaded && mapRef.current) {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
                center: { lat: 0, lng: 0 },
                zoom: 3,
            });
        }
    }, [mapLoaded]);

    const locateUser = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
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

                        // Fetch hospitals from FastAPI backend
                        try {
                            const response = await fetch(
                                `http://127.0.0.1:8000/hospitals/?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10000`
                            );
                            const data = await response.json();
                            setData({ hospitals: data.hospitals });
                            console.log("Hospitals:", data.hospitals);
                        } catch (error) {
                            console.error("Error fetching hospitals:", error);
                        }
                    }
                },
                () => {
                    alert("Error: Could not get location. Please enter your location manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const toggleDirections = (index, hospital) => {
        setDirectionsVisible((prev) => {
            const newState = { ...prev, [index]: !prev[index] };
            if (newState[index]) {
                if (mapInstanceRef.current && markerRef.current) {
                    const directionsService = new google.maps.DirectionsService();
                    const directionsRenderer = new google.maps.DirectionsRenderer({
                        draggable: true,
                        panel: document.getElementById(`directionsPanel-${index}`),
                    });
                    directionsRenderer.setMap(mapInstanceRef.current);

                    const origin = markerRef.current?.getPosition();
                    if (!origin) {
                        console.error("Origin is not available.");
                        return prev;
                    }

                    const request = {
                        origin: origin,
                        destination: hospital.address,
                        travelMode: google.maps.TravelMode.DRIVING,
                    };

                    directionsService.route(request, (result, status) => {
                        if (status === google.maps.DirectionsStatus.OK) {
                            directionsRenderer.setDirections(result);
                        } else {
                            console.error(`Directions request failed due to ${status}`);
                        }
                    });
                }
            } else {
                const panel = document.getElementById(`directionsPanel-${index}`);
                if (panel) {
                    panel.innerHTML = "";
                }
            }
            return newState;
        });
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            <div ref={mapRef} style={{ height: "500px", width: "50%" }}></div>
            <div style={{ marginLeft: "20px", width: "30%" }}>
                <button onClick={locateUser} style={{ marginTop: "10px", padding: "10px" }}>
                    Find My Location
                </button>
                {data && data.hospitals && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Nearby Hospitals:</h3>
                        <div>
                            {data.hospitals.slice(0, 2).map((hospital, index) => (
                                <li key={index}>
                                    <strong>{hospital.name}</strong><br />
                                    {hospital.address}
                                    {hospital.distance_miles && <><br />{hospital.distance_miles}</>}
                                    <br />
                                    <button
                                        onClick={() => toggleDirections(index, hospital)}
                                    >
                                        {directionsVisible[index] ? "Hide Directions" : "Show Directions"}
                                    </button>
                                    <div id={`directionsPanel-${index}`} style={{ marginTop: "10px" }}></div>
                                </li>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Map;
