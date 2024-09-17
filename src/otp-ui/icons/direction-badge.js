import React from "react";
import PropTypes from "prop-types";
import Icon from "../../components/narrative/icon";

const DirectionBadge = ({ direction, children, width, bottom=false, absolute = true }) => {
  let directionStr = "";
  let directionIcon = "";
  if (direction === "nord" || direction === "north" || direction === "n") {
    directionStr = "N";
    directionIcon = "up";
  } else if (
    direction === "sud" ||
    direction === "south" ||
    direction === "s"
  ) {
    directionStr = "S";
    directionIcon = "down";
  } else {
    console.warn("no direction matching");
    return children;
  }

  return (
    <div className="otp-ui-direction-badge-icon" style={{ width }}>
      <span
        className={`otp-ui-direction-badge-icon__badge ${
          absolute ? "absolute" : ""
        } ${
         bottom ? "bottom" : ""
        }`}
      >
        <Icon type={`caret-${directionIcon}`} />
        {directionStr}
      </span>

      {children}
    </div>
  );
};

DirectionBadge.props = {
  children: PropTypes.node,
  direction: PropTypes.oneOf(["nord", "sud"]),
  width: PropTypes.any,
};

DirectionBadge.defaultProps = {
  width: null,
  counter: null,
  children: <></>,
};

export default DirectionBadge;
