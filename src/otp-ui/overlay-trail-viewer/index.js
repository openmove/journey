import { encodedPolylineType, leafletPathType } from "../core-utils/types";
import { setViewedTrail } from "../../actions/trails"
import { connect } from 'react-redux'
import PropTypes from "prop-types";
import React from "react";
import {
  FeatureGroup,
  MapLayer,
  Polyline,
  withLeaflet,
  Tooltip,
} from "react-leaflet";
import { withNamespaces } from "react-i18next";

/**
 * An overlay that will display all polylines of the patterns of a route.
 */
class TrailViewerOverlay extends MapLayer {
  componentDidMount() {}

  // TODO: determine why the default MapLayer componentWillUnmount() method throws an error
  componentWillUnmount() {}

  componentDidUpdate(prevProps) {
    // this.props.leaflet.map.fitBounds(allPoints);
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const { viewedTrail, viewedLocation } = this.props;

    if (!viewedTrail) return <FeatureGroup />;

    const polyline = [];

    viewedLocation?.geometry.split(" ").forEach((coordinateStr) => {
      const coordinateArr = coordinateStr.split(",").map(Number).slice(0, 2);

      // swap values since coordinates are inverted
      const swappedArr = [coordinateArr[1], coordinateArr[0]];

      polyline.push(swappedArr);
    });

    return (
      <Polyline
        color={this.props?.viewedLocation?.lineOptions?.strokeColor}
        positions={polyline}
      />
    );
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  const locations = state.otp.overlay.trails.locations;
  const viewedTrail = state.otp.ui.viewedTrail;

  const viewedLocation = locations.find(
    (location) => location.id === viewedTrail
  );

  return {
    viewedTrail,
    viewedLocation,
  };
};

const mapDispatchToProps = {
  setLocation,
  setViewedTrail,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces()(withLeaflet(TrailViewerOverlay)));
