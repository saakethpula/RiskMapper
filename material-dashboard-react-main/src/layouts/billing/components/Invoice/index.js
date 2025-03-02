// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function Invoice({ label1, label2, label3, noGutter }) {
  return (
      <MDBox
          component="li"
          display="flex"
          justifyContent="space-between"
          alignItems="left"
          py={1}
          pr={1}
          mb={noGutter ? 0 : 1}
      >
        <MDBox lineHeight={1.125} textAlign="left"> {/* Added textAlign="left" */}
          <MDTypography display="block" variant="button" fontWeight="medium">
            {label1}
          </MDTypography>
          <MDTypography variant="caption" fontWeight="regular" color="text">
            {label2}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" alignItems="left">
          <MDTypography variant="button" fontWeight="regular" color="text">
            {label3}
          </MDTypography>
          <MDBox display="flex" alignItems="left" lineHeight={1} ml={3} sx={{ cursor: "pointer" }}>
            <MDTypography variant="button" fontWeight="bold">
              &nbsp;Select
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
  );
}

Invoice.defaultProps = {
  noGutter: false,
};

Invoice.propTypes = {
  label1: PropTypes.string.isRequired,
  label2: PropTypes.string.isRequired,
  label3: PropTypes.string.isRequired,
  noGutter: PropTypes.bool,
};

export default Invoice;