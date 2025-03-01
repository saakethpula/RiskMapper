/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useState } from "react";

import Card from "@mui/material/Card";

import MDBox from "components/MDBox";


// Data
import data from "layouts/dashboard/components/Projects/data";

import Map from "new_components/Map"

function Projects() {
  const { columns, rows } = data();
  const [menu, setMenu] = useState(null);

  const openMenu = ({ currentTarget }) => setMenu(currentTarget);
  const closeMenu = () => setMenu(null);

  return (
    <Card>
      <MDBox>
          <Map>
          </Map>
      </MDBox>
    </Card>
  );
}

export default Projects;
