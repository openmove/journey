import React from 'react'
import AbstractOverlay from '../AbstractOverlay'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import {
  LayerGroup,
  FeatureGroup,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
} from "react-leaflet";
import { divIcon } from 'leaflet'
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { setLocation } from '../../../actions/map'
import { tollGatesLocationsQuery } from '../../../actions/tollgates'

import MarkerTollGate from "../../icons/modern/MarkerTollGate";
import TollGate from "../../icons/modern/TollGate";

import ReactDOMServer from "react-dom/server";

import FromToLocationPicker from '../../from-to-location-picker'
import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";
import { bbToRadiusInMeters } from "../../../util/bbToRadius";

class TollGatesOverlay extends MapLayer {

  constructor(props) {
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this);
    this._stopRefreshing = this._stopRefreshing.bind(this);
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    tollGatesLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    // ititial station retrieval
    // this.props.tollGatesLocationsQuery(this.props.api);

    // set up timer to refresh stations periodically
    // this._refreshTimer = setInterval(() => {
    //   this.props.tollGatesLocationsQuery(this.props.api);
    // }, 30000); // defaults to every 30 sec. TODO: make this configurable?*/
    const bb =  getItem('mapBounds')
    const params = bb
    if(launchNow === true){
      this.props.tollGatesLocationsQuery(this.props.api , params);

    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer);

      this._refreshTimer =  setTimeout(()=>{
        const bb =  getItem('mapBounds')
        const params = bb
        this.props.tollGatesLocationsQuery(this.props.api, params);
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
    const { locations, overlayTollGatesConf } = this.props;
    const { map } = this.props.leaflet;
    const newLoc = [];

    if (overlayTollGatesConf.startCenter) {
      map.flyTo(overlayTollGatesConf.startCenter);
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
    const { locations, overlayTollGatesConf, t ,activeFilters} = this.props
      console.log(this.props);

    if (!locations || locations.length === 0) return <LayerGroup />
    const bb =  getItem('mapBounds')

    let locationsFiltered = locations.filter((single)=>{
      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }
    })

    locationsFiltered = filterOverlay(locationsFiltered, activeFilters[ overlayTollGatesConf.type ]);

    const markerIcon = (data) => {
      let badgeType = 'success';
      let badgeCounter = 0;
      let {iconWidth, iconHeight} = overlayTollGatesConf;

      return divIcon({
        className: "",
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [iconWidth/2, iconHeight],
        popupAnchor: [0, -iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerTollGate
            width={iconWidth}
            height={iconHeight}
            iconColor={overlayTollGatesConf.iconColor}
            markerColor={overlayTollGatesConf.iconMarkerColor}
          />
        )
      });
    }

    return (
      <LayerGroup>
      <FeatureGroup>
        {
          locationsFiltered.map( station => {
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
                 <TollGate width={24} height={20} style={{verticalAlign:"bottom"}}/>&nbsp; {t("toll_gates")}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>

                  <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                    <p className="note">{station.note}</p>
                    <div className="otp-ui-mapOverlayPopup__popupAvailableInfo-list-block--left-aligned ">
                    <h5>{t("toll-gates-entrances-title")}</h5>
                    <ul >
                      <li>{t("toll-gates-entrances-total")}{station.n_entrances}</li>
                      <li>{t("toll-gates-entrances-telepass")}{station.n_entrances_telepass}</li>
                      <li>{t("toll-gates-entrances-telepass-dedicated")}{station.n_entrances_telepass_dedicated}</li>
                    </ul>
                    </div>
                    <div className="otp-ui-mapOverlayPopup__popupAvailableInfo-list-block--left-aligned ">
                    <h5>{t("toll-gates-exits-title")}</h5>
                    <ul>
                    <li>{t("toll-gates-exits-total")}{station.n_exits}</li>
                    <li>{t("toll-gates-exits-telepass")}{station.n_exits_telepass}</li>
                    <li>{t("toll-gates-exits-telepass-dedicated")}{station.n_exits_telepass_dedicated}</li>
                    </ul>
                    </div>
                  </div>

                  <div className='popup-row'>
                    <FromToLocationPicker
                      location={station}
                      setLocation={this.props.setLocation}
                    />
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </FeatureGroup>
      </LayerGroup>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayTollGatesConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'toll_gates')[0],
    locations: state.otp.overlay.tollGates?.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  tollGatesLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(TollGatesOverlay))
);

