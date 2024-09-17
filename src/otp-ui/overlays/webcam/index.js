import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  LayerGroup,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { withNamespaces } from "react-i18next";
import "react-circular-progressbar/dist/styles.css";
import { setLocation } from "../../../actions/map";
import { webcamLocationsQuery } from "../../../actions/webcam";
import BadgeIcon from "../../icons/badge-icon";
import ReactDOMServer from "react-dom/server";
import moment from 'moment'
import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";
import WebCamStation from "../../icons/modern/WebCamStation";
import WebCamIcon from "../../icons/modern/WebCamIcon";
import camDefault from "../../../images/webcam/camDefault.png"
import { getItem } from "../../core-utils/storage";
import { setTimeout } from "core-js";
import { filterOverlay } from "../../core-utils/overlays";

class WebcamOverlay extends MapLayer {

  constructor(props){
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    webcamLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    const bb =  getItem('mapBounds')
    const params = bb
    // ititial station retrieval
    if(launchNow === true){
      this.props.webcamLocationsQuery(this.props.api, params);

    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer);
      this._refreshTimer =  setTimeout(()=>{
        const bb =  getItem('mapBounds')
        const params = bb
        this.props.webcamLocationsQuery(this.props.api, params);
      },500)
    }
    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.webcamLocationsQuery(this.props.api);
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
    const { locations, overlayWebCamConf , t } = this.props;
    this._startRefreshing(true);
    const newLoc = []
    const { map } = this.props.leaflet;

    if(overlayWebCamConf.startCenter){
      map.flyTo(overlayWebCamConf.startCenter);
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
    const { locations, overlayWebCamConf, t, activeFilters } = this.props;
    const isMarkClusterEnabled = overlayWebCamConf.markerCluster
    if (!locations || locations.length === 0) return <LayerGroup />;
    const bb =  getItem('mapBounds')

    let locationsFiltered = locations.filter((single)=>{
      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }

    })

    locationsFiltered = filterOverlay(locationsFiltered, activeFilters[ overlayWebCamConf.type ]);

    const markerIcon = (station) => {
      let badgeType = "success";

      if (station.active === true) {
        badgeType = "success";
      } else {
        badgeType = "danger";
      }

      return divIcon({
        className: "",
        iconSize: [overlayWebCamConf.iconWidth, overlayWebCamConf.iconHeight],
        iconAnchor: [
          overlayWebCamConf.iconWidth / 2,
          overlayWebCamConf.iconHeight,
        ],
        popupAnchor: [0, -overlayWebCamConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <BadgeIcon type={badgeType} width={overlayWebCamConf.iconWidth}>
            <WebCamStation
              width={overlayWebCamConf.iconWidth}
              height={overlayWebCamConf.iconHeight}
              iconColor={overlayWebCamConf.iconColor}
              markerColor={overlayWebCamConf.iconMarkerColor}
            />
          </BadgeIcon>
        ),
      });
    };

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [overlayWebCamConf.iconWidth, overlayWebCamConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayWebCamConf.iconMarkerColor}
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

            const timeStamp =  moment(station.timestamp).utcOffset(0).format("L LT")
            const lastUpdate = moment(station.lastUpdate).utcOffset(0).format("L LT")
            return (
               <Marker
                icon={markerIcon(station)}
                key={station.station_id}
                position={[station.lat, station.lon]}
                onClick={(e)=>{ e.target.openPopup()}}
              >
                <Popup ref={this.popup}>
                  <div className="otp-ui-mapOverlayPopup">
                  <div className="otp-ui-mapOverlayPopup__popupHeader">
                  <WebCamIcon/> &nbsp;{t('webcam')}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                    <small>{t('provider')}: {station.operator}</small>
                    { !station.active &&  <p className="alert-text-popup">Immagine proveniente dal ultimo stato attivo della webcam</p> }
                    <p>{ station.active ? timeStamp : lastUpdate }</p>
                  { station.thumbnail ? <a href={station.thumbnail} target="_blank" ><img src={station.thumbnail} className="img-cam"/></a> : <img src={camDefault} className="img-cam"/> }
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
    overlayWebCamConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'webcam')[0],
    locations: state.otp.overlay.webcam && state.otp.overlay.webcam.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  webcamLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(WebcamOverlay))
);
