import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { LayerGroup, FeatureGroup, GeoJSON, MapLayer, Marker, Popup, withLeaflet, Polyline } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { withNamespaces } from "react-i18next";
import { Button } from "react-bootstrap";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getItem } from "../../core-utils/storage";
import { setLocation } from '../../../actions/map';
import { trafficLocationsQuery } from '../../../actions/traffic';

//import BadgeIcon from "../icons/badge-icon";

import ReactDOMServer from "react-dom/server";
import FromToLocationPicker from '../../from-to-location-picker'

import { ClassicCar } from "../../icons/classic";

//import polyline from "@mapbox/polyline";


class TrafficOverlay extends MapLayer {

  constructor(props){
    super(props);
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    //locations: PropTypes.array,
    // locations: PropTypes.object.isRequired,
    trafficLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
  }

  _startRefreshing() {
    const bb =  getItem('mapBounds')
    const params = bb
    // ititial station retrieval
    this.props.trafficLocationsQuery(this.props.api, params)
    const {overlayTrafficConf} = this.props;

    // set up timer to refresh stations periodically
    if (this._refreshTimer)  clearInterval(this._refreshTimer) // needed to not create multiple intervals
    this._refreshTimer = setInterval(() => {
      const bb =  getItem('mapBounds')
      const params = bb
      this.props.trafficLocationsQuery(this.props.api, params)
    }, Number(overlayTrafficConf.pollingInterval || 30000)) // defaults to every 30 sec. TODO: make this configurable?*/
  }

  _stopRefreshing() {
    if (this._refreshTimer) clearInterval(this._refreshTimer)
  }

  componentDidMount() {
    this.props.registerOverlay(this)

    if (this.props.visible) {
      this._startRefreshing()
    }
    //this.props.leaflet.map.on('zoomend', this.updatePolylineWeigth);
  }

  componentWillUnmount() {
    this._stopRefreshing()
    //this.props.leaflet.map.off('zoomend', this.updatePolylineWeigth);
  }

  /*  updatePolylineWeigth = () => {
      const z = this.props.leaflet.map.getZoom();
      console.log('ZOOM',z);

      //TODO change geojson layer weight

    }*/

  onOverlayAdded = (e) => {
    this._startRefreshing();
    const { map } = this.props.leaflet;
    const {overlayTrafficConf} = this.props;

    if(overlayTrafficConf.startCenter){
      map.flyTo(overlayTrafficConf.startCenter);
    }
  }

  onOverlayRemoved = () => {
    this._stopRefreshing()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this._startRefreshing()
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing()
    }
  }

  createLeafletElement() { }

  updateLeafletElement() { }

  render() {
    const { locations, overlayTrafficConf } = this.props

    const getStyle = feature => ({
      weight: 4,
      opacity: !feature.properties.level ? 0.4 : 1,
      color: overlayTrafficConf.levelColors[feature.properties.level]
    });

    const onEachFeature = (feature, layer) => {
      if (feature.properties?.value) {
        let time = Math.round(feature.properties.value / 60);

        if (feature.properties.level > 1) {
          layer.bindTooltip(ReactDOMServer.renderToString(
            <span><ClassicCar height={14} width={14} />&nbsp;{time} min</span>
          ), {
            permanent: true,
            sticky: true
          });
        }
      }
    };

    if (!locations ||
      !locations.linkstations ||
      locations.linkstations.length === 0) return <LayerGroup />

    return (
      <LayerGroup>
        <GeoJSON
          data={locations.linkstations}
          onEachFeature={onEachFeature}
          style={getStyle}
        />
      </LayerGroup>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayTrafficConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'traffic')[0],
    locations: state.otp.overlay.traffic && state.otp.overlay.traffic.locations
  }
}

const mapDispatchToProps = {
  setLocation,
  trafficLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(TrafficOverlay)))
