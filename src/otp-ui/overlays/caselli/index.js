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
import { caselliLocationsQuery } from '../../../actions/caselli'

import MarkerCasello from "../../icons/modern/MarkerCasello";

import ReactDOMServer from "react-dom/server";

import FromToLocationPicker from '../../from-to-location-picker'
import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";

class CaselliOverlay extends AbstractOverlay {

  constructor(props) {
    super({
      props,
      query: props.caselliLocationsQuery,
      api: props.api,
      config: props.overlayCaselliConf
    });

    this.popup = React.createRef();
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    caselliLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func
  }

  createLeafletElement () {}

  updateLeafletElement () {}

  render () {
    const { locations, overlayCaselliConf, t ,activeFilters} = this.props

    if (!locations || locations.length === 0) return <LayerGroup />
    const bb =  getItem('mapBounds')

    let locationsFiltered = locations.filter((single)=>{
      if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
        return true;
      }
    })

    locationsFiltered = filterOverlay(locationsFiltered, activeFilters[ overlayCaselliConf.type ]);

    const markerIcon = (data) => {
      let badgeType = 'success';
      let badgeCounter = 0;
      let {iconWidth, iconHeight} = overlayCaselliConf;

      return divIcon({
        className: "",
        iconSize: [iconWidth, iconHeight],
        iconAnchor: [iconWidth/2, iconHeight],
        popupAnchor: [0, -iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCasello
            width={iconWidth}
            height={iconHeight}
            iconColor={overlayCaselliConf.iconColor}
            markerColor={overlayCaselliConf.iconMarkerColor}
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
                    {/*TODO MAKE NEW SERVICE AREA ICON <Casello width={24} height={20} />*/}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupTitle">{station.name}</div>
                  <small>{station.group_name}</small>

                  <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
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
    overlayCaselliConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'caselli')[0],
    locations: state.otp.overlay.caselli && state.otp.overlay.caselli.locations,
  };
};

const mapDispatchToProps = {
  setLocation,
  caselliLocationsQuery
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(withLeaflet(CaselliOverlay)))
