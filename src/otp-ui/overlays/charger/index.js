import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
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
import { chargerLocationsQuery } from "../../../actions/charger";

import BadgeIcon from "../../icons/badge-icon";
import MarkerCharger from "../../icons/modern/MarkerCharger";
import ReactDOMServer from "react-dom/server";
import Charger from "../../icons/modern/Charger";
import FromToLocationPicker from "../../from-to-location-picker";

import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";

import connectedStopsOverlay from "../../../components/map/connected-stops-overlay";
import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";


class ChargerOverlay extends MapLayer {

  constructor(props){
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    chargerLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    // ititial station retrieval
    // this.props.chargerLocationsQuery(this.props.api);

    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.chargerLocationsQuery(this.props.api);
    // }, 30000); // defaults to every 30 sec. TODO: make this configurable?*/
    const bb =  getItem('mapBounds')
    const params = bb
    if(launchNow === true){
      this.props.chargerLocationsQuery(this.props.api , params);

    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer);

      this._refreshTimer =  setTimeout(()=>{
        const bb =  getItem('mapBounds')
        const params = bb
        this.props.chargerLocationsQuery(this.props.api, params);
      },500)

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
    const { locations, overlayChargerConf } = this.props;
    const { map } = this.props.leaflet;
    const newLoc = []

    if(overlayChargerConf.startCenter){
      map.flyTo(overlayChargerConf.startCenter);
    }

  };

  onOverlayRemoved = () => {
    this.props.leaflet.map.off("moveend", this._startRefreshing)
    this._stopRefreshing();
  };

  componentWillUnmount() {
    this.props.leaflet.map.off("moveend", this._startRefreshing)
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
    const { locations, t, overlayChargerConf, activeFilters } = this.props;
    const isMarkClusterEnabled = overlayChargerConf.markerCluster

    if (!locations || locations.length === 0) return <LayerGroup />;

    const bb =  getItem('mapBounds')

    const locationsFiltered = filterOverlay(
      locations.filter((single)=>{
        if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
          return true;
        }
      }),
      activeFilters[overlayChargerConf.type]
    );

    const markerIcon = (station) => {
      let badgeType = "default";
      let badgeCounter = station.capacity || 0;
      if (station.free == null ){
        badgeType = "default";
      } else if (station.free > 0) {
        badgeType = "warning";
        if (station.free === station.capacity) {
          badgeType = "success";
        }
      } else {
        badgeType = "danger";
      }

      return divIcon({
        className: "",
        iconSize: [overlayChargerConf.iconWidth, overlayChargerConf.iconHeight],
        iconAnchor: [
          overlayChargerConf.iconWidth / 2,
          overlayChargerConf.iconHeight,
        ],
        popupAnchor: [0, -overlayChargerConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <BadgeIcon type={badgeType} width={overlayChargerConf.iconWidth}>
            <MarkerCharger
              width={overlayChargerConf.iconWidth}
              height={overlayChargerConf.iconHeight}
              iconColor={overlayChargerConf.iconColor}
              markerColor={overlayChargerConf.iconMarkerColor}

            />
          </BadgeIcon>
        ),
      });
    };

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [overlayChargerConf.iconWidth, overlayChargerConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayChargerConf.iconMarkerColor}
          />
        ),
      });
    };


    return (
      <LayerGroup>
        <AdvancedMarkerCluster
          enabled={isMarkClusterEnabled}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={16}
          iconCreateFunction={markerClusterIcon}
        >
          {locationsFiltered.map((station) => {
            return (
              <Marker
                icon={markerIcon(station)}
                key={station.station_id}
                position={[station.lat, station.lon]}
                onClick={(e)=>{ e.target.openPopup()}}
              >
                <Popup>
                  <div className="otp-ui-mapOverlayPopup">
                    <div className="otp-ui-mapOverlayPopup__popupHeader">
                      <Charger width={24} height={20} />
                      &nbsp;{t("charger")}
                    </div>

                    <div className="otp-ui-mapOverlayPopup__popupTitle">
                      {station.name}
                    </div>

                    <div>
                   {station.provider && `${t("provider")}: ${station.provider}`}
                    </div>
                    { ( station.free!==null || station.capacity!==null ) && (
                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoValue">
                          {station.free!==null ? station.free : station.capacity}
                        </div>
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">
                          {station.free!==null ? t("free_sockets") : t("sockets")}
                        </div>
                      </div>
                      )}
                    <div className="otp-ui-mapOverlayPopup__popupAvailableSlots">
                      {station.plugs.map((plug, key) => {
                        if(plug.plug_id===null){
                          return;
                        }
                        let ava = "bg-default";
                        if(plug.available!==null){
                          ava = plug.available ? "bg-success" : "bg-danger";
                        }
                        plug.maxPower = plug.maxPower !==null ? Math.round(plug.maxPower) : null;

                        return (
                          <div className="otp-ui-mapOverlayPopup__popupAvailableSlotItem" key={key}>
                            <div>
                              <span className={ava}></span>
                              <strong>
                                {t("socket")} {key + 1}
                              </strong>
                              <br />
                              <br />
                              {plug.maxPower && `${plug.maxPower}W`}
                              {(plug.minCurrent && plug.maxCurrent ) && (
                                ` | ${plug.minCurrent}-${plug.maxCurrent}A`
                                )}
                              {(plug.maxPower || plug.minCurrent || plug.maxCurrent )&& (
                                <>
                                  <br />
                                  <br />
                                </>
                              )}
                              <small>
                              {plug.outletTypeCode && ` ${t("socket_type")} ${plug.outletTypeCode}`}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="otp-ui-mapOverlayPopup__popupRow">
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
      </LayerGroup>
    );
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  return {
    locations: state.otp.overlay.charger && state.otp.overlay.charger.locations,
    overlayChargerConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'charger')[0],
  };
};

const mapDispatchToProps = {
  setLocation,
  chargerLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(ChargerOverlay))
);
