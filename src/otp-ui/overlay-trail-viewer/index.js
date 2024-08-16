import { encodedPolylineType, leafletPathType } from "../core-utils/types";
import { setViewedTrail } from "../../actions/trails";
import { connect } from "react-redux";
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
  polyline = [];

  computePolyline() {
    const { viewedLocation } = this.props;
    if (!viewedLocation) {
      return;
    }

    const polyline = [];

    viewedLocation?.geometry.split(" ").forEach((coordinateStr) => {
      const coordinateArr = coordinateStr.split(",").map(Number).slice(0, 2);

      // swap values since coordinates are inverted
      const swappedArr = [coordinateArr[1], coordinateArr[0]];

      polyline.push(swappedArr);
    });

    this.polyline = polyline;
  }

  componentDidMount() {}

  // TODO: determine why the default MapLayer componentWillUnmount() method throws an error
  componentWillUnmount() {}

  componentDidUpdate(prevProps) {
    const { viewedTrail, viewedLocation } = this.props;

    if (!viewedTrail || this.props?.viewedTrail === prevProps?.viewedTrail) {
      return;
    }

    if (this.polyline?.length > 0) {
      this.props.leaflet.map.panTo(this.polyline?.[0]);
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const { viewedTrail, viewedLocation } = this.props;

    if (!viewedTrail) return <FeatureGroup />;
    this.computePolyline();

    return (
      <Polyline
        color={this.props?.viewedLocation?.lineOptions?.strokeColor}
        positions={this.polyline}
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
  setViewedTrail,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces()(withLeaflet(TrailViewerOverlay)));
