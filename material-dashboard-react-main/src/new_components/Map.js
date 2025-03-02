import React, { useEffect, useRef, useState } from "react";
import MDButton from "components/MDButton";
import Grid from "@mui/material/Grid";
import Invoices from "../layouts/billing/components/Invoices";
import PropTypes from "prop-types";

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

const Map = ({ mapType }) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [locationFound, setLocationFound] = useState(false);
    const [data, setData] = useState(null);
    const [directionsVisible, setDirectionsVisible] = useState({});
    const [hospitalItems, setHospitalItems] = useState([]);
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

    // Process hospital data into the format required by Invoices component
    useEffect(() => {
        if (data && data.hospitals) {
            // Take only the first 5 hospitals
            const formattedItems = data.hospitals.slice(0, 5).map((hospital, index) => ({
                label1: hospital.name,
                label2: hospital.address,
                label3: hospital.distance_miles,
                noGutter: index === 4 // Add noGutter for last item
            }));
            setHospitalItems(formattedItems);
        }
    }, [data]);

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
        <div style={{ display: "flex", justifyContent: "left", textAlign: "center", padding: "20px" }}>
            <div ref={mapRef} style={{ height: "700px", width: "70%" }}></div>
            <div style={{ marginLeft: "20px", width: "30%" }}>
                <MDButton onClick={locateUser} style={{ marginTop: "10px", padding: "10px" }}>
                    Find My Location Automatically
                </MDButton>

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

                                        if (markerRef.current) {
                                            markerRef.current.setMap(null);
                                        }
                                        markerRef.current = new google.maps.Marker({
                                            position: userLocation,
                                            map: mapInstanceRef.current,
                                            title: "You are here!",
                                        });

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
                    <div style={{ marginTop: "10px" }}>
                        <MDButton onClick={findHospitals} style={{ marginRight: "10px", padding: "10px" }}>
                            Find Hospitals
                        </MDButton>
                        <MDButton onClick={findGasstations} style={{ padding: "10px" }}>
                            Find Gas Stations
                        </MDButton>
                    </div>
                )}

                <Grid item xs={12} lg={12} style={{ marginTop: "20px" }}>
                    {hospitalItems.length > 0 && (
                        <Invoices
                            title="Nearby Hospitals"
                            items={hospitalItems}
                        />
                    )}
                </Grid>
            </div>
        </div>
    );
};

Map.propTypes = {
    mapType: PropTypes.string.isRequired,
};

export default Map;