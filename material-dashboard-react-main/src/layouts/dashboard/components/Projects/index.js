import { useState } from "react";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";

// Data
import data from "layouts/dashboard/components/Projects/data";
import Map from "new_components/Map";
import PropTypes from "prop-types";

function Projects({ mapState, lat, lng, setLat, setLng}) {  // Accept lat and lng as props
    const { columns, rows } = data();
    const [menu, setMenu] = useState(null);

    const openMenu = ({ currentTarget }) => setMenu(currentTarget);
    const closeMenu = () => setMenu(null);

    return (
        <Card>
            <MDBox>
                {/* Pass mapState, lat, and lng to Map */}
                <Map mapType={mapState} lat={lat} lng={lng} setLat={setLat} setLng={setLng} />

            </MDBox>
        </Card>
    );
}

Projects.propTypes = {
    mapState: PropTypes.string,
    lat: PropTypes.number,  // Add PropTypes validation for lat
    lng: PropTypes.number,  // Add PropTypes validation for lng
    setLat: PropTypes.func,
    setLng: PropTypes.func,
};

export default Projects;
