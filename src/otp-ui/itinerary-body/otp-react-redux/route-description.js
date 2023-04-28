import { legType } from "../../core-utils/types";
import PropTypes from "prop-types";
import React from "react";

export default function RouteDescription({ leg, LegIcon, transitOperator, onClick }) {
  const { headsign, routeLongName, routeShortName, routeColor, routeTextColor } = leg;
  // TODO: calculate text color if missing
  const shortNameStyle = routeColor && routeTextColor ? {backgroundColor:`#${routeColor}`, color: `#${routeTextColor}`} : undefined

  const isClickable = typeof onClick === 'function';

  return (
    <div className="otp-ui-legDescForTransit" style={isClickable? {cursor:'pointer'}:undefined} onClick={isClickable ? onClick : ()=>{}}>
      <div className="otp-ui-legDescForTransit__container">
        <div className="otp-ui-legDescForTransit__iconContainer">
          <LegIcon leg={leg} />
        </div>
        {routeShortName && (
          <div className="otp-ui-legDescForTransit__shortName" style={shortNameStyle}>
            {routeShortName}
          </div>
        )}
      </div>
      <div className="otp-ui-legDescForTransit__longName">
        <p className="name">{routeLongName}</p>
        {headsign && (
          <span>
            {" "}
            <p className="otp-ui-legDescForTransit__headSignPrefix">
              {/* TODO: I18N */}
              to
            </p>{" "}
            <p  className="headsign">{headsign}</p>
          </span>
        )}
      </div>
    </div>
  );
}

RouteDescription.propTypes = {
  leg: legType.isRequired,
  LegIcon: PropTypes.elementType.isRequired
};
