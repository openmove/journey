import React from "react";
// default markers
import MarkerStopChild from "./MarkerStopChild";
import MarkerStop from "./MarkerStop";

// mode markers
import MarkerStopGondola from "./MarkerStopGondola";
import MarkerStopBus from "./MarkerStopBus";
import MarkerStopRail from "./MarkerStopRail";
import MarkerStopDefault from "./MarkerStopDefault";

const AdvancedStopMarker = ({
  title,
  iconColor = "#fff",
  markerColor = "#fff",
  isStopChild,
  isStation,
  markerType,
  width,
  height,
  vehicleMode,
  ...props
}) => {
  if (markerType === "mode") {
    switch (vehicleMode) {
      case "rail":
        return (
          <MarkerStopRail
            width={height}
            height={height}
            iconColor={iconColor}
            markerColor={markerColor}
          />
        );
      case "bus":
        return (
          <MarkerStopBus
            width={width }
            height={height}
            iconColor={iconColor}
            markerColor={markerColor}
          />
        );
      case "gondola":
        return (
          <MarkerStopGondola
            width={width}
            height={height}
            iconColor={iconColor}
            markerColor={markerColor}
          />
        );
      default:
        return (
          <MarkerStopDefault
            width={width}
            height={height}
            iconColor={iconColor}
            markerColor={markerColor}
          />
        );
    }
  }

  return (
    <>
      {isStation && (
        <MarkerStop
          width={width}
          height={height}
          iconColor={iconColor}
          markerColor={markerColor}
        />
      )}
      {isStopChild && (
        <MarkerStopChild
          width={width}
          height={height}
          iconColor={iconColor}
          markerColor={markerColor}
        />
      )}
    </>
  );
};

export default AdvancedStopMarker;
