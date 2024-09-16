import React from "react";
import AbstractOverlay from "../AbstractOverlay";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  LayerGroup,
  FeatureGroup,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { setLocation } from "../../../actions/map";
import { serviceareaLocationsQuery } from "../../../actions/servicearea";

import MarkerServiceArea from "../../icons/modern/MarkerServiceArea";

import ReactDOMServer from "react-dom/server";

import FromToLocationPicker from "../../from-to-location-picker";
import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";
import { bbToRadiusInMeters } from "../../../util/bbToRadius";

import DirectionBadge from "../../icons/direction-badge";
import BadgeIcon from "../../icons/badge-icon";

import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";

const tooltip = ({ text }) => (
  <Tooltip id="tooltip" positionTop="-3px">
    {text}
  </Tooltip>
);

class ServiceareaOverlay extends MapLayer {
  constructor(props) {
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this);
    this._stopRefreshing = this._stopRefreshing.bind(this);
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    serviceareaLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    // ititial station retrieval
    // this.props.serviceareaLocationsQuery(this.props.api);

    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.serviceareaLocationsQuery(this.props.api);
    // }, 30000); // defaults to every 30 sec. TODO: make this configurable?*/
    const bb = getItem("mapBounds");
    const params = bb;
    if (launchNow === true) {
      this.props.serviceareaLocationsQuery(this.props.api, params);
    } else {
      if (this._refreshTimer) clearTimeout(this._refreshTimer);

      this._refreshTimer = setTimeout(() => {
        const bb = getItem("mapBounds");
        const params = bb;
        this.props.serviceareaLocationsQuery(this.props.api, params);
      }, 500);
    }
  }

  _stopRefreshing() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
  }

  componentDidMount() {
    this.props.registerOverlay(this);
    if (this.props.visible) {
      this.props.leaflet.map.on("moveend", this._startRefreshing);
      this._startRefreshing();
    }
  }

  onOverlayAdded = () => {
    this.props.leaflet.map.on("moveend", this._startRefreshing);
    this._startRefreshing(true);
    const { locations, overlayServiceareaConf } = this.props;
    const { map } = this.props.leaflet;
    const newLoc = [];
    if (overlayServiceareaConf.startCenter) {
      map.flyTo(overlayServiceareaConf.startCenter);
    }
  };

  onOverlayRemoved = () => {
    this.props.leaflet.map.off("moveend", this._startRefreshing);
    this._stopRefreshing();
  };

  componentWillUnmount() {
    this.props.leaflet.map.off("moveend", this._startRefreshing);
    this._stopRefreshing();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this._startRefreshing();
      this.props.leaflet.map.on("moveend", this._startRefreshing);
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing();
      this.props.leaflet.map.off("moveend", this._startRefreshing);
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const {
      locations,
      overlayServiceareaConf,
      markerCluster,
      t,
      activeFilters,
    } = this.props;

    if (!locations || locations.length === 0) return <LayerGroup />;
    const bb = getItem("mapBounds");

    let locationsFiltered = locations.filter((single) => {
      if (
        bb.minLon <= single.lon &&
        single.lon <= bb.maxLon &&
        bb.minLat <= single.lat &&
        single.lat <= bb.maxLat
      ) {
        return true;
      }
    });

    locationsFiltered = filterOverlay(
      locationsFiltered,
      activeFilters[overlayServiceareaConf.type]
    );

    const markerIcon = (data) => {
      let badgeType = "success";
      let badgeCounter = 0;
      let { iconWidth, iconHeight } = overlayServiceareaConf;

      return divIcon({
        className: "",
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [iconWidth / 2, iconHeight],
        popupAnchor: [0, -iconHeight - 20],
        html: ReactDOMServer.renderToStaticMarkup(
          <DirectionBadge direction={data?.direction}>
            <MarkerServiceArea
              width={iconWidth}
              height={iconHeight}
              iconColor={overlayServiceareaConf.iconColor}
              markerColor={overlayServiceareaConf.iconMarkerColor}
            />
          </DirectionBadge>
        ),
      });
    };

    const Direction = (data) => {
      const dir = `${data?.direction}`.toLowerCase();

      let d = t("both");
      if (dir === "s" || dir === "sud") {
        d = t("south");
      } else if (dir === "n" || dir === "nord") {
        d = t("north");
      }
      return d;
    };

    const clusterIcon = (cluster) => {
      const text = cluster.getChildCount();

      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [
          overlayServiceareaConf.iconWidth,
          overlayServiceareaConf.iconHeight,
        ],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayServiceareaConf.iconMarkerColor}
          />
        ),
      });
    };

    return (
      <LayerGroup>
        <FeatureGroup>
          <AdvancedMarkerCluster
            enabled={markerCluster}
            showCoverageOnHover={false}
            maxClusterRadius={40}
            disableClusteringAtZoom={16}
            iconCreateFunction={clusterIcon}
          >
            {locationsFiltered.map((station) => {
              return (
                <Marker
                  icon={markerIcon(station)}
                  key={Number(station.station_id)}
                  position={[station.lat, station.lon]}
                  onClick={(e) => {
                    e.target.openPopup();
                  }}
                >
                  <Popup>
                    <div className="otp-ui-mapOverlayPopup">
                      <div className="otp-ui-mapOverlayPopup__popupHeader">
                        <MarkerServiceArea
                          width={24}
                          height={20}
                          style={{ verticalAlign: "bottom" }}
                        />
                        &nbsp; {t("service_areas")}
                      </div>
                      <div className="otp-ui-mapOverlayPopup__popupTitle">
                        {station.name}
                      </div>

                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoServiceArea">
                          {/* <b>{t("service_direction")}: </b>{Direction(station)} */}
                          {/*<br />
                     <b>Km: </b> {station.km}
                    <br /> */}
                          <p className="services-title">{t("services")}</p>
                          <div className="services">
                            {station.info
                            .filter(info => info?.active)
                            .map((info) => {
                              return (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={tooltip({ text: info.name })}
                                >
                                  <img
                                    src={info.img}
                                    tile={info.name}
                                    alt={info.name}
                                    style={{
                                      padding: "0 3px",
                                      maxHeight: "30px",
                                      maxWidth: "30px",
                                    }}
                                  />
                                </OverlayTrigger>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="popup-row">
                        <FromToLocationPicker
                          location={station}
                          setLocation={this.props.setLocation}
                        />
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </AdvancedMarkerCluster>
        </FeatureGroup>
      </LayerGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayServiceareaConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "servicearea"
    )[0],
    locations: state.otp.overlay.servicearea?.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  serviceareaLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(ServiceareaOverlay))
);
