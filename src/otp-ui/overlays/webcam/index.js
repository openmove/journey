import React, { useState }  from "react";
import AbstractOverlay from '../AbstractOverlay'
import FontAwesome from 'react-fontawesome'
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

class WebcamOverlay  extends AbstractOverlay {

  constructor(props){
    super({
      props,
      query : props.webcamLocationsQuery,
      api: props?.api,
      config: props.overlayWebCamConf
    });

    this.popup = React.createRef();
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    webcamLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render () {
    const { locations, overlayWebCamConf, t, activeFilters } = this.props;
    const isMarkClusterEnabled = overlayWebCamConf.markerCluster
    if (!locations || locations.length === 0) return <LayerGroup />;
    const bb =  getItem('mapBounds')

    let locationsFiltered = locations.filter((single)=>{
      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }

    })

    const Image = ({ station }) => {
      const [loaded, setLoaded] = useState(false);
      const [error, setError] = useState(false)
      if (station.thumbnail && !error) {
        return (
          <a href={station.thumbnail} target="_blank" >
             <div style={{display: !loaded ? "flex" : "none",}}  className="img-cam otp-ui-locationFilter__loader">
                <FontAwesome
                  name='circle-o-notch'
                  spin={true}
                  size='5x'
                />
            </div>
            <img
             style={{display: loaded ? "block" : "none"}}
              src={
                `${station.thumbnail}?${this.props.timestampToForceImageReload}`
              }
              className="img-cam"
              onLoad={() => setLoaded(true)}
              onError={() => setError(true)}
            />
          </a>
        );
      } else {
        return <img src={camDefault} className="img-cam" />;
      }
    };

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

            const timeStamp =  moment(Number(station.timestamp)).utcOffset(0).format("L LT")
            const lastUpdate = station.lastUpdate != null ? moment(Number(station.lastUpdate) ).format("L LT") : null;

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
                    { !station.active &&  <p className="alert-text-popup">{t("webcam_last_updated_status")}</p> }
                    <p>{lastUpdate }</p>
                  <Image station={station}/>
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
    timestampToForceImageReload: new Date().getTime()
  };
};

const mapDispatchToProps = {
  setLocation,
  webcamLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(WebcamOverlay))
);
