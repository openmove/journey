import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { LayerGroup, FeatureGroup, MapLayer, Marker, Popup, withLeaflet, Polyline } from 'react-leaflet'
import { divIcon } from 'leaflet'
import { withNamespaces } from "react-i18next";
import { Button } from "react-bootstrap";
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { getItem } from "../../core-utils/storage";
import { setLocation } from '../../../actions/map'
import { drtLocationsQuery } from '../../../actions/drt'
import { getRouteColor, getRouteTextColor } from '../../itinerary-body/util'
import AbstractOverlay from '../AbstractOverlay'
import AnimatedMarker from '../../animated-marker'

import BadgeIcon from "../../icons/badge-icon";
import ViewTripButton from '../../../components/viewers/view-trip-button'

import MarkerDrtStop from "../../icons/modern/MarkerDrtStop";
import MarkerDrtVehicle from "../../icons/modern/MarkerDrtVehicle";
//import Bus from "../icons/openmove/Bus";
import BusDrt from "../../icons/openmove/BusDrt";

import ReactDOMServer from "react-dom/server";
import FromToLocationPicker from '../../from-to-location-picker'

import polyline from "@mapbox/polyline";
import { map } from 'lodash'


class DrtOverlay extends AbstractOverlay {

  constructor(props){
    super({
      props,
      query:props.drtLocationsQuery,
      api:props.api,
      config:props.overlayDrtConf
    });

    this.popup = React.createRef();
  }

  static propTypes = {
    api: PropTypes.string,
    //locations: PropTypes.array,
    // locations: PropTypes.array,
    drtLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
  }

  createLeafletElement () {}

  updateLeafletElement () {}

  render () {
    const { locations, overlayDrtConf, t } = this.props

    if (!locations) return <LayerGroup />

    const getAreaColor = (data) => {
      if (overlayDrtConf.areas)
        return overlayDrtConf.areas[Number(data.area)]?.color
      else
        return overlayDrtConf.iconColor;
    }

    const getAreaName = (data) => {
      if (overlayDrtConf.areas)
        return overlayDrtConf.areas[Number(data.area)]?.name
      else
        return '';
    }

    const getLatLon = (item) => {
      return {
        lat: item.position.latitude,
        lon: item.position.longitude
      }
    }

    const getPolyline = (itinerary) => {
      const codedPolyline = itinerary?.geometry ||itinerary

      return polyline.decode(codedPolyline)
    }

    const markerIcon = (data) => {
      let badgeType = ''
        , badgeCounter = 0
        , iconWidth, iconHeight
        , iconVehicleWidth, iconVehicleHeight;

      iconWidth = overlayDrtConf.iconWidth;
      iconHeight = overlayDrtConf.iconHeight;
      const route = data.route;
      const backgroundColor = getRouteColor(route?.mode,route?.color)
      const color = getRouteTextColor(route?.mode, backgroundColor, route?.textColor)

      iconVehicleWidth = 20;
      iconVehicleHeight = 20;

/*      if (data.vehicle) {
        if (data.free > 0 ) {
          badgeType = 'success';
        } else if (data.free == 1) {
          badgeType = 'danger';
        }
        else {
          badgeType = 'warning';
        }
      }*/

      return divIcon({
        className: "",
        iconSize: [iconWidth, iconHeight],
        popupAnchor: [0, -iconHeight / 2],
        html: ReactDOMServer.renderToStaticMarkup(
          <>
          { data.stop &&
            <MarkerDrtStop
            width={iconWidth}
            height={iconHeight}
            iconColor={overlayDrtConf.iconColor}
            markerColor={getAreaColor(data)}
            />
          }
          { data.vehicle &&
          <div style={{
              width: 70,
              height: 30,
              background:backgroundColor,
              borderRadius:'10px',
              display:'flex',
              alignItems:'center',
              justifyContent: 'space-around',
              padding:'1.5px 3px'
            }}
          >
            <MarkerDrtVehicle
              width={iconVehicleWidth }
              height={iconVehicleHeight}
              // iconColor={overlayDrtConf.iconVehicleColor}
              iconColor={color}
            />
            <p style={{fontSize:'16px',margin:'0 0 0 3px', color}}>
              {data.vehicle.name}
            </p>
          </div>
          }
          </>
        )
      });
    }

    return (
      <LayerGroup>
      <FeatureGroup>
        {
          locations.stops && locations.stops?.length >0 (
            locations.stops.map( stop => {
            stop.name = stop.stop.name;
            return (
                <Marker
                  icon={markerIcon(stop)}
                  key={stop.stop.id}
                  position={[stop.lat, stop.lon]}
                >
                  <Popup>
                    <div className="otp-ui-mapOverlayPopup">
                      <div className="otp-ui-mapOverlayPopup__popupHeader">
                        <BusDrt /> <span bsStyle="link">{t('stop')} {t('ondemand')}</span>
                      </div>

                      <div className="otp-ui-mapOverlayPopup__popupTitle">{stop.stop.name}</div>
                      <small>{getAreaName(stop)}</small>

                      <div className='popup-row'>
                        <FromToLocationPicker
                          location={stop}
                          setLocation={this.props.setLocation}
                        />
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })
        )}
      </FeatureGroup>
      <FeatureGroup>
        {
          locations.vehicles && locations.vehicles?.length >0 && (
            locations.vehicles.map( vehicle => {
              return (
                <AnimatedMarker
                  icon={markerIcon(vehicle)}
                  key={vehicle.trip.id } // TODO: why are vehicles not unique?
                  position={[vehicle.position.longitude, vehicle.position.latitude]}
                  onClick={(e)=>{ e.target.openPopup()}}
                >
                  <Popup>
                    <div className="otp-ui-mapOverlayPopup">
                    {/*<div className="otp-ui-mapOverlayPopup__popupHeader">
                        <span>&nbsp;{vehicle.vehicle.name}</span>
                      </div> */}

                      <div className="otp-ui-mapOverlayPopup__popupTitle">
                        <span className='subtitle'>&nbsp;{vehicle.vehicle.name}</span>{vehicle.vehicle.label}
                      </div>
                      {vehicle.capacity && (
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                          <CircularProgressbar
                            value={vehicle.free}
                            minValue={0}
                            maxValue={vehicle.capacity}
                            text={vehicle.free+' '}
                            className="otp-ui-mapOverlayPopup__popupAvailableInfoProgress"
                          />
                          <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">
                            {t('capacity')}: {vehicle.capacity}
                            {/*                      <br />
                            {t('free_slots')}: {vehicle.free}*/}
                          </div>
                        </div>
                      )}
                      {vehicle?.trip?.id && (
                        <div className='otp-ui-mapOverlayPopup__popupRow'>
                          <ViewTripButton
                            tripId={vehicle?.trip?.id}
                          />
                        </div>
                        )
                      }
                    </div>
                  </Popup>
                </AnimatedMarker>
              )
            }
          )
        )
        }
      </FeatureGroup>

      <FeatureGroup>
      {/*
          TODO support multiple itineraries:
          new format of locations now is array:
          {
            "itineraries": [
              {
                "id": "drt-merano",
                "geometry": "xxxxxxxx",
                name,
                longName,
              }
            ]
          }
      */}
          {locations.itineraries && locations.itineraries.map((itinerary) => (
            <Polyline
              positions={getPolyline(itinerary)}
              color={overlayDrtConf.pathColor}
              dashArray={overlayDrtConf.pathDash}
              opacity={0.7}
              weight={6}
            >
              <Popup>
                <div className="otp-ui-mapOverlayPopup">
                  <div className="otp-ui-mapOverlayPopup__popupHeader">
                    <BusDrt />{" "}
                    <Button bsStyle="link">
                      {t("itinerary")} {t("ondemand")}
                    </Button>
                  </div>

                </div>
              </Popup>
            </Polyline>
          ))}
         { locations.itinerary && (
            <Polyline
                positions={getPolyline(locations.itinerary)}
                color={overlayDrtConf.pathColor}
                dashArray={overlayDrtConf.pathDash}
                opacity={0.7}
                weight={6}
              >
              <Popup>
                <div className="otp-ui-mapOverlayPopup">
                  <div className="otp-ui-mapOverlayPopup__popupHeader">
                    <BusDrt /> <span bsStyle="link">{t('itinerary')} {t('ondemand')}</span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          )
       }
      </FeatureGroup>
      </LayerGroup>
    )
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  return {
    locations: state.otp.overlay.drt && state.otp.overlay.drt.locations,
    overlayDrtConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'drt')[0],
  }
}

const mapDispatchToProps = {
  setLocation,
  drtLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(DrtOverlay)))
