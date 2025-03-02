import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import Card from "@mui/material/Card";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import Projects from "layouts/dashboard/components/Projects";
import PropTypes from "prop-types";
import Map from "../../new_components/Map";

function Tsunami() {
    const [hospitalNearbyData, setHospitalNearbyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lat, setLat] = useState(null);
    const [lng, setLng] = useState(null);
    const [data, setData] = useState([]);  
    const [disasterResponse, setDisasterResponse] = useState(null); // Store API response
    const [riskAssessment, setRiskAssessment] = useState("N/A"); // Store API response

    useEffect(() => {
        if (lat && lng) {
            const fetchHospitals = async () => {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/viewpoints/?lat=${lat}&lng=${lng}&radius=10000`
                    );
                    const result = await response.json();
                    setData(result.hospitals || []);
                    console.log("Data:", result.hospitals);
                } catch (error) {
                    console.error("Error fetching hospitals:", error);
                }
            };
            fetchHospitals();
        } else {
            setLoading(false);
        }
    }, [lat, lng]);

    useEffect(() => {
        if (lat !== null && lng !== null) {
            const fetchDisasterResponse = async () => {
                try {
                    const response = await fetch(
                        `http://127.0.0.1:8000/disaster-response?disaster_type=Tsunami&lat=${lat}&lng=${lng}`
                    );
                    const result = await response.json();
                    setDisasterResponse(result["response"]); // Store the relevant data
                    console.log("Disaster Response:", result["response"]);
                } catch (error) {
                    console.error("Error fetching disaster response:", error);
                }
            };

            fetchDisasterResponse();
        }
    }, [lat, lng]); // Now it waits until lat & lng are available

    useEffect(() => {
      if (lat !== null && lng !== null) {
          const fetchRiskAssessment = async () => {
              try {
                  const response = await fetch(
                      `http://127.0.0.1:8000/risk-assessment?lat=${lat}&lng=${lng}`
                  );
                  const result = await response.json();
                  console.log("Risk Assessment:", result["risk_assessment"]["Tsunami Risk"]);
                  setRiskAssessment(result["risk_assessment"]["Tsunami Risk"]);
              } catch (error) {
                  console.error("Error fetching risk assessment:", error);
              }
          };

          fetchRiskAssessment();
      }
  }, [lat, lng]);
    if (loading) {
        return <div>Loading...</div>;
    }

    const nearestHospitalDistance = data.length > 0 ? (data[0]?.distance_miles || "N/A") : "N/A";
    const hospitalNearby = data.length;
    const traveltime = data.length > 0 ? (data[0].rating || "N/A") : "N/A"; 

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
                  title="Number of Nearby High Areas"
                  count={hospitalNearby}
                  titleTypographyProps={{ variant: "body2" }}
                  countTypographyProps={{ variant: "h6" }}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  icon="directions_car"
                  title="Distance to Nearest High Ground (mi)"
                  count={nearestHospitalDistance}
                  titleTypographyProps={{ variant: "body2" }}
                  countTypographyProps={{ variant: "h6" }}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="success"
                  icon="star"
                  title="Nearest High Ground Rating"
                  count={traveltime}
                  titleTypographyProps={{ variant: "body2" }}
                  countTypographyProps={{ variant: "h6" }}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="primary"
                  icon="reportproblem"
                  title="Risk Level"
                  count={riskAssessment}
                  titleTypographyProps={{ variant: "body2" }}
                  countTypographyProps={{ variant: "h6" }}
                />
              </MDBox>
            </Grid>
          </Grid>
          <MDBox>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={10} lg={12}>
                            <Projects mapState={"viewpoints"} lat={lat} lng={lng} setLat={setLat} setLng={setLng} />
                        </Grid>
                    </Grid>
                </MDBox>
                <MDBox>
                    <Grid container spacing={3}>
                        <MDBox mb={1.5}>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={10} lg={12}>
                              <Card style={{marginTop: '40px'}}>
                                <div style={{ fontSize: 'medium', padding: '15px'}}>
                                  {disasterResponse || "Loading disaster response..."}
                                </div>
                              </Card>
                            </Grid>
                          </Grid>
                        </MDBox> 
                    </Grid>
                </MDBox>
            </MDBox>
        </DashboardLayout>
    );
}

Tsunami.propTypes = {
    lat: PropTypes.number,  
    lng: PropTypes.number,  
};

export default Tsunami;
