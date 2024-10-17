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
  Tooltip,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { withNamespaces } from "react-i18next";
import { Button } from "react-bootstrap";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getItem } from "../../core-utils/storage";
import { setLocation } from "../../../actions/map";
import { accidentsLocationsQuery } from "../../../actions/accidents";

//import BadgeIcon from "../icons/badge-icon";

import ReactDOMServer from "react-dom/server";
import FromToLocationPicker from "../../from-to-location-picker";

import { ClassicCar } from "../../icons/classic";

//import polyline from "@mapbox/polyline";

class AccidentsOverlay extends MapLayer {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    api: PropTypes.string,
    accidentsLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing() {}

  _stopRefreshing() {}

  _computeSelectedYears() {
    const filters = this._getFilters(this.props.activeFilters);
    const yearsFilter = filters?.years;

    if (!yearsFilter?.enabled) {
      return [];
    }

    const years = yearsFilter?.values
      ?.filter((v) => v.enabled)
      ?.map((v) => v.value);

    return years;
  }

  _update() {
    const years = this._computeSelectedYears();

    const params = { years };
    this.props.accidentsLocationsQuery(this.props.api, params);
  }

  _getFilters(filters) {
    const { overlayAccidentsConf } = this.props;
    return filters[overlayAccidentsConf.type];
  }

  componentDidMount() {
    this.props.registerOverlay(this);

    if (this.props.visible) {
      this._update();
    }
  }

  componentWillUnmount() {}

  onOverlayAdded = (e) => {
    this._update();
  };

  onOverlayRemoved = () => {};

  componentDidUpdate(prevProps) {
    const filters = this._getFilters(this.props.activeFilters);
    const prevFilters = this._getFilters(prevProps.activeFilters);

    const objectsEqual = (o1, o2) =>
      Object.keys(o1).length === Object.keys(o2).length &&
      Object.keys(o1).every((p) => o1[p] === o2[p]);

    const arraysEqual = (a1, a2) =>
      a1?.length === a2?.length &&
      a1.every((o, idx) => objectsEqual(o, a2[idx]));

    if (!prevProps.visible && this.props.visible) {
      this._update();
    } else if (
      this.props.visible &&
      filters?.years?.values &&
      (!prevFilters?.years?.values ||
        !arraysEqual(filters?.years.values, prevFilters?.years.values))
    ) {
      this._update();
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}
  colorGradient(fadeFraction, hexColor1, hexColor2, hexColor3) {
    // https://stackoverflow.com/q/30143082
    let color1 = this.hexToRGB(hexColor1);
    let color2 = this.hexToRGB(hexColor2);
    const color3 = this.hexToRGB(hexColor3);
    let fade = Math.floor(fadeFraction * 100) / 100;

    // Do we have 3 colors for the gradient? Need to adjust the params.
    if (color3) {
      fade = fade * 2;

      // Find which interval to use and adjust the fade percentage
      if (fade >= 1) {
        fade -= 1;
        color1 = this.hexToRGB(hexColor2);
        color2 = color3;
      }
    }

    var diffRed = color2.red - color1.red;
    var diffGreen = color2.green - color1.green;
    var diffBlue = color2.blue - color1.blue;

    var gradient = {
      red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
      green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
      blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
    };

    return (
      "rgb(" + gradient.red + "," + gradient.green + "," + gradient.blue + ")"
    );
  }

  hexToRGB(hex) {
    // https://stackoverflow.com/a/28056903
    var red = parseInt(hex.slice(1, 3), 16),
      green = parseInt(hex.slice(3, 5), 16),
      blue = parseInt(hex.slice(5, 7), 16);

    return {
      red,
      green,
      blue,
    };
  }
  render() {
    const { locations, overlayAccidentsConf } = this.props;

    let minNumberOfAccidents = 0;
    let maxNumberOfAccidents = 0;
    this.props.locations.stations?.forEach((station) => {
      if (station?.incidenti > maxNumberOfAccidents) {
        maxNumberOfAccidents = station?.incidenti;
      }
      if (station?.incidenti < minNumberOfAccidents) {
        minNumberOfAccidents = station?.incidenti;
      }
    });

    this.minNumberOfAccidents = minNumberOfAccidents;
    this.maxNumberOfAccidents = maxNumberOfAccidents;



    const getStyle = (station) => {
      const fade = !this.maxNumberOfAccidents
        ? 0
        : (station.incidenti - this.minNumberOfAccidents) /
          (this.maxNumberOfAccidents - this.minNumberOfAccidents);

      return {
        weight: 7,
        // overlayAccidentsConf.levelColors[feature.properties.level]
        color: this.colorGradient(
          // normalize
          fade,
          overlayAccidentsConf.levelColors[0],
          overlayAccidentsConf.levelColors[1],
          overlayAccidentsConf.levelColors[2]
        ),
      };
    };

    if (!locations || !locations.stations || locations.stations.length === 0)
      return <LayerGroup />;

    return (
      <LayerGroup>
        {locations?.stations
          ?.filter(
            (station) => station.geometry?.geometry?.coordinates?.length > 0
          )
          ?.map((station) => {
            return (
              <Polyline
                key={Object.entries(station._id).join("-")}
                positions={station?.geometry.geometry.coordinates?.map(
                  ([lon, lat]) => [lat, lon]
                )}
                {...getStyle(station)}
              >
                <Tooltip sticky={true}>
                  <div className="leaflet-tooltip-content">
                    <p>{`km${station._id.da} - km${station._id.a}`}</p>
                    <p>{this._computeSelectedYears()?.join(",")}</p>
                    <p>
                      <b>{`${station.incidenti} incidenti`}</b>
                    </p>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}
      </LayerGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayAccidentsConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "accidents"
    )[0],
    locations:
      state.otp.overlay.accidents && state.otp.overlay.accidents.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  accidentsLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(AccidentsOverlay))
);
