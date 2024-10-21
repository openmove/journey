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
import { colorGradient } from "../../core-utils/color";

import ReactDOMServer from "react-dom/server";
import FromToLocationPicker from "../../from-to-location-picker";

import { ClassicCar } from "../../icons/classic";


class AccidentsOverlay extends MapLayer {
  constructor(props) {
    super(props);
  }

  _startRefreshing() {}

  _stopRefreshing() {}

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

  _update() {
    const years = this._computeSelectedYears();

    const params = { years };
    this.props.accidentsLocationsQuery(this.props.api, params);
  }

  createLeafletElement() {}

  updateLeafletElement() {}


  render() {
    const { locations, overlayAccidentsConf,t } = this.props;

    if (!locations || !locations.stations || locations.stations.length === 0)
      return <LayerGroup />;

    this._computeRangeOfAccidentsValues();
    const years = this._computeSelectedYears();

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
                weight={7}
                color={colorGradient(
                  this._normalizeAccidentsValue(station.incidenti),
                  overlayAccidentsConf.levelColors[0],
                  overlayAccidentsConf.levelColors[1],
                  overlayAccidentsConf.levelColors[2]
                )}
              >
                <Tooltip sticky={true}>
                  <div className="leaflet-tooltip-content">
                    <p>{`km ${station.da_km} - km ${station.a_km}`}</p>
                    <p>
                      {years?.length > 0
                        ? years?.join(", ")
                        : this._computeYearsRange()?.join(" - ")}
                    </p>
                    <p>
                      <b>{`${station.incidenti} ` + t('accidents_label')}</b>
                    </p>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}
      </LayerGroup>
    );
  }

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

  _computeYearsRange() {
    const { locations } = this.props;

    if (!locations || !locations.stations || locations.stations.length === 0) {
      return [];
    }

    const filters = this._getFilters(this.props.activeFilters);

    if (!filters) {
      let minYear = -1;
      let maxYear = -1;
      this.props.locations.stations?.forEach((station) => {
        if (station?.year > maxYear) {
          maxYear = station?.year;
        }
        if (station?.year < minYear) {
          minYear = station?.year;
        }
      });

      return minYear > 0 && maxYear > 0 ? [minYear, maxYear] : [];
    }

    const years = filters?.years?.values.map((v) => v.value);

    if (!filters?.years?.enabled) {
      return [];
    }

    const min = Math.min(...years);
    const max = Math.max(...years);

    return [min, max];
  }

  _getFilters(filters) {
    const { overlayAccidentsConf } = this.props;
    return filters[overlayAccidentsConf.type];
  }

  _normalizeAccidentsValue(accidents) {
    // normalize value between 0 and 1
    return !this.maxNumberOfAccidents
      ? 0
      : (accidents - this.minNumberOfAccidents) /
          (this.maxNumberOfAccidents - this.minNumberOfAccidents);
  }

  _computeRangeOfAccidentsValues() {
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
