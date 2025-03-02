import { useState } from "react";

import Card from "@mui/material/Card";
import MDBox from "components/MDBox";

// Data
import data from "layouts/dashboard/components/Projects/data";

import Map from "new_components/Map";
import PropTypes from "prop-types";

function Projects({ mapState }) {  // Accept mapState as a prop
    const { columns, rows } = data();
    const [menu, setMenu] = useState(null);

    const openMenu = ({ currentTarget }) => setMenu(currentTarget);
    const closeMenu = () => setMenu(null);

    return (
        <Card>
            <MDBox>
                <Map mapType={mapState} />  {/* Pass mapState to Map */}
            </MDBox>
        </Card>
    );
}
Projects.propTypes = {
    mapState: PropTypes.string.isRequired,
};
export default Projects;
