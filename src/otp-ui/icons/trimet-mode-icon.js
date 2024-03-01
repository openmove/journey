import React from "react";

import {
  AerialTram,
  Bicycle,
//  BikeSharing,
  Bus,
  Car,
  Ferry,
  Max,
  Micromobility,
  Streetcar,
  TriMet,
  Walk,
  Wes
} from "./trimet";

import BikeSharing from "./modern/BikeSharing";
//import CarSharing from "./modern/CarSharing";
import MicromobilitySharing from "./modern/MicromobilitySharing";
import { Taxi } from "./openmove";

/**
 * Icons for all TriMet modes.
 * Any hail and rental modes managed by one or multiple companies
 * are optional (by default, the company logo will be displayed)
 * but can be overriden here using the pattern
 * <otp_mode>_<company_id> (e.g. 'car_hail_uber').
 * Furthermore, any hail or rental modes managed by a single company
 * are optional (by default, the company logo will be displayed)
 * but can be overriden here using the pattern
 * <otp_mode> (e.g. 'bicycle_rent').
 */
function TriMetModeIcon({ mode, ...props }) {
  if (!mode) return null;
  //console.log('timet-mode',mode.toLowerCase());
  switch (mode.toLowerCase()) {
    case "bicycle":
      // case "bicycle_rent": // Commented means using the company logo instead.
      return <Bicycle {...props} />;
    case "bicycle_rent":
      return <BikeSharing {...props} />;
    case "bus":
      return <Bus {...props} />;
    case "car":
    case "car_park":
      return <Car {...props} />;
    case "taxi":
      return <Taxi {...props}/>
    case "ferry":
      return <Ferry {...props} />;
    case "gondola":
    case "funicular":
      return <AerialTram {...props} />;
    case "micromobility":
      return <Micromobility {...props} />;
    case "micromobility_rent":
      return <MicromobilitySharing {...props} />;
    case "rail":
      return <Wes {...props} />;
    case "streetcar":
      return <Streetcar {...props} />;
    case "subway":
    case "tram":
      return <Max {...props} />;
    case "transit":
      return <TriMet {...props} />;
    case "walk":
      return <Walk {...props} />;
    default:
      return null;
  }
}

export default TriMetModeIcon;
