import React from "react";

const MarkerStopDefault = ({
  title,
  width = 54,
  height = 62,
  markerColor = "#000",
  iconColor = "#fff",
  ...props
}) => (
  <svg
    viewBox="0 0 54 61.96"
    width={width}
    height={height}
    {...props}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g id="Group_165" transform="translate(-1323.585 -290.965)">
      <g
        id="noun_Charging_Station_976545"
        data-name="noun_Charging Station_976545"
        transform="translate(1329.162 295.042)"
      >
        <rect
          id="Rectangle_38"
          data-name="Rectangle 38"
          width="54"
          height="51"
          rx="10"
          transform="translate(-5.577 -4.077)"
          fill={markerColor}
          stroke="white"
          strokeWidth="3"
        />
      </g>
    </g>
  </svg>
);

export default MarkerStopDefault;
