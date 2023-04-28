import React from "react";
import MarkerClusterGroup from "react-leaflet-markercluster";

const AdvancedMarkerCluster = (props) => {
  const {
    showCoverageOnHover = false,
    maxClusterRadius = 40,
    disableClusteringAtZoom,
    iconCreateFunction,
    enabled = true
  } = props;

  if (!enabled) {
    return props.children;
  }

  return (
    <MarkerClusterGroup
      showCoverageOnHover={showCoverageOnHover}
      maxClusterRadius={maxClusterRadius}
      disableClusteringAtZoom={disableClusteringAtZoom}
      iconCreateFunction={iconCreateFunction}
    >
      {props.children}
    </MarkerClusterGroup>
  );
};

export default AdvancedMarkerCluster
