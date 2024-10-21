import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  LayerGroup,
  FeatureGroup,
  GeoJSON,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
  Polyline,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { withNamespaces } from "react-i18next";
import { Button } from "react-bootstrap";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getItem } from "../../core-utils/storage";
import { geojsonLocationsQuery } from "../../../actions/geojson";

//import ReactDOMServer from "react-dom/server";

class GeojsonOverlay extends MapLayer {
  constructor(props) {
    super(props);
    this._startRefreshing = this.update.bind(this);
    this._stopRefreshing = this._stopRefreshing.bind(this);
  }

  static propTypes = {
    api: PropTypes.string,
    geojsonLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  update() {
    // ititial station retrieval
    const { geojsonConfig } = this.props;
    this.props.geojsonLocationsQuery(geojsonConfig?.api);
  }

  componentDidMount() {
      this.update();
  }

  componentWillUnmount() {
  }


  componentDidUpdate(prevProps) {
  }

  createLeafletElement() { }

  updateLeafletElement() { }

  render() {
    const { geojson, geojsonConfig } = this.props;

    const getStyle = (feature) => {
      return {
        weight: feature.properties.name == "area" ? 0 : 2,
        opacity: feature.properties.name == "area" ? 0.0001 : 1,
        color:
          feature.properties.name == "area"
            ? geojsonConfig.bgColor || "#dd0000"
            : geojsonConfig.color || "#dd0000",
      };
    };

    if (!geojson || !geojson?.features || geojson?.features.length === 0)
      return <LayerGroup />;

    return (
      <LayerGroup>
        <GeoJSON data={geojson?.features} style={getStyle} />
      </LayerGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayGeojsonConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "geojson"
    )[0],
    geojson: state.otp.overlay.geojson && state.otp.overlay.geojson.geojson,
  };
};

const mapDispatchToProps = {
  geojsonLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(GeojsonOverlay))
);
