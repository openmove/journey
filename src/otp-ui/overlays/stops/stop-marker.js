import {
  languageConfigType,
  leafletPathType,
  stopLayerStopType
} from "../../core-utils/types";
import FromToLocationPicker from "../../from-to-location-picker";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { divIcon } from "leaflet";
import { CircleMarker, Popup, Marker } from "react-leaflet";
import { withNamespaces } from "react-i18next"
import { Button } from "react-bootstrap"
import memoize from "lodash.memoize";
import MarkerStopStation from "../../icons/modern/MarkerStopStation";

import MarkerStop from "../../icons/modern/MarkerStop";
import MarkerStopChild from "../../icons/modern/MarkerStopChild";
import MarkerStation from "../../icons/modern/MarkerStation";

import ReactDOMServer from "react-dom/server";
import Bus from "../../icons/modern/Bus";
import StandardModeIcon from "../../icons/standard-mode-icon";
import { getMapColor } from "../../core-utils/itinerary";
import { getRouteColor, getRouteTextColor } from "../../itinerary-body/util";
import OpenMoveModeIcon from "../../icons/openmove-mode-icon";


const stopMarkerIcon = memoize((stop,overlayStopConf) => {

  let isStation = false;
  let isStopChild = false;
  let stopColor = overlayStopConf.iconMarkerColor;

  if(Array.isArray(stop.stops) && stop.stops.length > 1) {
    isStation = true;
  }
  else if(!stop.stops || stop.stops.length === 1 )  {
    isStopChild = true;
    const currentStop =  stop?.stops?.length === 1 ? stop.stops[0] : stop
    stopColor = getMapColor(currentStop.vehicleMode)
  }


  return divIcon({
    iconSize: [overlayStopConf.iconWidth, overlayStopConf.iconHeight],
    popupAnchor: [0, -overlayStopConf.iconHeight / 2],
    html: ReactDOMServer.renderToStaticMarkup(
      <>
      { isStation &&
        <MarkerStop
          width={overlayStopConf.iconWidth}
          height={overlayStopConf.iconHeight}
          iconColor={overlayStopConf.iconColor}
          markerColor={stopColor}
        />
      }
      { isStopChild &&
        <MarkerStopChild
          width={overlayStopConf.iconWidth}
          height={overlayStopConf.iconHeight}
          iconColor={overlayStopConf.iconColor}
          markerColor={stopColor}
        />
      }
      </>
    ),
    className: ''
  });
});

class StopMarker extends Component {

  onFromClick = () => {
    this.setLocation("from");
  };

  onToClick = () => {
    this.setLocation("to");
  };

  setLocation(locationType) {
    const { stop, setLocation } = this.props;
    const { lat, lon, name } = stop;
    setLocation({ location: { lat, lon, name }, locationType });
  }

  onClickView = () => {
    const { setViewedStop, stop } = this.props;

    let stopId = stop.id;

    if (Array.isArray(stop.stops) && stop.stops.length > 1) {
      stopId = stop.stops[0].id;
    }
    else if (Array.isArray(stop.stops) && stop.stops.length === 1) {
      stopId = stop.stops[0].id;
    }
    //console.log('STOP VIEW', stop);
    setViewedStop({ stopId });
  };

  onClickMarker = (e) => {
    e.target.openPopup()
    const { stop, leafletPath } = this.props;
    let { id, name, lat, lon, stops } = stop;

    //console.log('onClickMarker',e);

    if (Array.isArray(stops) && stops.length>1) {
      e.target.closePopup();

      const {leaflet, position} = e.target.options;
      const {overlayStopConf} = this.props
      leaflet.map.setView(position, Number(overlayStopConf.minZoomStation));
    }
  }

  render() {
    const { languageConfig, leafletPath,overlayStopConf, radius, stop, t, onClick } = this.props;
    let { id, name, lat, lon, stops} = stop;
    const currentStop =  stop?.stops?.length === 1 ? stop.stops[0] : stop
    const {vehicleMode:mode} =currentStop
    const stopId = id.split(':').pop();

    let routes = [];

    const addRoutes = stop => {
      if(Array.isArray(currentStop?.routes)){
        currentStop?.routes.forEach(route => routes.push(route));
      }
    }
    addRoutes(currentStop)


    if (Array.isArray(stops) && stops.length===1) {
      //id = stops[0].id;
      //name = stops[0].name;
      lat = stops[0].lat;
      lon = stops[0].lon;
    }

    //name = `${name} (${id})`
    //
    return (
      <Marker
        /* eslint-disable-next-line react/jsx-props-no-spreading */
        {...leafletPath}
        position={[lat, lon]}
        icon={stopMarkerIcon(stop,overlayStopConf)}
        onClick={this.onClickMarker}
      >
      {
        <Popup>
          <div className="otp-ui-mapOverlayPopup">
            <div onClick={this.onClickView} className="otp-ui-mapOverlayPopup__popupHeader">
              <StandardModeIcon width={25} mode={mode} />&nbsp;&nbsp;{t('stop')}
            </div>

            <Button bsStyle="link" className="otp-ui-mapOverlayPopup__popupTitle" onClick={this.onClickView}>{name}</Button>
            <div className="routes-container">
              {routes.map((route)=>{
                    const backgroundColor = getRouteColor(route?.mode,route?.color)
                    const color = getRouteTextColor(route?.mode, backgroundColor, route?.textColor)
                    return (
                      <div style={{backgroundColor,color}} className="route" key={route.gtfsId}>
                        <OpenMoveModeIcon mode={route.mode} fill='currentColor' width={20} height={20} />
                        <strong className="shortname" style={{color}}> {route.shortName} </strong>
                      </div>
                    )
              })}
            </div>
            <br />
            <small>{t('stop_id')}: {stopId}</small>
            {/* show stop childs
              Array.isArray(stops) && stops.length>1 && stops.map((substop, key) => {
                return(
                  <Button bsStyle="link">&bull; {substop.id}</Button>
                  );
              })
            */}
            <div className="otp-ui-mapOverlayPopup__popupRow">
              <FromToLocationPicker
                onFromClick={this.onFromClick}
                onToClick={this.onToClick}
              />
            </div>
          </div>
        </Popup>
      }
      </Marker>

    );
  }
}

//TODO may be unuseful

StopMarker.propTypes = {
  languageConfig: languageConfigType.isRequired,
  leafletPath: leafletPathType,
  radius: PropTypes.number,
  setLocation: PropTypes.func.isRequired,
  setViewedStop: PropTypes.func.isRequired,
  stop: stopLayerStopType.isRequired,
  //onClick: PropTypes.func.isRequired
};

StopMarker.defaultProps = {
  leafletPath: {
    color: "#337ab7",
    fillColor: "#fff",
    fillOpacity: 1,
    weight: 1
  },
  radius: 8
};

export default withNamespaces()(StopMarker)
