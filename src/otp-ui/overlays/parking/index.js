import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { LayerGroup, FeatureGroup, MapLayer, Marker, Popup, withLeaflet } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { setLocation } from '../../../actions/map'
import { parkingLocationsQuery } from '../../../actions/parking'

import BadgeIcon from "../../icons/badge-icon";

import MarkerParking from "../../icons/modern/MarkerParking";
import MarkerParkingSensor from "../../icons/modern/MarkerParkingSensor";
import ReactDOMServer from "react-dom/server";
import Parking from "../../icons/modern/Parking";
import FromToLocationPicker from '../../from-to-location-picker'
import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";
import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";

class ParkingOverlay extends MapLayer {

  constructor(props){
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    parkingLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
  }

  _startRefreshing (launchNow) {
    // ititial station retrieval
    const bb =  getItem('mapBounds')
    const params = bb
    if(launchNow === true){
      this.props.parkingLocationsQuery(this.props.api, params)
    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer)
      this._refreshTimer = setTimeout(() => {
        const bb =  getItem('mapBounds')
        const params = bb
        this.props.parkingLocationsQuery(this.props.api , params)
      }, 500)
    }

    // set up timer to refresh stations periodically
     // defaults to every 30 sec. TODO: make this configurable?*/
  }

  _stopRefreshing () {
    if (this._refreshTimer) clearTimeout(this._refreshTimer)
  }

  componentDidMount () {
    this.props.registerOverlay(this)

    if (this.props.visible) {
      this.props.leaflet.map.on("moveend", this._startRefreshing);
      this._startRefreshing()
    }
  }

  onOverlayAdded = (e) => {
    this.props.leaflet.map.on("moveend", this._startRefreshing);
    this._startRefreshing(true);
    const { locations, overlayParkingConf } = this.props;
    const newLoc = []
    const { map } = this.props.leaflet;

    if(overlayParkingConf.startCenter){
      map.flyTo(overlayParkingConf.startCenter);
    }
  }

  onOverlayRemoved = () => {
    this.props.leaflet.map.off("moveend", this._startRefreshing)
    this._stopRefreshing()
  }

  componentWillUnmount () {
    this.props.leaflet.map.off("moveend", this._startRefreshing)
    this._stopRefreshing()
  }

  componentDidUpdate (prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this._startRefreshing()
      this.props.leaflet.map.on("moveend", this._startRefreshing)
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing()
      this.props.leaflet.map.off("moveend", this._startRefreshing)
    }
  }

  createLeafletElement () {}

  updateLeafletElement () {}

  render () {
    const { locations,overlayParkingConf, t ,activeFilters} = this.props

    const isMarkClusterEnabled = overlayParkingConf.markerCluster

    if (!locations || locations.length === 0) return <LayerGroup />
    const bb =  getItem('mapBounds')

    let locationsFiltered = locations.filter((single)=>{
      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }
    })

    locationsFiltered = filterOverlay(locationsFiltered, activeFilters[ overlayParkingConf.type ]);

    const markerIcon = (data) => {
      let badgeType = 'success';
      let badgeCounter = 0;
      let iconWidth, iconHeight;

      if( data.type === 'station') {

         if (data.free === 1) {
          badgeType = 'warning';
          badgeCounter = data.free
        }

        if (data.free === 0 ) {
          badgeType = 'danger';
          badgeCounter = null;
        }

        iconWidth = overlayParkingConf.iconWidth;
        iconHeight = overlayParkingConf.iconHeight;
      }
      else if (data.type === 'sensorGroup') {

        badgeCounter = data.capacity;
        iconWidth = parseInt(overlayParkingConf.iconWidth*0.7);
        iconHeight = parseInt(overlayParkingConf.iconHeight*0.7);
      }
      else if (data.type === 'sensor') {

        if (data.free === true ) {
          badgeType = 'success';
        } else if (data.free === false) {
          badgeType = 'danger';
        }
        badgeCounter = null;
        iconWidth = parseInt(overlayParkingConf.iconWidth*0.7);
        iconHeight = parseInt(overlayParkingConf.iconHeight*0.7);
      }

      return divIcon({
        className: "",
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [iconWidth/2, iconHeight],
        popupAnchor: [0, -iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <BadgeIcon type={badgeType} width={iconWidth}>
          { data.type === 'station' &&
            <MarkerParking
              width={iconWidth}
              height={iconHeight}
              iconColor={overlayParkingConf.iconColor}
              markerColor={overlayParkingConf.iconMarkerColor}
            />
          }
          { data.type === 'sensor' &&
            <MarkerParkingSensor
              width={iconWidth}
              height={iconHeight}
              iconColor={overlayParkingConf.iconColor}
              markerColor={overlayParkingConf.iconMarkerColor}
            />
          }
          { data.type === 'sensorGroup' &&
            <MarkerParkingSensor
              width={iconWidth}
              height={iconHeight}
              iconColor={overlayParkingConf.iconColor}
              markerColor={overlayParkingConf.iconMarkerColor}
            />
          }
          </BadgeIcon>
        )
      });
    }

    const clusterIcon = cluster => {
      const text = cluster.getChildCount();

      return L.divIcon({
        className: 'marker-cluster-svg',
        iconSize: [overlayParkingConf.iconWidth, overlayParkingConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
              text={text}
              textColor={'white'}
              markerColor={overlayParkingConf.iconMarkerColor}
            />
          )
      });
    }

    return (
      <LayerGroup>
      <AdvancedMarkerCluster
        enabled={isMarkClusterEnabled}
        showCoverageOnHover={false}
        maxClusterRadius={40}
        disableClusteringAtZoom={16}
        iconCreateFunction={clusterIcon}
      >
        {
         locationsFiltered.map( station => {
            if(station.type!=='sensor') return null;
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
                    <Parking width={24} height={20} />&nbsp;{t('parking')}
                  </div>

                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                  <small>{station.group_name}</small>

                  <div className='popup-row'>
                    <FromToLocationPicker
                      location={station}
                      setLocation={this.props.setLocation}
                    />
                  </div>
                </div>
              </Popup>
              </Marker>
            );
          })
        }
      </AdvancedMarkerCluster>
      <FeatureGroup>
        {
          locationsFiltered.map( station => {
          if(station.type!=='station' && station.type!== 'sensorGroup') return null;
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
                    <Parking width={24} height={20} />&nbsp;{t('parking')}
                  </div>

                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                  <small>{station.group_name}</small>
                  {
                    station.type === 'station' &&
                    <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                      <CircularProgressbar
                        value={station.free}
                        minValue={0}
                        maxValue={station.capacity}
                        text={station.free+''}
                        className="otp-ui-mapOverlayPopup__popupAvailableInfoProgress"
                      />
                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">{t('capacity')}: {station.capacity}</div>
                    </div>
                  }
                  {
                    station.type === 'sensorGroup' &&
                    <div className="otp-ui-mapOverlayPopup__popupAvailableSlots">
                        {
                          station.sensors.map( sensor => {
                            const free = sensor.free ? 'bg-success': 'bg-danger';
                            return (
                               <div className="otp-ui-mapOverlayPopup__popupAvailableSlotItem">
                                <div>
                                  <span className={free}></span>
                                  <strong>{sensor.name}</strong>
                                </div>
                              </div>
                            );
                          })
                        }
                    </div>
                  }

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
    locations: state.otp.overlay.parking && state.otp.overlay.parking.locations,
    overlayParkingConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'parking')[0],
  }
}

const mapDispatchToProps = {
  setLocation,
  parkingLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(ParkingOverlay)))
