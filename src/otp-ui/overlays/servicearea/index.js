import React from 'react'
import AbstractOverlay from '../AbstractOverlay'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import { LayerGroup, FeatureGroup, MapLayer, Marker, Popup, withLeaflet } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { setLocation } from '../../../actions/map'
import { serviceareaLocationsQuery } from '../../../actions/parking'

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

class ParkingOverlay extends AbstractOverlay {

  constructor(props){
    super({
      props,
      query:props.serviceareaLocationsQuery,
      api:props.api,
      config:props.overlayParkingConf
    });

    this.popup = React.createRef();
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    serviceareaLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
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
      const paid = data?.payment;
      let iconWidth, iconHeight;

      if( data.type === 'station') {
        if (!data.free || data.free === -1) {
          badgeType = 'default';
          badgeCounter = null;
        }

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

        if (data.free == null || data.free === -1) {
          badgeType = 'default';
        } else if (data.free === true ) {
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
          <BadgeIcon type={badgeType} width={iconWidth} paid={paid}>
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
      <FeatureGroup>
        {
          locationsFiltered.map( station => {
          // commented because now sensors behave like normal stations
          // left here if there will be differences in the future
          // if(station.type!=='station' && station.type!== 'sensorGroup') return null;


          let price = '';
          if( station.payment === true){
            price+=t('paid')
            if(station.payment_period && station.payment_period!=='always'){
              price+=` ${t('parking-during')}`
              price+=` ${t(`parking-${station.payment_period}`)}`
            }
          } else {
            price+=t('free')
            if(station.payment_timed){
              price+=` ${t('parking-with')}`
              price+=` ${t('parking-timed')}`
            }
          }

          //WORK around for wrong data from server
          let {capacity, free} = station;

          if (
            typeof free === 'number' &&
            free !== -1 &&
            typeof capacity === 'number'
          ) {
            free = free > capacity ? capacity : free;
          }

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
                    <Parking width={24} height={20} />&nbsp;{t(station.parking_type ? `parking-${station.parking_type}` : 'parking')}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                  <small>{station.group_name}</small>
                  {
                    // sensors and stations behave the same way
                    (station.type === 'station' ||  station.type === 'sensor') && (
                    <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                      {(typeof free === 'number' && free !== -1) ? (
                        <>
                          <p className='otp-ui-mapOverlayPopup__popupAvailableInfoProgress_description'>
                            {t('available_parking_slots')}
                          </p>
                          <CircularProgressbar
                            value={free === null || free === -1 ? 'N/A' : free }
                            minValue={0}
                            maxValue={capacity}
                            text={free === null || free === -1? 'N/A' : `${free}`}
                            className="otp-ui-mapOverlayPopup__popupAvailableInfoProgress"
                          />
                        </>
                      ) : (
                        <></>
                      )}
                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfo--left-aligned" style={{paddingTop: (free === null || free === -1) ? '10px' : ''}}>
                        {station?.payment!=null && (
                          <p>{t('parking-price')}: {price}</p>
                        )}
                        {station.operator && <p>{t('managed')}: { station.operator}</p>}
                        {capacity && <p>{t('capacity')}: {capacity !== null && capacity !== -1 ? capacity : 'N/A'}</p>}
                      </div>
                    </div>
                  )}
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
  const {originalName: overlayName} = ownProps
  return {
    locations: state.otp.overlay.parking?.[overlayName]?.locations,
    overlayParkingConf: state.otp?.config?.map?.overlays?.filter(item => item.name === `${overlayName}`)[0],
  }
}

const mapDispatchToProps = {
  setLocation,
  serviceareaLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(ParkingOverlay)))
