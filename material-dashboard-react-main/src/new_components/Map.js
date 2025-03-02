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

const Map = ({ mapType, lat, lng, setLat, setLng }) => {
    const [mapLoaded, setMapLoaded] = useState(false);
    const [locationFound, setLocationFound] = useState(false);
    const [data, setData] = useState(null);
    const [hospitalItems, setHospitalItems] = useState([]);
    const [directionData, setDirectionData] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const directionsRendererRef = useRef(null);

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

    useEffect(() => {
        if (data && mapType == "hospital") {
            const formattedItems = data.hospitals.slice(0, 5).map((hospital, index) => ({
                label1: hospital.name,
                label2: hospital.address,
                label3: hospital.distance_miles,
                noGutter: index === 4,
            }));
            setHospitalItems(formattedItems);
        }
    }, [data]);

    useEffect(() => {
        if (data && mapType == "fire_stations") {
            const formattedItems = data.fire_stations.slice(0, 5).map((fire_station, index) => ({
                label1: fire_station.name,
                label2: fire_station.address,
                label3: fire_station.distance_miles,
                noGutter: index === 4,
            }));
            setHospitalItems(formattedItems);
        }
    }, [data]);

    useEffect(() => {
        if (data && mapType == "public_transportation") {
            const formattedItems = data.public_transportation.slice(0, 5).map((public_transportation, index) => ({
                label1: public_transportation.name,
                label2: public_transportation.address,
                label3: public_transportation.distance_miles,
                noGutter: index === 4,
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

                        if (markerRef.current) {
                            markerRef.current.setMap(null);
                        }

                        markerRef.current = new google.maps.Marker({
                            position: userLocation,
                            map: mapInstanceRef.current,
                            title: "You are here!",
                        });
                        setLat(userLocation.lat);
                        setLng(userLocation.lng);

                        if (mapType === "hospital") {
                            try {
                                const response = await fetch(
                                    `http://127.0.0.1:8000/hospitals/?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10000`
                                );
                                const data = await response.json();
                                setData({hospitals: data.hospitals});
                            } catch (error) {
                                console.error("Error fetching hospitals:", error);
                            }
                        }
                        else if (mapType === "fire_stations") {
                            try {
                                const response = await fetch(
                                    `http://127.0.0.1:8000/fire-stations/?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10000`
                                );
                                const data = await response.json();
                                setData({fire_stations: data.fire_stations});
                            } catch (error) {
                                console.error("Error fetching fire_stations:", error);
                            }
                        }
                        else if (mapType === "public_transportation") {
                            try {
                                const response = await fetch(
                                    `http://127.0.0.1:8000/public-transportation/?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=10000`
                                );
                                const data = await response.json();
                                setData({public_transportation: data.public_transportation});
                            } catch (error) {
                                console.error("Error fetching public_transportation:", error);
                            }
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
                } catch (error) {
                    console.error("Error fetching hospitals:", error);
                }
            }
        }
    };

    useEffect(() => {
        if (directionData && mapInstanceRef.current && markerRef.current) {
            const directionsService = new google.maps.DirectionsService();

            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
            }

            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                map: mapInstanceRef.current,
                panel: document.getElementById("directionsPanel"),
            });

            const origin = markerRef.current?.getPosition();
            if (!origin) return;

            const request = {
                origin: origin,
                destination: directionData,
                travelMode: google.maps.TravelMode.DRIVING,
            };

            directionsService.route(request, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsRendererRef.current.setDirections(result);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            });
        }
    }, [directionData]);

    return (
        <div style={{ display: "flex", justifyContent: "left", textAlign: "center", padding: "20px" }}>
            <div ref={mapRef} style={{ height: "700px", width: "70%" }}></div>
            <div style={{ marginLeft: "20px", width: "30%" }}>
                <MDButton onClick={locateUser} style={{ marginTop: "10px", padding: "10px" }}>
                    Find My Location Automatically
                </MDButton>

                <Grid item xs={12} lg={12} style={{ marginTop: "20px" }}>
                    {!directionData ? (
                        mapType === "hospital" && hospitalItems.length > 0 ? (
                            <Invoices
                                title="Nearby Hospitals"
                                items={hospitalItems}
                                setDirectionData={setDirectionData}
                            />
                        ) : mapType === "fire_stations" && hospitalItems.length > 0 ? (
                            <Invoices
                                title="Nearby Fire Stations"
                                items={hospitalItems}
                                setDirectionData={setDirectionData}
                            />
                        ) : mapType === "public_transportation" && hospitalItems.length > 0 ? (
                            <Invoices
                                title="Nearby Public Transportation"
                                items={hospitalItems}
                                setDirectionData={setDirectionData}
                            />
                        ) : null
                    ) : (
                        <div id="directionsPanel" style={{ marginTop: "10px" }} />
                    )}
                </Grid>
            </div>
        </div>
    );


};

Map.propTypes = {
    mapType: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
    setLat: PropTypes.func,
    setLng: PropTypes.func,
};

export default Map;
