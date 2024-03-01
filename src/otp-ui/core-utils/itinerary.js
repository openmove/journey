import CONFIG from '../../config.yml'
import polyline from "@mapbox/polyline";
import turfAlong from "@turf/along";
const stylesConfig = CONFIG.transit.style

// All OTP transit modes
export const transitModes = [
  "TRAM",
  "BUS",
  "SUBWAY",
  "FERRY",
  "RAIL",
  "GONDOLA",
  "FUNICULAR"
];

export const mapRouteTypeToMode = {
  0: "TRAM",
  1: "SUBWAY",
  2: "RAIL",
  3: "BUS",
  4: "FERRY",
  6: "GONDOLA",
  7: "FUNICULAR"
}

/**
 * @param  {config} config OTP-RR configuration object
 * @return {Array}  List of all transit modes defined in config; otherwise default mode list
 */

export function getTransitModes(config) {
  if (!config || !config.modes || !config.modes.transitModes)
    return transitModes;
  return config.modes.transitModes.map(tm => tm.mode);
}

export function isTransit(mode) {
  return transitModes.includes(mode) || mode === "TRANSIT";
}

export function isWalk(mode) {
  if (!mode) return false;

  return mode === "WALK";
}

export function isBicycle(mode) {
  if (!mode) return false;

  return mode === "BICYCLE";
}

export function isBicycleRent(mode) {
  if (!mode) return false;

  return mode === "BICYCLE_RENT";
}

export function isCar(mode) {
  if (!mode) return false;
  return mode.startsWith("CAR");
}

export function isCarHail(mode) {
  if (!mode) return false;
  return mode.startsWith("CAR_HAIL");
}

export function isMicromobility(mode) {
  if (!mode) return false;
  return mode.startsWith("MICROMOBILITY");
}

export function isAccessMode(mode) {
  return (
    isWalk(mode) ||
    isBicycle(mode) ||
    isBicycleRent(mode) ||
    isCar(mode) ||
    isMicromobility(mode)
  );
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes are transit modes
 */
export function hasTransit(modesStr) {
  return modesStr.split(",").some(mode => isTransit(mode))
    || modesStr.split("+").some(mode => isTransit(mode));
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes are car-based modes
 */
export function hasCar(modesStr) {
  return modesStr.split(",").some(mode => isCar(mode))
    || modesStr.split("+").some(mode => isCar(mode));
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes are bicycle-based modes
 */
export function hasBike(modesStr) {
  return modesStr.split(",").some(mode => isBicycle(mode) || isBicycleRent(mode))
    || modesStr.split("+").some(mode => isBicycle(mode) || isBicycleRent(mode));
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes are micromobility-based modes
 */
export function hasMicromobility(modesStr) {
  return modesStr.split(",").some(mode => isMicromobility(mode))
    || modesStr.split("+").some(mode => isMicromobility(mode));
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes is a hailing mode
 */
export function hasHail(modesStr) {
  return modesStr.split(",").some(mode => mode.indexOf("_HAIL") > -1)
    || modesStr.split("+").some(mode => mode.indexOf("_HAIL") > -1);
}
/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes is a walking mode
 */
export function hasWalk(modesStr) {
  return modesStr.split(",").some(mode => mode.indexOf("WALK") > -1);
}

/**
 * @param  {string}  modesStr a comma-separated list of OTP modes
 * @return {boolean} whether any of the modes is a rental mode
 */
export function hasRental(modesStr) {
  return modesStr.split(",").some(mode => mode.indexOf("_RENT") > -1)
    || modesStr.split("+").some(mode => mode.indexOf("_RENT") > -1);
}

export function getMapColor(mode) {
  function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
  // color function TODO:unify
  // console.log('getMapColor');//todo: remove; used to see if this component is used
  // return '#FFFF00' // debug color just used to see if something changes
  const modeColors = stylesConfig.modes;

  let myMode = isNumber(mode) ? mapRouteTypeToMode[mode] : mode
  myMode = myMode == null ? this?.get("mode") : myMode;

  if(typeof myMode !== 'string') return modeColors.default.color

  myMode = myMode.toLowerCase();
  const color = modeColors[myMode]?.color || modeColors.default.color

  return color

/*
  colors in old getMapColor
   if (mode === "WALK") return "#444";
  if (mode === "BICYCLE") return "#0073e5";
  if (mode === "SUBWAY") return "#f00";
  if (mode === "RAIL") return "#b00";
  if (mode === "BUS") return "#080";
  if (mode === "TRAM") return "#800";
  if (mode === "FERRY") return "#095980";
  if (mode === "CAR") return "#444";
  if (mode === "MICROMOBILITY") return "#f5a729";
  return "#aaa"; */


}

/**
 * Determine the appropriate contrast color for text (white or black) based on
 * the input hex string (e.g., '#ff00ff') value.
 *
 * From https://stackoverflow.com/a/11868398/915811
 *
 * TODO: Move to @opentripplanner/core-utils once otp-rr uses otp-ui library.
 */
export function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "000000" : "ffffff";
}

export function convertAbsoluteDirection(direction){
    switch(direction){
        case "NORTH":
            return "north";
        case "SOUTH":
            return "south";
        case "EAST":
            return "east";
        case "WEST":
            return "west";
        case "NORTHWEST":
            return "north_west"
        case "NORTHEAST":
            return "north_east"
        case "SOUTHWEST":
            return "south_west";
        case "SOUTHEAST":
            return "south_east";
        default:
            return direction;
    }
}

export function getStepDirection(step) {
  switch (step.relativeDirection) {
    case "DEPART":
      return `go_to_${convertAbsoluteDirection(step.absoluteDirection)}`

    case "LEFT":
      return "left";

    case "HARD_LEFT":
      return "hard_left";

    case "SLIGHTLY_LEFT":
      return "slighly_left";

    case "CONTINUE":
      return "continue";

    case "SLIGHTLY_RIGHT":
      return "slighly_right";

    case "RIGHT":
      return "right";

    case "HARD_RIGHT":
      return "hard_right";

    case "CIRCLE_CLOCKWISE":
      return "circle_clock";

    case "CIRCLE_COUNTERCLOCKWISE":
      return "circle_counterclock";

    case "ELEVATOR":
      return "elevator";

    case "UTURN_LEFT":
      return "left_uturn";

    case "UTURN_RIGHT":
      return "right_uturn";

    default:
      return step.relativeDirection;
  }
}

export function getStepInstructions(step) {
  const conjunction = step.relativeDirection === "ELEVATOR" ? "su" : "su";
  const stepDirection = getStepDirection(step)

  return {
    stepDirection,
    conjunction,
    streetName: step.streetName
  }
}

export function getStepStreetName(step) {
  if (step.streetName === "road") return "road";
  if (step.streetName === "path") return "path";
  if (step.streetName === "sidewalk") return "sidewalk";
  if (step.streetName === "steps") return "steps";
  if (step.streetName === "bike path") return "bike_path";
  if (step.streetName === "track") return "track";
  return step.streetName;
}

export function toSentenceCase(str) {
  if (str == null) {
    return "";
  }

  str = String(str);
  return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
}

export function getLegModeLabel(leg) {
  switch (leg.mode) {
      case "BICYCLE_RENT":
        return "ride_for";
      case "WALK":
          return "walk_for";
      case "BICYCLE":
        return "ride_for";

    case "CAR":
      return leg.hailedCar ? "drive_for" : "drive";

    case "GONDOLA":
    case "FUNICULAR":
      return "aerial_tram";

    case "TRAM":
      if (leg.routeLongName.toLowerCase().indexOf("streetcar") !== -1) return "streetcar";
      return "light_rail";

    case "MICROMOBILITY":
      return "drive_for";

    default:
      return toSentenceCase(leg.mode);
  }
}
export function getItineraryBounds(itinerary) {
  let coords = [];
  itinerary.legs.forEach(leg => {
    const legCoords = polyline
      .toGeoJSON(leg.legGeometry.points)
      .coordinates.map(c => [c[1], c[0]]);
    coords = [...coords, ...legCoords];
  });
  return coords;
}

/**
 * Return a coords object that encloses the given leg's geometry.
 */
export function getLegBounds(leg) {
  const coords = polyline
    .toGeoJSON(leg.legGeometry.points)
    .coordinates.map(c => [c[1], c[0]]);

  // in certain cases, there might be zero-length coordinates in the leg
  // geometry. In these cases, build us an array of coordinates using the from
  // and to data of the leg.
  if (coords.length === 0) {
    coords.push([leg.from.lat, leg.from.lon], [leg.to.lat, leg.to.lon]);
  }
  return coords;
}

/* Returns an interpolated lat-lon at a specified distance along a leg */

export function legLocationAtDistance(leg, distance) {
  if (!leg.legGeometry) return null;

  try {
    const line = polyline.toGeoJSON(leg.legGeometry.points);
    const pt = turfAlong(line, distance, { units: "meters" });
    if (pt && pt.geometry && pt.geometry.coordinates) {
      return [pt.geometry.coordinates[1], pt.geometry.coordinates[0]];
    }
  } catch (e) {
    // FIXME handle error!
  }

  return null;
}

/* Returns an interpolated elevation at a specified distance along a leg */

export function legElevationAtDistance(points, distance) {
  // Iterate through the combined elevation profile
  let traversed = 0;
  // If first point distance is not zero, insert starting point at zero with
  // null elevation. Encountering this value should trigger the warning below.
  if (points[0][0] > 0) {
    points.unshift([0, null]);
  }
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1];
    const elevDistanceSpan = points[i][0] - start[0];
    if (distance >= traversed && distance <= traversed + elevDistanceSpan) {
      // Distance falls within this point and the previous one;
      // compute & return iterpolated elevation value
      if (start[1] === null) {
        console.warn(
          "Elevation value does not exist for distance.",
          distance,
          traversed
        );
        return null;
      }
      const pct = (distance - traversed) / elevDistanceSpan;
      const elevSpan = points[i][1] - start[1];
      return start[1] + elevSpan * pct;
    }
    traversed += elevDistanceSpan;
  }
  console.warn(
    "Elevation value does not exist for distance.",
    distance,
    traversed
  );
  return null;
}

// Iterate through the steps, building the array of elevation points and
// keeping track of the minimum and maximum elevations reached
export function getElevationProfile(steps, unitConversion = 1) {
  let minElev = 100000;
  let maxElev = -100000;
  let traversed = 0;
  let gain = 0;
  let loss = 0;
  let previous = null;
  const points = [];
  steps.forEach(step => {
    if (!step.elevation || step.elevation.length === 0) {
      traversed += step.distance;
      return;
    }
    for (let i = 0; i < step.elevation.length; i++) {
      const elev = step.elevation[i];
      if (previous) {
        const diff = (elev.second - previous.second) * unitConversion;
        if (diff > 0) gain += diff;
        else loss += diff;
      }
      if (i === 0 && elev.first !== 0) {
        // console.warn(`No elevation data available for step ${stepIndex}-${i} at beginning of segment`, elev)
      }
      const convertedElevation = elev.second * unitConversion;
      if (convertedElevation < minElev) minElev = convertedElevation;
      if (convertedElevation > maxElev) maxElev = convertedElevation;
      points.push([traversed + elev.first, elev.second]);
      // Insert "filler" point if the last point in elevation profile does not
      // reach the full distance of the step.
      if (i === step.elevation.length - 1 && elev.first !== step.distance) {
        // points.push([traversed + step.distance, elev.second])
      }
      previous = elev;
    }
    traversed += step.distance;
  });
  return { maxElev, minElev, points, traversed, gain, loss };
}

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {string} text The text to be rendered.
 * @param {string} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
export function getTextWidth(text, font = "22px Arial") {
  // re-use canvas object for better performance
  const canvas =
    getTextWidth.canvas ||
    (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

/**
 * Get the configured company object for the given network string if the company
 * has been defined in the provided companies array config.
 */
function getCompanyForNetwork(networkString, companies = []) {
  const company = companies.find(co => co.id === networkString);
  if (!company) {
    //console.warn(`No company found in config.yml that matches rented vehicle network: ${networkString}`,companies);
  }
  return company;
}

/**
 * Get a string label to display from a list of vehicle rental networks.
 *
 * @param  {Array<string>} networks  A list of network ids.
 * @param  {Array<object>}  [companies=[]] An optional list of the companies config.
 * @return {string}  A label for use in presentation on a website.
 */
export function getCompaniesLabelFromNetworks(networks, companies = []) {
  return networks
    .map(network => getCompanyForNetwork(network, companies))
    .filter(co => !!co)
    .map(co => co.label)
    .join("/");
}

/**
 * Returns mode name by checking the vertex type (VertexType class in OTP) for
 * the provided place. NOTE: this is currently only intended for vehicles at
 * the moment (not transit or walking).
 *
 * TODO: I18N
 * @param  {string} place place from itinerary leg
 */
export function getModeForPlace(place) {
  switch (place.vertexType) {
    case "CARSHARE":
      return "car";
    case "VEHICLERENTAL":
      return "E-scooter";
    // TODO: Should the type change depending on bike vertex type?
    case "BIKESHARE":
    case "BIKEPARK":
      return "bike";
    // If company offers more than one mode, default to `vehicle` string.
    default:
      return "vehicle";
  }
}

export function getPlaceName(place, companies) {
  // If address is provided (i.e. for carshare station, use it)
  if (place.address) return place.address.split(",")[0];
  if (place.networks && place.vertexType === "VEHICLERENTAL") {
    // For vehicle rental pick up, do not use the place name. Rather, use
    // company name + vehicle type (e.g., SPIN E-scooter). Place name is often just
    // a UUID that has no relevance to the actual vehicle. For bikeshare, however,
    // there are often hubs or bikes that have relevant names to the user.
    const company = getCompanyForNetwork(place.networks[0], companies);
    if (company) {
      return `${company.label} ${getModeForPlace(place)}`;
    }
  }
  // Default to place name
  return place.name;
}

export function getTNCLocation(leg, type) {
  const location = leg[type];
  return `${location.lat.toFixed(5)},${location.lon.toFixed(5)}`;
}

export function calculatePhysicalActivity(itinerary) {
  let walkDuration = 0;
  let bikeDuration = 0;
  itinerary.legs.forEach(leg => {
    if (leg.mode.startsWith("WALK")) walkDuration += leg.duration;
    if (leg.mode.startsWith("BICYCLE")) bikeDuration += leg.duration;
  });
  const caloriesBurned =
    (walkDuration / 3600) * 280 + (bikeDuration / 3600) * 290;
  return {
    bikeDuration,
    caloriesBurned,
    walkDuration
  };
}

export function calculateFares(itinerary) {
  let transitFare = 0;
  let symbol = "$"; // default to USD
  let dollarsToString = dollars => `${symbol}${dollars.toFixed(2)}`;
  let centsToString = cents => `${symbol}${(cents / 100).toFixed(2)}`;
  if (itinerary.fare && itinerary.fare.fare && itinerary.fare.fare.regular && itinerary.fare !== -1) {
    const reg = itinerary.fare.fare.regular;
    symbol = reg.currency.symbol;
    transitFare = reg.cents;
    centsToString = cents =>
      `${symbol} ${(cents / 10 ** reg.currency.defaultFractionDigits).toFixed(
        reg.currency.defaultFractionDigits
      )}`;
    dollarsToString = dollars => `${symbol} ${dollars.toFixed(2)}`;
  } else {
    transitFare = -1;
  }

  // Process any TNC fares
  let minTNCFare = 0;
  let maxTNCFare = 0;
  itinerary.legs.forEach(leg => {
    if (leg.mode === "CAR" && leg.hailedCar && leg.tncData) {
      const { maxCost, minCost } = leg.tncData;
      // TODO: Support non-USD
      minTNCFare += minCost;
      maxTNCFare += maxCost;
    }
  });
  return {
    centsToString,
    dollarsToString,
    maxTNCFare,
    minTNCFare,
    transitFare
  };
}

export function getTimeZoneOffset(itinerary) {
  if (!itinerary.legs || !itinerary.legs.length) return 0;

  // Determine if there is a DST offset between now and the itinerary start date
  const dstOffset =
    new Date(itinerary.startTime).getTimezoneOffset() -
    new Date().getTimezoneOffset();

  return (
    itinerary.legs[0].agencyTimeZoneOffset +
    (new Date().getTimezoneOffset() + dstOffset) * 60000
  );
}

/**
 * The functions below are for enhanced route sorting functions for
 * the route viewer on OTP-react-redux.
 * They address route ordering issues discussed in
 * https://github.com/opentripplanner/otp-react-redux/pull/123 and
 * https://github.com/opentripplanner/otp-react-redux/pull/124.
 */

/**
 * Gets the desired sort values according to an optional getter function. If the
 * getter function is not defined, the original sort values are returned.
 */
function getSortValues(getterFn, a, b) {
  let aVal;
  let bVal;
  if (typeof getterFn === "function") {
    aVal = getterFn(a);
    bVal = getterFn(b);
  } else {
    aVal = a;
    bVal = b;
  }
  return { aVal, bVal };
}

// Lookup for the sort values associated with various OTP modes.
// Note: JSDoc format not used to avoid bug in documentationjs.
// https://github.com/documentationjs/documentation/issues/372
const modeComparatorValue = {
  SUBWAY: 1,
  TRAM: 2,
  RAIL: 3,
  GONDOLA: 4,
  FERRY: 5,
  CABLE_CAR: 6,
  FUNICULAR: 7,
  BUS: 8
};

// Lookup that maps route types to the OTP mode sort values.
// Note: JSDoc format not used to avoid bug in documentationjs.
// https://github.com/documentationjs/documentation/issues/372
const routeTypeComparatorValue = {
  0: modeComparatorValue.TRAM, // - Tram, Streetcar, Light rail.
  1: modeComparatorValue.SUBWAY, // - Subway, Metro.
  2: modeComparatorValue.RAIL, // - Rail. Used for intercity or long-distance travel.
  3: modeComparatorValue.BUS, // - Bus.
  4: modeComparatorValue.FERRY, // - Ferry.
  5: modeComparatorValue.CABLE_CAR, // - Cable tram.
  6: modeComparatorValue.GONDOLA, // - Gondola, etc.
  7: modeComparatorValue.FUNICULAR, // - Funicular.
  // TODO: 11 and 12 are not a part of OTP as of 2019-02-14, but for now just
  // associate them with bus/rail.
  11: modeComparatorValue.BUS, // - Trolleybus.
  12: modeComparatorValue.RAIL // - Monorail.
};

// Gets a comparator value for a given route's type (OTP mode).
// Note: JSDoc format not used to avoid bug in documentationjs.
// ttps://github.com/documentationjs/documentation/issues/372
function getRouteTypeComparatorValue(route) {
  // For some strange reason, the short route response in OTP returns the
  // string-based modes, but the long route response returns the
  // integer route type. This attempts to account for both of those cases.
  if (!route) throw new Error("Route is undefined.", route);
  if (typeof modeComparatorValue[route.mode] !== "undefined") {
    return modeComparatorValue[route.mode];
  }
  if (typeof routeTypeComparatorValue[route.type] !== "undefined") {
    return routeTypeComparatorValue[route.type];
  }
  // Default the comparator value to a large number (placing the route at the
  // end of the list).
  console.warn("no mode/route type found for route", route);
  return 9999;
}

/**
 * Calculates the sort comparator value given two routes based off of route type
 * (OTP mode).
 */
function routeTypeComparator(a, b) {
  return getRouteTypeComparatorValue(a) - getRouteTypeComparatorValue(b);
}

/**
 * Determines whether a value is a string that starts with an alphabetic
 * ascii character.
 */
function startsWithAlphabeticCharacter(val) {
  if (typeof val === "string" && val.length > 0) {
    const firstCharCode = val.charCodeAt(0);
    return (
      (firstCharCode >= 65 && firstCharCode <= 90) ||
      (firstCharCode >= 97 && firstCharCode <= 122)
    );
  }
  return false;
}

/**
 * Sorts routes based off of whether the shortName begins with an alphabetic
 * character. Routes with shortn that do start with an alphabetic character will
 * be prioritized over those that don't.
 */
function alphabeticShortNameComparator(a, b) {
  const aStartsWithAlphabeticCharacter = startsWithAlphabeticCharacter(
    a.shortName
  );
  const bStartsWithAlphabeticCharacter = startsWithAlphabeticCharacter(
    b.shortName
  );

  if (aStartsWithAlphabeticCharacter && bStartsWithAlphabeticCharacter) {
    // both start with an alphabetic character, return equivalence
    return 0;
  }
  // a does start with an alphabetic character, but b does not. Prioritize a
  if (aStartsWithAlphabeticCharacter) return -1;
  // b does start with an alphabetic character, but a does not. Prioritize b
  if (bStartsWithAlphabeticCharacter) return 1;
  // neither route has a shortName that starts with an alphabetic character.
  // Return equivalence
  return 0;
}

/**
 * Checks whether an appropriate comparison of numeric values can be made for
 * sorting purposes. If both values are not valid numbers according to the
 * isNaN check, then this function returns undefined which indicates that a
 * secondary sorting criteria should be used instead. If one value is valid and
 * the other is not, then the valid value will be given sorting priority. If
 * both values are valid numbers, the difference is obtained as the sort value.
 *
 * An optional argument can be provided which will be used to obtain the
 * comparison value from the comparison function arguments.
 *
 * IMPORTANT: the comparison values must be numeric values or at least be
 * attempted to be converted to numeric values! If one of the arguments is
 * something crazy like an empty string, unexpected behavior will occur because
 * JavaScript.
 *
 * @param  {function} [objGetterFn] An optional function to obtain the
 *  comparison value from the comparator function arguments
 */
function makeNumericValueComparator(objGetterFn) {
  /* Note: Using the global version of isNaN (the Number version behaves differently. */
  /* eslint-disable no-restricted-globals */
  return (a, b) => {
    const { aVal, bVal } = getSortValues(objGetterFn, a, b);
    // if both values aren't valid numbers, use the next sort criteria
    if (isNaN(aVal) && isNaN(bVal)) return 0;
    // b is a valid number, b gets priority
    if (isNaN(aVal)) return 1;
    // a is a valid number, a gets priority
    if (isNaN(bVal)) return -1;
    // a and b are valid numbers, return the sort value
    return aVal - bVal;
  };
}

/**
 * Create a comparator function that compares string values. The comparison
 * values feed to the sort comparator function are assumed to be objects that
 * will have either undefined, null or string values at the given key. If one
 * object has undefined, null or an empty string, but the other does have a
 * string with length > 0, then that string will get priority.
 *
 * @param  {function} [objGetterFn] An optional function to obtain the
 *  comparison value from the comparator function arguments
 */
function makeStringValueComparator(objGetterFn) {
  return (a, b) => {
    const { aVal, bVal } = getSortValues(objGetterFn, a, b);
    // both a and b are uncomparable strings, return equivalent value
    if (!aVal && !bVal) return 0;
    // a is not a comparable string, b gets priority
    if (!aVal) return 1;
    // b is not a comparable string, a gets priority
    if (!bVal) return -1;
    // a and b are comparable strings, return the sort value
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  };
}

/**
 * OpenTripPlanner sets the routeSortOrder to -999 by default. So, if that value
 * is encountered, assume that it actually means that the routeSortOrder is not
 * set in the GTFS.
 *
 * See https://github.com/opentripplanner/OpenTripPlanner/issues/2938
 * Also see https://github.com/opentripplanner/otp-react-redux/issues/122
 */
function getRouteSortOrderValue(val) {
  return val === -999 ? undefined : val;
}

/**
 * Create a multi-criteria sort comparator function composed of other sort
 * comparator functions. Each comparator function will be ran in the order given
 * until a non-zero comparison value is obtained which is then immediately
 * returned. If all comparison functions return equivalance, then the values
 * are assumed to be equivalent.
 */
function makeMultiCriteriaSort(...criteria) {
  return (a, b) => {
    for (let i = 0; i < criteria.length; i++) {
      const curCriteriaComparatorValue = criteria[i](a, b);
      // if the comparison objects are not equivalent, return the value obtained
      // in this current criteria comparison
      if (curCriteriaComparatorValue !== 0) {
        return curCriteriaComparatorValue;
      }
    }
    return 0;
  };
}

export function getTransitFare(fareComponent) {
  // Default values (if fare component is not valid).
  let digits = 2;
  let transitFare = 0;
  let symbol = "$";

  if (fareComponent) {
    digits = fareComponent.currency.defaultFractionDigits;
    transitFare = fareComponent.cents;
    symbol = fareComponent.currency.symbol;
  } // For cents to string conversion, use digits from fare component.


  const centsToString = cents => {
    const dollars = (cents / 10 ** digits).toFixed(digits);
    return `${symbol} ${dollars}`;
  }; // For dollars to string conversion, assume we're rounding to two digits.


  const dollarsToString = dollars => `${symbol}${dollars.toFixed(2)}`;

  return {
    centsToString,
    dollarsToString,
    transitFare
  };
}

/**
 * Compares routes for the purposes of sorting and displaying in a user
 * interface. Due to GTFS feeds having varying levels of data quality, a multi-
 * criteria sort is needed to account for various differences. The criteria
 * included here are each applied to the routes in the order listed. If a given
 * sort criterion yields equivalence (e.g., two routes have the short name
 * "20"), the comparator falls back onto the next sort criterion (e.g., long
 * name). If desired, the criteria of sorting based off of integer shortName can
 * be disabled. The sort operates on the following values (in order):
 *
 *  1. sortOrder. Routes that do not have a valid sortOrder will be placed
 *    beneath those that do.
 *  2. route type (OTP mode). See routeTypeComparator code for prioritization of
 *    route types.
 *  3. shortNames that begin with alphabetic characters. shortNames that do not
 *    start with alphabetic characters will be place beneath those that do.
 *  4. shortName as integer. shortNames that cannot be parsed as integers will
 *    be placed beneath those that are valid.
 *  5. shortName as string. Routes without shortNames will be placed beneath
 *    those with shortNames.
 *  6. longName as string.
 */
export const routeComparator = makeMultiCriteriaSort(
  makeNumericValueComparator(obj => getRouteSortOrderValue(obj.sortOrder)),
  routeTypeComparator,
  alphabeticShortNameComparator,
  makeNumericValueComparator(obj => parseInt(obj.shortName, 10)),
  makeStringValueComparator(obj => obj.shortName),
  makeStringValueComparator(obj => obj.longName)
);
