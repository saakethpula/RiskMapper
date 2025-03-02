import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import Projects from "layouts/dashboard/components/Projects";
import PropTypes from "prop-types";
import Map from "../../new_components/Map";

function Medical() {
    const [hospitalNearbyData, setHospitalNearbyData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [data, setData] = useState([]);  // Initialize as an empty array
    const risk = localStorage.getItem("riskLevel") || "Not available";

    useEffect(() => {
        if (lat && lng) {
            const fetchHospitals = async () => {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/hospitals/?lat=${lat}&lng=${lng}&radius=10000`
                    );
                    const result = await response.json();
                    setData(result.hospitals || []);  // Ensure the data is an array
                    console.log("Data:", result.hospitals);
                } catch (error) {
                    console.error("Error fetching hospitals:", error);
                }
            };

            fetchHospitals();
        } else {
            // If lat and lng are not available, set loading to false
            setLoading(false);
        }
    }, [lat, lng]);

    if (loading) {
        return <div>Loading...</div>;
    }

    // Ensure safe access
    const nearestHospitalDistance = data.length > 0 ? data[0]?.distance_miles : "N/A";
    const hospitalNearby = data.length;  // Length of hospitals array
    const traveltime = data.length > 0 ? data[0]?.distance_miles.replace(" mi", "") : "N/A";  // Access first hospital

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox py={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="dark"
                                icon="place"
                                title="Number of Nearby Hospitals"
                                count={hospitalNearby}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                icon="leaderboard"
                                title="Distance to Nearest Hospital (mi)"
                                count={nearestHospitalDistance}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="success"
                                icon="star"
                                title="Nearest Hospital Rating"
                                count={traveltime}
                            />
                        </MDBox>
                    </Grid>
                    <Grid item xs={12} md={6} lg={3}>
                        <MDBox mb={1.5}>
                            <ComplexStatisticsCard
                                color="primary"
                                icon="person_add"
                                title="Risk Level"
                                count={risk}
                            />
                        </MDBox>
                    </Grid>
                </Grid>
                <MDBox>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={10} lg={12}>
                            <Projects mapState={"hospital"} lat={lat} lng={lng} setLat={setLat} setLng={setLng} />

                        </Grid>

                    </Grid>

                </MDBox>

            </MDBox>
        </DashboardLayout>
    );
}

Medical.propTypes = {
    lat: PropTypes.number,  // No .isRequired, making it optional
    lng: PropTypes.number,  // No .isRequired, making it optional
};

export default Medical;
