import {
  transitIndexStopWithRoutes,
  userLocationType
} from "../core-utils/types";
import { isIE } from "../core-utils/ui";
import { humanizeDistanceString } from "../core-utils/distance";
import PropTypes from "prop-types";
import React from "react";
import { MenuItem, Button } from 'react-bootstrap'

import { Utensils,TheaterMasks,Landmark,ShoppingBag, Briefcase, Bed, Home, Hotel, MapMarker, MapPin, Bus,City } from "@styled-icons/fa-solid";
import { Address, Shop} from "@styled-icons/entypo";
import {Nightlife,LocalMovies, Nature} from '@styled-icons/material/'


export function GeocodedOptionIcon({feature}) {
   /*
    defined in /geocoder/config.yml endpoints
    icons: https://styled-icons.dev/?s=hotel
  */
  switch (feature.properties.source) {
    case 'here':
      switch(feature.properties.category){
        case 'food': return <Utensils size={13}/>
        case 'nightlife': return <Nightlife size={13}/>
        case 'cinema': return <LocalMovies size={13}/>
        case 'theater': return <TheaterMasks size={13}/>
        case 'landmark': return <Landmark size={13}/>
        case 'nature': return <Nature size={13}/>
        case 'transport': return <Bus size={13}/>
        case 'accommodation': return <Hotel size={13}/>
        case 'shop': return <ShoppingBag size={13}/>
        case 'services': return <City size={13}/>
        case 'facilities': return <MapMarker size={13}/>
        case 'buildings': return<City size={13}/>
        default: return <MapMarker size={13}/>
      }
    case 'opentripplanner':
      return <Bus size={13} />;
    case 'accommodations':
      return <Hotel size={13} />;
    case 'ODHActivityPoi':
      return <Shop size={13} />;
    default:
      return <MapPin size={13} />;
  }
}

export function Option({ disabled, icon, isActive, onClick, title }) {
  return (
    <MenuItem onClick={onClick} active={isActive} disabled={disabled}>
      {isIE() ? (
        // In internet explorer 11, some really weird stuff is happening where it
        // is not possible to click the text of the title, but if you click just
        // above it, then it works. So, if using IE 11, just return the title text
        // and avoid all the extra fancy stuff.
        // See https://github.com/ibi-group/trimet-mod-otp/issues/237
        title
      ) : (
        <>
          {icon}{' '}{title}
        </>
      )}
    </MenuItem>
  );
}

Option.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.node
};

Option.defaultProps = {
  disabled: false,
  icon: null,
  isActive: false,
  title: null
};

export function TransitStopOption({ isActive, onClick, stop, stopOptionIcon }) {
  return (
    <>
      <>
        <MenuItem header>
          {stopOptionIcon}{' '}{humanizeDistanceString(stop.dist, true)}
        </MenuItem>
        <MenuItem onClick={onClick} active={isActive}>
          {stop.name} ({stop.code})
          <ul>
            {(stop.routes || []).map(route => {
              const name = route.shortName || route.longName;
              return (
                <Button bsSize="small" bsStyle="link" key={`route-${name}`}>{name}</Button>
              );
            })}
          </ul>
        </MenuItem>
      </>
    </>
  );
}

TransitStopOption.propTypes = {
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  stop: transitIndexStopWithRoutes.isRequired,
  stopOptionIcon: PropTypes.node.isRequired
};

TransitStopOption.defaultProps = {
  isActive: false
};

export function UserLocationIcon({ userLocation }) {
  if (userLocation.icon === "work") return <Briefcase size={13} />;
  if (userLocation.icon === "home") return <Home size={13} />;
  return <MapMarker size={13} />;
}

UserLocationIcon.propTypes = {
  userLocation: userLocationType.isRequired
};
