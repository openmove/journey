/**
 * Looks up an operator from the provided configuration.
 * @param  {string} feedId - the feed ID, which can be obtained by splitting the
 * @param  {object} transitOperators - transitOperators from config.
 * @return {object} the operator for the specified feedId
 */
export function getTransitOperatorFromId(feedId, transitOperators) {
  return (
    transitOperators.find(transitOperator => transitOperator.id === feedId) ||
    null
  );
}

/** Looks up an operator from the provided configuration */
export function getTransitOperatorFromOtpRoute(route, transitOperators) {
  if (!route.id) return null;
  const operatorId = route.id.split(":")[0].toLowerCase();
  return getTransitOperatorFromId(operatorId, transitOperators);
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

const END_OF_LIST_COMPARATOR_VALUE = 999999999999;

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
export function makeNumericValueComparator(objGetterFn) {
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
export function makeStringValueComparator(objGetterFn) {
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

/**
 * Returns a transit operator comparator value given a route and an optional
 * transitOperators config value. This function will do its best to handle all
 * kinds of input data as certain deployments of an implementing webapp may have
 * incomplete data and certain versions of OTP might not have a modified
 * implementation of the RouteShort model.
 *
 * @param  {object} route Either an OTP Route or RouteShort model
 * @param  {array} transitOperators transitOperators from config
 * @return {mixed} this could return a string value (the route's agency name) if
 *   the transitOperators value is not defined. Otherwise an integer will be
 *   returned.
 */
 function getTransitOperatorComparatorValue(route, transitOperators) {
  // if the transitOperators is undefined or has zero length, use the route's
  // agency name as the comparator value
  if (!transitOperators || transitOperators.length === 0) {
    // OTP Route
    if (route.agency) return route.agency.name;
    // OTP RouteShort (base OTP repo or IBI fork)
    if (route.agencyName) return route.agencyName;
    // shouldn't happen as agency names will be defined
    return "zzz";
  }

  // find operator associated with route
  const transitOperator = getTransitOperatorFromOtpRoute(
    route,
    transitOperators
  );

  // if transit operator not found, return infinity
  if (!transitOperator) return END_OF_LIST_COMPARATOR_VALUE;

  // return the transit operator's sort value or END_OF_LIST_COMPARATOR_VALUE if
  // the sort value is not a number
  return typeof transitOperator.order === "number"
    ? transitOperator.order
    : END_OF_LIST_COMPARATOR_VALUE;
}

/**
 * Calculates the sort comparator value given two routes based off of the
 * route's agency and provided transitOperators config data.
 */
 function makeTransitOperatorComparator(transitOperators) {
  return (a, b) => {
    const aVal = getTransitOperatorComparatorValue(a, transitOperators);
    const bVal = getTransitOperatorComparatorValue(b, transitOperators);
    if (typeof aVal === "string") {
      // happens when transitOperators is undefined. Both aVal are guaranteed to
      // be strings. Make a string comparison.
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    }

    // transitOperators are defined and therefore a numeric value is guaranteed
    // to be returned
    return aVal - bVal;
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

export function makeRouteComparator(transitOperators) {
  return makeMultiCriteriaSort(
    makeTransitOperatorComparator(transitOperators),
    makeNumericValueComparator(obj => getRouteSortOrderValue(obj.sortOrder)),
    routeTypeComparator,
    alphabeticShortNameComparator,
    makeNumericValueComparator(obj => parseInt(obj.shortName, 10)),
    makeStringValueComparator(obj => obj.shortName),
    makeStringValueComparator(obj => obj.longName)
  );
}