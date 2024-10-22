import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  LayerGroup,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
  GeoJSON,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { withNamespaces } from "react-i18next";
import "react-circular-progressbar/dist/styles.css";
import { setLocation } from "../../../actions/map";
import { alertsLocationsQuery } from "../../../actions/alerts";
import BadgeIcon from "../../icons/badge-icon";
import ReactDOMServer from "react-dom/server";
import moment from "moment";
import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";
import AlertStation from "../../icons/modern/AlertStation";
import DirectionBadge from "../../icons/direction-badge";

import { getItem } from "../../core-utils/storage";
import { setTimeout } from "core-js";

class AlertsOverlay extends MapLayer {
  constructor(props) {
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this);
    this._stopRefreshing = this._stopRefreshing.bind(this);
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    alertsLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    // ititial station retrieval
    const bb = getItem("mapBounds");
    const params = bb;
    if (launchNow === true) {
      this.props.alertsLocationsQuery(this.props.api, params);
    } else {
      if (this._refreshTimer) clearTimeout(this._refreshTimer);
      this._refreshTimer = setTimeout(() => {
        const bb = getItem("mapBounds");
        const params = bb;
        this.props.alertsLocationsQuery(this.props.api, params);
      }, 500);
    }
    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.alertsLocationsQuery(this.props.api);
    // }, 30000); // defaults to every 30 sec. TODO: make this configurable?*/
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
    const { locations, overlayAlertsConf, t } = this.props;
    const { map } = this.props.leaflet;

    if (overlayAlertsConf.startCenter) {
      map.flyTo(overlayAlertsConf.startCenter);
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
    const { locations, overlayAlertsConf, t, lng } = this.props;
    const isMarkClusterEnabled = overlayAlertsConf.markerCluster;

    const roundedMToKM = (m) => Math.round((Number(m) / 1000 * 100) / 100);

    const getStyle = (feature) => {
      return {
        // weight: feature.properties.name == "area"  ? 0: 2,
        // opacity: feature.properties.name == "area" ? 0.2 : 1,
        // color: geojsonConfig.color || '#dd0000'
      };
    };

    if (!locations || locations.length === 0) return <LayerGroup />;
    const bb = getItem("mapBounds");

    const locationsFiltered = locations.filter((single) => {
      if (
        bb.minLon <= single.lon &&
        single.lon <= bb.maxLon &&
        bb.minLat <= single.lat &&
        single.lat <= bb.maxLat
      ) {
        return true;
      }
    });

    const markerIcon = (station) => {
      return divIcon({
        className: "",
        iconSize: [overlayAlertsConf.iconWidth, overlayAlertsConf.iconHeight],
        iconAnchor: [
          overlayAlertsConf.iconWidth / 2,
          overlayAlertsConf.iconHeight,
        ],
        popupAnchor: [0, -overlayAlertsConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <DirectionBadge direction={station?.direction} bottom>
            <AlertStation
              width={overlayAlertsConf.iconWidth}
              height={overlayAlertsConf.iconHeight}
              img={station.icon}
              iconColor={overlayAlertsConf.iconColor}
              markerColor={overlayAlertsConf.iconMarkerColor}
            />
          </DirectionBadge>
        ),
      });
    };

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [overlayAlertsConf.iconWidth, overlayAlertsConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayAlertsConf.iconMarkerColor}
          />
        ),
      });
    };
    return (
      /*     <LayerGroup>
      <LayerGroup>
      { locations .filter((station)=>{
          station?.geometry
        })
        .map((station) => (
          <GeoJSON
          data={station?.geometry}
          // style={getStyle}
        />

        ))}
        </LayerGroup> */

      <LayerGroup>
        <AdvancedMarkerCluster
          enabled={overlayAlertsConf}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={null}
          iconCreateFunction={markerClusterIcon}
        >
          {locationsFiltered.map((station) => {
            const startDate =
              station.date_start != null
                ? moment(station.date_start).format("L LT")
                : null;
            const endDate =
              station.date_end != null
                ? moment(station.date_end).format("L LT")
                : null;
            return (
              <Marker
                icon={markerIcon(station)}
                key={station.station_id}
                position={[station.lat, station.lon]}
                onClick={(e) => {
                  e.target.openPopup();
                }}
              >
                <Popup ref={this.popup}>
                  <div className="otp-ui-mapOverlayPopup">
                    <div className="otp-ui-mapOverlayPopup__popupHeader">
                      <AlertStation
                        width={"20px"}
                        height={"20px"}
                        img={station.icon}
                        iconColor={overlayAlertsConf.iconColor}
                        markerColor={overlayAlertsConf.iconMarkerColor}
                      />
                      &nbsp;
                      {station.name?.[lng]
                        ? station.name?.[lng]
                        : station.name?.en}
                    </div>
                    <div className="otp-ui-mapOverlayPopup__popupTitle">
                        {station.desc?.[lng]
                          ? station.desc?.[lng]
                          : station.desc?.en}
                    </div>
                    <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">

                    </div>
                    <small>{`km ${roundedMToKM(station.start_meter)} - km ${roundedMToKM(station.end_meter)}`}</small>
                      <br/>
                    {startDate && endDate && (
                      <small>
                        {" "}
                        {startDate} - {endDate}{" "}
                      </small>
                    )}
                    {!startDate && endDate && (
                      <small>
                        {" "}
                        {t("until")} {endDate}{" "}
                      </small>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </AdvancedMarkerCluster>
      </LayerGroup>
      // </LayerGroup>
    );
  }
}
// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  return {
    overlayAlertsConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "alerts"
    )[0],
    locations: state.otp.overlay.alerts && state.otp.overlay.alerts.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  alertsLocationsQuery: alertsLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(AlertsOverlay))
);
