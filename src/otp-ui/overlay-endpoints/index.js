import { locationType } from "../core-utils/types";
import PropTypes from "prop-types";
import React from "react";
import LocationIcon from "../location-icon";

import Endpoint from "./endpoint";

function DefaultMapMarkerIcon({ location, type }) {
  return (
    <span className="otp-ui-defaultMapMarkerIcon" title={location.name}>
      <LocationIcon type={type} />
    </span>
  );
}

DefaultMapMarkerIcon.propTypes = {
  location: locationType.isRequired,
  type: PropTypes.string.isRequired
};

function EndpointsOverlay({
  clearLocation,
  switchLocations,
  forgetPlace,
  fromLocation,
  intermediatePlaces,
  locations,
  MapMarkerIcon,
  rememberPlace,
  setLocation,
  showUserSettings,
  toLocation
}) {
  return (
    <div>
      <Endpoint
        clearLocation={clearLocation}
        switchLocations={switchLocations}
        forgetPlace={forgetPlace}
        location={fromLocation}
        locations={locations}
        MapMarkerIcon={MapMarkerIcon}
        rememberPlace={rememberPlace}
        setLocation={setLocation}
        showUserSettings={showUserSettings}
        type="from"
      />
      {intermediatePlaces.map((place, index) => {
        return (
          <Endpoint
            key={index}
            clearLocation={clearLocation}
            forgetPlace={forgetPlace}
            location={place}
            locations={locations}
            MapMarkerIcon={MapMarkerIcon}
            rememberPlace={rememberPlace}
            setLocation={setLocation}
            showUserSettings={showUserSettings}
            type={place.type}
          />
        );
      })}
      <Endpoint
        clearLocation={clearLocation}
        switchLocations={switchLocations}
        forgetPlace={forgetPlace}
        location={toLocation}
        locations={locations}
        MapMarkerIcon={MapMarkerIcon}
        rememberPlace={rememberPlace}
        setLocation={setLocation}
        showUserSettings={showUserSettings}
        type="to"
      />
    </div>
  );
}

EndpointsOverlay.propTypes = {
  /**
   * Dispatched when a user clicks on the clear location button in the user
   * settings. Not needed unless user settings is activated. Dispatched with an
   * argument in the form of:
   *
   * { type: "from/to" }
   */
  clearLocation: PropTypes.func,
  /**
   * Dispatched when a user clicks on the forget location button in the user
   * settings. Not needed unless user settings is activated. Dispatched with a
   * string argument representing the type of saved location.
   */
  forgetPlace: PropTypes.func,
  /**
   * The from location.
   */
  fromLocation: locationType,
  /**
   * Intermediate places along a journey.
   */
  intermediatePlaces: PropTypes.arrayOf(locationType),
  /**
   * An array of location that the user has saved. Not needed unless user
   * settings is activated.
   */
  locations: PropTypes.arrayOf(locationType),
  /**
   * An optional custom component that can be used to create custom html that
   * is used in a leaflet divIcon to render the map marker icon for each
   * endpoint.
   *
   * See https://leafletjs.com/reference-1.6.0.html#divicon
   *
   * This component is passed 2 props:
   * - location: either the from or to location depending on the endpoint
   * - type: either "from" or "to"
   */
  MapMarkerIcon: PropTypes.elementType,
  /**
   * Dispatched when a user clicks on the remember place button in the user
   * settings. Not needed unless user settings is activated. Dispatched with an
   * argument in the form of:
   *
   * { location: {...location}, type: "home/work" }
   */
  rememberPlace: PropTypes.func,
  /**
   * Dispatched when a location is dragged somewhere else on the map. Dispatched
   * with an argument in the form of:
   *
   * { location: {...location}, reverseGeocode: true, type: "from/to" }
   */
  setLocation: PropTypes.func.isRequired,
  /**
   * Whether or not to show the user settings popup when an endpoint is clicked.
   */
  showUserSettings: PropTypes.bool,
  /**
   * To to location
   */
  toLocation: locationType
};

const noop = () => {};

EndpointsOverlay.defaultProps = {
  clearLocation: noop,
  forgetPlace: noop,
  fromLocation: undefined,
  intermediatePlaces: [],
  rememberPlace: noop,
  locations: [],
  MapMarkerIcon: DefaultMapMarkerIcon,
  showUserSettings: false,
  toLocation: undefined
};

export default EndpointsOverlay;
