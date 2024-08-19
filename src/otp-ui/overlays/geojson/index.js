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
import { geojsonLocationsQuery } from '../../../actions/geojson';

//import ReactDOMServer from "react-dom/server";


class GeojsonOverlay extends MapLayer {

  constructor(props){
    super(props);
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    geojsonLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
  }

  _startRefreshing() {
    // ititial station retrieval
    this.props.geojsonLocationsQuery(this.props.api)
    const {overlayGeojsonConf} = this.props;

    // set up timer to refresh stations periodically
    if (this._refreshTimer)  clearInterval(this._refreshTimer) // needed to not create multiple intervals
    this._refreshTimer = setInterval(() => {
      this.props.geojsonLocationsQuery(this.props.api)
    }, Number(overlayGeojsonConf.pollingInterval || 30000)) // defaults to every 30 sec. TODO: make this configurable?*/
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

  onOverlayAdded = (e) => {
    this._startRefreshing();
    const { map } = this.props.leaflet;
    const {overlayGeojsonConf} = this.props;

    if(overlayGeojsonConf.startCenter){
      map.flyTo(overlayGeojsonConf.startCenter);
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
    const { geojson, overlayGeojsonConf } = this.props

    const getStyle = feature => ({
      weight: 4,
      //opacity: !feature.properties.level ? 0.4 : 1,
      color: overlayGeojsonConf.color || '#dd0000'
    });

    if (!geojson ||
      !geojson?.features ||
      geojson?.features.length === 0) return <LayerGroup />


    return (
      <LayerGroup>
        <GeoJSON
          data={geojson?.features}
          style={getStyle}
        />
      </LayerGroup>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    overlayGeojsonConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'geojson')[0],
    geojson: state.otp.overlay.geojson && state.otp.overlay.geojson.geojson
  }
}

const mapDispatchToProps = {
  setLocation,
  geojsonLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(GeojsonOverlay)))


