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
    const [locationFound, setLocationFound] = useState(false); // To track if the location is found
    const [data, setData] = useState(null);
    const [directionsVisible, setDirectionsVisible] = useState({});
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

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

                        // Set locationFound to true after location is successfully found
                        setLocationFound(true);
                    }
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const findHospitals = async () => {
        if (markerRef.current) {
            const userLocation = markerRef.current.getPosition();
            if (userLocation) {
                const lat = userLocation.lat();
                const lng = userLocation.lng();

                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/hospitals/?lat=${lat}&lng=${lng}&radius=10000`
                    );
                    const data = await response.json();
                    setData({ hospitals: data.hospitals });
                    console.log("Hospitals:", data.hospitals);
                } catch (error) {
                    console.error("Error fetching hospitals:", error);
                }
            }
        }
    };

    const findGasstations = async () => {
        if (markerRef.current) {
            const userLocation = markerRef.current.getPosition();
            if (userLocation) {
                const lat = userLocation.lat();
                const lng = userLocation.lng();

                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/gas-stations/?lat=${lat}&lng=${lng}&radius=10000`
                    );
                    const data = await response.json();
                    setData({ gas_stations: data.gas_stations });
                    console.log("Gas Stations:", data.gas_stations);
                } catch (error) {
                    console.error("Error fetching gas stations:", error);
                }
            }
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
    <div style={{ display: "flex", justifyContent: "left", textAlign: "center", padding: "20px" }}>
        <div ref={mapRef} style={{ height: "700px", width: "70%" }}></div>
            <div style={{ marginLeft: "20px", width: "30%" }}>
                <button onClick={locateUser} style={{ marginTop: "10px", padding: "10px" }}>
                    Find My Location Automatically
                </button>

                <input
                    type="text"
                    placeholder="Enter location manually"
                    style={{ marginTop: "10px", padding: "10px", width: "100%" }}
                    onKeyPress={(event) => {
                        if (event.key === "Enter") {
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ address: event.target.value }, (results, status) => {
                                if (status === google.maps.GeocoderStatus.OK) {
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

                                        // Set locationFound to true after location is successfully found
                                        setLocationFound(true);
                                    }
                                } else {
                                    alert("Geocode was not successful for the following reason: " + status);
                                }
                            });
                        }
                    }}
                />

                {locationFound && (
                    <button
                        onClick={findHospitals}
                        style={{ marginTop: "10px", padding: "10px" }}
                    >
                        Find Hospitals
                    </button>
                )}
                {locationFound && (
                    <button
                        onClick={findGasstations}
                        style={{ marginTop: "10px", padding: "10px" }}
                    >
                        Find Gas Stations
                    </button>
                )}

                {data && data.hospitals && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Nearby Hospitals:</h3>
                        <div>
                            {data.hospitals.slice(0, 5).map((hospital, index) => (
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
                {data && data.gas_stations && (
                    <div style={{ marginTop: "20px" }}>
                        <h3>Nearby Gas Stations:</h3>
                        <div>
                            {data.gas_stations.slice(0, 5).map((gas_stations, index) => (
                                <li key={index}>
                                    <strong>{gas_stations.name}</strong><br />
                                    {gas_stations.address}
                                    {gas_stations.distance_miles && <><br />{gas_stations.distance_miles}</>}
                                    <br />
                                    <button
                                        onClick={() => toggleDirections(index, gas_stations)}
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
    </div>
);
};

export default Map;
