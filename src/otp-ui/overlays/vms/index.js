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
import { vmsLocationsQuery } from "../../../actions/vms";
import BadgeIcon from "../../icons/badge-icon";
import ReactDOMServer from "react-dom/server";
import moment from 'moment'
import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";
import VmsStation from "../../icons/modern/VmsStation";
import VmsIcon from "../../icons/modern/VmsIcon";

import { getItem } from "../../core-utils/storage";
import { setTimeout } from "core-js";


class VmsOverlay extends MapLayer {

  constructor(props){
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    vmsLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    // ititial station retrieval
    const bb =  getItem('mapBounds')
    const params = bb
    if(launchNow === true){
      this.props.vmsLocationsQuery(this.props.api,params);
    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer);
      this._refreshTimer =  setTimeout(()=>{
        const bb =  getItem('mapBounds')
        const params = bb
        this.props.vmsLocationsQuery(this.props.api, params);
      },500)
    }
    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.vmsLocationsQuery(this.props.api);
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
    const { locations,overlayVmsConf, t } = this.props;
    const { map } = this.props.leaflet;

    if(overlayVmsConf.startCenter){
      map.flyTo(overlayVmsConf.startCenter);
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
      this.props.leaflet.map.on("moveend", this._startRefreshing)
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing();
      this.props.leaflet.map.off("moveend", this._startRefreshing)
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const { locations, overlayVmsConf, t } = this.props;
    const isMarkClusterEnabled = overlayVmsConf.markerCluster

    if (!locations || locations.length === 0) return <LayerGroup />;
    const bb =  getItem('mapBounds')


    const locationsFiltered = locations.filter((single)=>{

      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }

    })

    const markerIcon = (station) => {
      let badgeType = "success";

      if (station.active === true) {
        badgeType = "success";
      } else {
        badgeType = "danger";
      }

      return divIcon({
        className: "",
        iconSize: [overlayVmsConf.iconWidth, overlayVmsConf.iconHeight],
        iconAnchor: [
          overlayVmsConf.iconWidth / 2,
          overlayVmsConf.iconHeight,
        ],
        popupAnchor: [0, -overlayVmsConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <BadgeIcon type={badgeType} width={overlayVmsConf.iconWidth}>
            <VmsStation
              width={overlayVmsConf.iconWidth}
              height={overlayVmsConf.iconHeight}
              img={station.img}
              iconColor={overlayVmsConf.iconColor}
              markerColor={overlayVmsConf.iconMarkerColor}
            />
          </BadgeIcon>
        ),
      });
    };

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [overlayVmsConf.iconWidth, overlayVmsConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayVmsConf.iconMarkerColor}
          />
        ),
      });
    };
    return (
      <LayerGroup>
        <AdvancedMarkerCluster
          enabled={overlayVmsConf}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={16}
          iconCreateFunction={markerClusterIcon}
        >
          {locationsFiltered.map((station) => {
            const timeStamp =  moment(station.time).format('Do MMMM YYYY, h:mm:ss a')
            const lastUpdate = moment(station.lastUpdate).format('Do MMMM YYYY, h:mm:ss a')
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
                  {/* <VmsIcon img={station.img}/> &nbsp;{t('vms')} */}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                    <small>{t('stop_id')}: {station.station_id}</small>
                    {/* { !station.active &&  <p className="alert-text-popup">Immagine proveniente dal ultimo stato attivo della webcam</p> } */}
                    {/* <p>{ station.active ? timeStamp : lastUpdate }</p> */}
                  <p className="alert-text-popup">Ultimo aggiornamento:</p>
                  <p>{timeStamp}</p>
                  <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">
                  <p>text: {station.text}</p>
                  </div>
                  {/* <p>name: {station.name}</p>
                  <p>time: {station.time}</p>
                  <p>type: {station.type}</p>
                  <p>img: {station.img}</p> */}
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
    overlayVmsConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'vms')[0],
    locations: state.otp.overlay.vms && state.otp.overlay.vms.locations
  };
};

const mapDispatchToProps = {
  setLocation,
  vmsLocationsQuery: vmsLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(VmsOverlay))
);
