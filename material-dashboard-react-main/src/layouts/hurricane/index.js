import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import Projects from "layouts/dashboard/components/Projects";

function Wildfire() {
  const { sales, tasks } = reportsLineChartData;
  const nearestHospitalDistance = hospitalNearbyData[0].distance_miles;
  const hospitalNearby = hospitalNearbyData.length;
  const traveltime = hospitalNearbyData[0].distance_miles.replace(" mi", "");
  const userLat = localStorage.getItem("userLat") || "Not available";
  const userLng = localStorage.getItem("userLng") || "Not available";

 // Replace with actual user longitude
  let response = fetch(`http://127.0.0.1:8000/disaster-response?disaster_type=hurricane&lat=${userLat}&lng=${userLng}`)
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="weekend"
                title="Number of Nearby Hospitals"
                count={hospitalNearby}
                percentage={{
                  color: "success",
                  amount: "+55%",
                  label: "than last week",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="leaderboard"
                title="Distance to Nearest Hospital (mi)"
                count={nearestHospitalDistance}
                percentage={{
                  color: "success",
                  amount: "+3%",
                  label: "than last month",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="store"
                title="Travel Time"
                count={traveltime}
                percentage={{
                  color: "success",
                  amount: "+1%",
                  label: "than yesterday",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="person_add"
                title="Risk Level"
                count={hospitalNearby}
                percentage={{
                  color: "success",
                  amount: "",
                  label: "Just updated",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox>
          <Grid container spacing={3}>

            <Grid item xs={12} md={10} lg={12}>
              <Projects mapState={"hospital"} />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <div> {response[1]} </div>
              </Grid>
            <Grid item xs={12} md={6} lg={4}>
            
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

Hurricane.propTypes = {
    lat: PropTypes.number,  // No .isRequired, making it optional
    lng: PropTypes.number,  // No .isRequired, making it optional
};

export default Hurricane;
