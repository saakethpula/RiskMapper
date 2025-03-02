import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import Header from "layouts/profile/components/Header";

function Overview() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [response, setResponse] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/hospitals-query/?info=${age} ${medicalHistory}`)
      .then((response) => response.text())
      .then((data) => {
      setResponse(data); // Save in state
      localStorage.setItem("riskLevel", data); // Save in localStorage
      const riskLevel = data.match(/\d+/)[0]; // Extract the number from the response
      setResponse(riskLevel); // Save the number in state
      localStorage.setItem("riskLevel", riskLevel); // Save the number in localStorage
      localStorage.setItem("name", name); // Save the name in localStorage
      console.log("Risk Level and Name Saved to LocalStorage:", riskLevel, name);
      })
      .catch((error) => console.error("Error:", error));
  };
  

  


  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mb={2} />
      <Header>
        <MDBox mt={5} mb={3}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6} xl={4}>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Medical History"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  margin="normal"
                  multiline
                  rows={4}
                />
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </form>
            </Grid>
          </Grid>
        </MDBox>
      </Header>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
