
// @mui material components
import Card from "@mui/material/Card";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Reusable Invoice Component
import Invoice from "layouts/billing/components/Invoice";
import PropTypes from "prop-types";

function Invoices({ title, items, setDirectionData }) {
    return (
        <Card sx={{ height: "100%" }}>
            <MDBox pt={2} px={2} display="flex" justifyContent="space-between" alignItems="center">
                <MDTypography variant="h6" fontWeight="medium">
                    {title}
                </MDTypography>
            </MDBox>
            <MDBox p={2}>
                <MDBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
                    {items.map((item, index) => (
                        <Invoice key={index} {...item}  setDirectionData={setDirectionData}/>
                    ))}
                </MDBox>
            </MDBox>
        </Card>
    );
}

Invoices.propTypes = {
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            label1: PropTypes.string.isRequired,
            label2: PropTypes.string.isRequired,
            label3: PropTypes.string.isRequired,
            noGutter: PropTypes.bool,
        })
    ).isRequired,
    setDirectionData: PropTypes.func,
};

export default Invoices;
