import React from "react";
import PropTypes from "prop-types";
import MarkerLocationFrom from "../icons/modern/MarkerLocationFrom";
import MarkerLocationTo from "../icons/modern/MarkerLocationTo";
import CONFIG from '../../config.yml'
const locationIconsColor = CONFIG.location.iconColor

const LocationIcon = ({ className, size = 10, title, type}) => {

  switch (type) {
    case "from":
      return (
        <MarkerLocationFrom
          iconColor={locationIconsColor}
          className={className}
          width={size}
          height={size}
          title={title || "From Location Icon"}
        />
      );
    case "to":
      return (
        <MarkerLocationTo
        iconColor={locationIconsColor}
          className={className}
          width={size}
          height={size}
          title={title || "To Location Icon"}
        />
      );
    default:
      throw new Error("invalid type");
  }
};

LocationIcon.propTypes = {
  className: PropTypes.string,
  /**
   * Can be either a number or a string.
   * See https://github.com/jacobwgillespie/styled-icons#props
   */
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * Title as used by styled-icons. If left blank defaults to either
   * `From Location Icon` or `To Location Icon`.
   * See https://github.com/jacobwgillespie/styled-icons#props
   */
  title: PropTypes.string,
  /**
   * Either `from` or `to`
   */
  type: PropTypes.oneOf(["from", "to"]).isRequired
};

export default LocationIcon;
