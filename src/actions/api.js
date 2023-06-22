/* globals fetch */
import { push, replace } from 'connected-react-router'
import haversine from 'haversine'
import moment from 'moment'
import hash from 'object-hash'
import coreUtils from '../otp-ui/core-utils'
import queryParams from '../otp-ui/core-utils/query-params'
import { createAction } from 'redux-actions'
import { batch } from 'react-redux'

import qs from 'qs'
import uniqBy from "lodash.uniqby";

import { rememberPlace } from './map'
import { getStopViewerConfig, queryIsValid } from '../util/state'
import { getSecureFetchOptions } from '../util/middleware'

if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

const { hasCar } = coreUtils.itinerary
const { getTripOptionsFromQuery, getUrlParams, getResponseData } = coreUtils.query
const { randId } = coreUtils.storage
const { OTP_API_DATE_FORMAT, OTP_API_TIME_FORMAT } = coreUtils.time

// Generic API actions

export const nonRealtimeRoutingResponse = createAction('NON_REALTIME_ROUTING_RESPONSE')
export const routingRequest = createAction('ROUTING_REQUEST')
export const routingResponse = createAction('ROUTING_RESPONSE')
export const routingError = createAction('ROUTING_ERROR')
export const toggleTracking = createAction('TOGGLE_TRACKING')
export const rememberSearch = createAction('REMEMBER_SEARCH')
export const forgetSearch = createAction('FORGET_SEARCH')

function formatRecentPlace (place) {
  return {
    ...place,
    type: 'recent',
    icon: 'clock-o',
    id: `recent-${randId()}`,
    timestamp: new Date().getTime()
  }
}

function formatRecentSearch (url, otpState) {
  return {
    query: getTripOptionsFromQuery(otpState.currentQuery, true),
    url,
    id: randId(),
    timestamp: new Date().getTime()
  }
}

function isStoredPlace (place) {
  return ['home', 'work', 'suggested', 'stop'].indexOf(place.type) !== -1
}

/**
 * Compute the initial activeItinerary. If this is the first search of
 * session (i.e. searches lookup is empty/null) AND an activeItinerary ID
 * is specified in URL parameters, use that ID. Otherwise, use null/0.
 */
function getActiveItinerary (otpState) {
  const {currentQuery, searches} = otpState
  let activeItinerary = currentQuery.routingType === 'ITINERARY' ? 0 : null
  // We cannot use window.history.state here to check for the active
  // itinerary param because it is unreliable in some states (e.g.,
  // when the print layout component first loads).
  const urlParams = getUrlParams()
  const hasSearches = !searches || Object.keys(searches).length === 0
  if (hasSearches && urlParams.ui_activeItinerary) {
    activeItinerary = +urlParams.ui_activeItinerary
  }
  return activeItinerary
}

/**
 * Send a routing query to the OTP backend.
 *
 * NOTE: We need a random ID so that when a user reloads the page (clearing the
 * state), performs searches, and presses back to load previous searches
 * that are no longer contained in the state we don't confuse the search IDs
 * with search IDs from the new session. If we were to use sequential numbers
 * as IDs, we would run into this problem.
 */
export function routingQuery (searchId = null) {
  return async function (dispatch, getState) {
    // FIXME: batchId is searchId for now.
    const state = getState()
    const otpState = state.otp

    const isNewSearch = !searchId
    if (isNewSearch) searchId = randId()
    // Don't permit a routing query if the query is invalid
    if (!queryIsValid(otpState)) {
      console.warn('Query is invalid. Aborting routing query', otpState.currentQuery)
      return
    }
    const activeItinerary = getActiveItinerary(otpState)
    const routingType = otpState.currentQuery.routingType
    // For multiple mode combinations, gather injected params from config/query.
    // Otherwise, inject nothing (rely on what's in current query) and perform
    // one iteration.
    const iterations = otpState.config.modes && otpState.config.modes.combinations
      ? otpState.config.modes.combinations.map(({mode, params}) => ({mode, ...params}))
      : [{}]
    dispatch(routingRequest({ activeItinerary, routingType, searchId, pending: iterations.length }))
    iterations.forEach((injectedParams, i) => {
      const requestId = randId()
      // fetch a realtime route
      const query = constructRoutingQuery(otpState, false, injectedParams)
      fetch(query, getOtpFetchOptions(state))
        .then(getJsonAndCheckResponse)
        .then(json => {
          dispatch(routingResponse({ response: json, requestId, searchId }))
          // If tracking is enabled, store locations and search after successful
          // search is completed.
          if (otpState.user.trackRecent) {
            const { from, to } = otpState.currentQuery
            if (!isStoredPlace(from)) {
              dispatch(rememberPlace({ type: 'recent', location: formatRecentPlace(from) }))
            }
            if (!isStoredPlace(to)) {
              dispatch(rememberPlace({ type: 'recent', location: formatRecentPlace(to) }))
            }
            dispatch(rememberSearch(formatRecentSearch(query, otpState)))
          }
        })
        .catch(error => {
          dispatch(routingError({ error, requestId, searchId }))
        })
      // Update OTP URL params if a new search. In other words, if we're
      // performing a search based on query params taken from the URL after a back
      // button press, we don't need to update the OTP URL.
      // TODO: For old searches that we are re-running, should we be **replacing**
      //  the URL params here (instead of **pushing** a new path to history like
      //  what currently happens in updateOtpUrlParams)? That way we could ensure
      //  that the path absolutely accurately reflects the app state.
      const params = getUrlParams()
      if (isNewSearch || params.ui_activeSearch !== searchId) {
        dispatch(updateOtpUrlParams(otpState, searchId))
      }

      // Also fetch a non-realtime route.
      //
      // FIXME: The statement below may no longer apply with future work
      // involving realtime info embedded in the OTP response.
      // (That action records an entry again in the middleware.)
      // For users who opted in to store trip request history,
      // to avoid recording the same trip request twice in the middleware,
      // only add the user Authorization token to the request
      // when querying the non-realtime route.
      //
      // The advantage of using non-realtime route is that the middleware will be able to
      // record and provide the theoretical itinerary summary without having to query OTP again.
      // FIXME: Interestingly, and this could be from a side effect elsewhere,
      // when a logged-in user refreshes the page, the trip request in the URL is not recorded again
      // (state.user stays unpopulated until after this function is called).
      //
      const { user } = state
      const storeTripHistory = user &&
        user.loggedInUser &&
        user.loggedInUser.storeTripHistory

      fetch(constructRoutingQuery(otpState, true), getOtpFetchOptions(state, storeTripHistory))
        .then(getJsonAndCheckResponse)
        .then(json => {
          // FIXME: This is only performed when ignoring realtimeupdates currently, just
          // to ensure it is not repeated twice.
          // FIXME: We should check that the mode combination actually has
          // realtime (or maybe this is set in the config file) to determine
          // whether this extra query to OTP is needed.
          dispatch(nonRealtimeRoutingResponse({ response: json, searchId }))
        })
        .catch(error => {
          console.error(error)
          // do nothing
        })
    })
  }
}

function getJsonAndCheckResponse (res) {
  if (res.status >= 400) {
    const error = new Error('Received error from server')
    error.response = res
    throw error
  }
  return res.json()
}

/**
 * This method determines the fetch options (including API key and Authorization headers) for the OTP API.
 * - If the OTP server is not the middleware server (standalone OTP server),
 *   an empty object is returned.
 * - If the OTP server is the same as the middleware server,
 *   then an object is returned with the following:
 *   - A middleware API key, if it has been set in the configuration (it is most likely required),
 *   - An Auth0 accessToken, when includeToken is true and a user is logged in (userState.loggedInUser is not null).
 * This method assumes JSON request bodies.)
 */
function getOtpFetchOptions (state, includeToken = false) {
  let apiBaseUrl, apiKey, token

  const { api, persistence } = state.otp.config
  if (persistence && persistence.otp_middleware) {
    ({ apiBaseUrl, apiKey } = persistence.otp_middleware)
  }

  const isOtpServerSameAsMiddleware = apiBaseUrl === api.host
  if (isOtpServerSameAsMiddleware) {
    if (includeToken && state.user) {
      const { accessToken, loggedInUser } = state.user
      if (accessToken && loggedInUser) {
        token = accessToken
      }
    }

    return getSecureFetchOptions(token, apiKey)
  } else {
    return {}
  }
}

function constructRoutingQuery (otpState, ignoreRealtimeUpdates, injectedParams = {}) {
  const { config, currentQuery } = otpState
  const routingType = currentQuery.routingType
  // Check for routingType-specific API config; if none, use default API
  const rt = config.routingTypes && config.routingTypes.find(rt => rt.key === routingType)
  const api = (rt && rt.api) || config.api
  const planEndpoint = `${api.host}${api.port
    ? ':' + api.port
    : ''}${api.path}/plan`
  const params = {
    ...getRoutingParams(currentQuery, ignoreRealtimeUpdates),
    // Apply mode override, if specified (for batch routing).
    ...injectedParams
  }
  return `${planEndpoint}?${qs.stringify(params, { arrayFormat: 'repeat' })}`
}

export function getRoutingParams (query, config, ignoreRealtimeUpdates) {
  const routingType = query.routingType
  const isItinerary = routingType === 'ITINERARY'
  let params = {}

  // Start with the universe of OTP parameters defined in query-params.js:
  queryParams
    .filter(qp => {
      // A given parameter is included in the request if all of the following:
      // 1. Must apply to the active routing type (ITINERARY or PROFILE)
      // 2. Must be included in the current user-defined query
      // 3. Must pass the parameter's applicability test, if one is specified
      return qp.routingTypes.indexOf(routingType) !== -1 &&
        qp.name in query &&
        (typeof qp.applicable !== 'function' || qp.applicable(query, config))
    })
    .forEach(qp => {
      // Translate the applicable parameters according to their rewrite
      // functions (if provided)
      const rewriteFunction = isItinerary
        ? qp.itineraryRewrite
        : qp.profileRewrite
      params = Object.assign(
        params,
        rewriteFunction
          ? rewriteFunction(query[qp.name])
          : { [qp.name]: query[qp.name] }
      )
    })

  // Additional processing specific to ITINERARY mode
  if (isItinerary) {
    // override ignoreRealtimeUpdates if provided
    if (typeof ignoreRealtimeUpdates === 'boolean') {
      params.ignoreRealtimeUpdates = ignoreRealtimeUpdates
    }

    // check date/time validity; ignore both if either is invalid
    const dateValid = moment(params.date, OTP_API_DATE_FORMAT).isValid()
    const timeValid = moment(params.time, OTP_API_TIME_FORMAT).isValid()

    if (!dateValid || !timeValid) {
      delete params.time
      delete params.date
    }

    // temp: set additional parameters for CAR_HAIL or CAR_RENT trips
    if (
      params.mode &&
      (params.mode.includes('CAR_HAIL') || params.mode.includes('CAR_RENT'))
    ) {
      params.minTransitDistance = '20%'
      // increase search timeout because these queries can take a while
      params.searchTimeout = 10000
    }

    // set onlyTransitTrips for car rental searches
    if (params.mode && params.mode.includes('CAR_RENT')) {
      params.onlyTransitTrips = false
    }

  // Additional processing specific to PROFILE mode
  } else {
    // check start and end time validity; ignore both if either is invalid
    const startTimeValid = moment(params.startTime, OTP_API_TIME_FORMAT).isValid()
    const endTimeValid = moment(params.endTime, OTP_API_TIME_FORMAT).isValid()

    if (!startTimeValid || !endTimeValid) {
      delete params.startTimeValid
      delete params.endTimeValid
    }
  }

  // TODO: check that valid from/to locations are provided

  // hack to add walking to driving/TNC trips
  if (hasCar(params.mode)) {
    params.mode += ',WALK'
  }

  return params
}

// Park and Ride location query

export const parkAndRideError = createAction('PARK_AND_RIDE_ERROR')
export const parkAndRideResponse = createAction('PARK_AND_RIDE_RESPONSE')

export function parkAndRideQuery (params) {
  let endpoint = 'park_and_ride'
  if (params && Object.keys(params).length > 0) {
    endpoint += '?' + Object.keys(params).map(key => key + '=' + params[key]).join('&')
  }
  return createQueryAction(endpoint, parkAndRideResponse, parkAndRideError)
}

// bike rental station query

export const bikeRentalError = createAction('BIKE_RENTAL_ERROR')
export const bikeRentalResponse = createAction('BIKE_RENTAL_RESPONSE')

export function bikeRentalQuery (params) {
  let endpoint = 'bike_rental'
  // add query parameters
  if (params && Object.keys(params).length > 0) {
    endpoint += '?' + Object.keys(params).map(key => key + '=' + params[key]).join('&')
  }
  return createQueryAction(endpoint, bikeRentalResponse, bikeRentalError)
}

// Car rental (e.g. car2go) locations lookup query

export const carRentalResponse = createAction('CAR_RENTAL_RESPONSE')
export const carRentalError = createAction('CAR_RENTAL_ERROR')

export function carRentalQuery (params) {
  return createQueryAction(params, carRentalResponse, carRentalError, {customUrl: true})
}

// Single stop lookup query
const findStopResponse = createAction('FIND_STOP_RESPONSE')
const findStopError = createAction('FIND_STOP_ERROR')

export function findStop (params) {
  return createQueryAction(
    `index/stops/${params.stopId}`,
    findStopResponse,
    findStopError,
    {
      serviceId: 'stops',
      postprocess: (payload, dispatch) => {
        dispatch(findRoutesAtStop(params.stopId))
        dispatch(findStopTimesForStop(params))
      },
      noThrottle: true
    }
  )
}

// TODO: Optionally substitute GraphQL queries? Note: this is not currently
// possible because gtfsdb (the alternative transit index used by TriMet) does not
// support GraphQL queries.
// export function findStop (params) {
//   const query = `
// query stopQuery($stopId: [String]) {
//   stops (ids: $stopId) {
//     id: gtfsId
//     code
//     name
//     url
//     lat
//     lon
//     stoptimesForPatterns {
//       pattern {
//         id: semanticHash
//         route {
//           id: gtfsId
//           longName
//           shortName
//           sortOrder
//         }
//       }
//       stoptimes {
//         scheduledArrival
//         realtimeArrival
//         arrivalDelay
//         scheduledDeparture
//         realtimeDeparture
//         departureDelay
//         timepoint
//         realtime
//         realtimeState
//         serviceDay
//         headsign
//       }
//     }
//   }
// }
// `
//   return createGraphQLQueryAction(
//     query,
//     { stopId: params.stopId },
//     findStopResponse,
//     findStopError,
//     {
//       // find stop should not be throttled since it can make quite frequent
//       // updates when fetching stop times for a stop
//       noThrottle: true,
//       serviceId: 'stops',
//       rewritePayload: (payload) => {
//         // convert pattern array to ID-mapped object
//         const patterns = []
//         const { stoptimesForPatterns, ...stop } = payload.data.stops[0]
//         stoptimesForPatterns.forEach(obj => {
//           const { pattern, stoptimes: stopTimes } = obj
//           // It's possible that not all stop times for a pattern will share the
//           // same headsign, but this is probably a minor edge case.
//           const headsign = stopTimes[0]
//             ? stopTimes[0].headsign
//             : pattern.route.longName
//           const patternIndex = patterns.findIndex(p =>
//             p.headsign === headsign && pattern.route.id === p.route.id)
//           if (patternIndex === -1) {
//             patterns.push({ ...pattern, headsign, stopTimes })
//           } else {
//             patterns[patternIndex].stopTimes.push(...stopTimes)
//           }
//         })
//         return {
//           ...stop,
//           patterns
//         }
//       }
//     }
//   )
// }

// Single trip lookup query

export const findTripResponse = createAction('FIND_TRIP_RESPONSE')
export const findTripError = createAction('FIND_TRIP_ERROR')

export function findTrip (params) {
  return createQueryAction(
    `index/trips/${params.tripId}`,
    findTripResponse,
    findTripError,
    {
      postprocess: (payload, dispatch) => {
        dispatch(findStopsForTrip({tripId: params.tripId}))
        dispatch(findStopTimesForTrip({tripId: params.tripId}))
        dispatch(findGeometryForTrip({tripId: params.tripId}))
      }
    }
  )
}

// Stops for trip query

export const findStopsForTripResponse = createAction('FIND_STOPS_FOR_TRIP_RESPONSE')
export const findStopsForTripError = createAction('FIND_STOPS_FOR_TRIP_ERROR')

export function findStopsForTrip (params) {
  return createQueryAction(
    `index/trips/${params.tripId}/stops`,
    findStopsForTripResponse,
    findStopsForTripError,
    {
      rewritePayload: (payload) => {
        return {
          tripId: params.tripId,
          stops: payload
        }
      }
    }
  )
}

// Stop times for trip query

export const findStopTimesForTripResponse = createAction('FIND_STOP_TIMES_FOR_TRIP_RESPONSE')
export const findStopTimesForTripError = createAction('FIND_STOP_TIMES_FOR_TRIP_ERROR')

export function findStopTimesForTrip (params) {
  return createQueryAction(
    `index/trips/${params.tripId}/stoptimes`,
    findStopTimesForTripResponse,
    findStopTimesForTripError,
    {
      rewritePayload: (payload) => {
        return {
          tripId: params.tripId,
          stopTimes: payload
        }
      },
      noThrottle: true
    }
  )
}

// Geometry for trip query

export const findGeometryForTripResponse = createAction('FIND_GEOMETRY_FOR_TRIP_RESPONSE')
export const findGeometryForTripError = createAction('FIND_GEOMETRY_FOR_TRIP_ERROR')

export function findGeometryForTrip (params) {
  const { tripId } = params
  return createQueryAction(
    `index/trips/${tripId}/geometry`,
    findGeometryForTripResponse,
    findGeometryForTripError,
    {
      rewritePayload: (payload) => ({ tripId, geometry: payload })
    }
  )
}

const findStopTimesForStopResponse = createAction('FIND_STOP_TIMES_FOR_STOP_RESPONSE')
const findStopTimesForStopError = createAction('FIND_STOP_TIMES_FOR_STOP_ERROR')

/**
 * Stop times for stop query (used in stop viewer).
 */
export function findStopTimesForStop (params) {
  return function (dispatch, getState) {
    let { stopId, ...otherParams } = params
    // If other params not provided, fall back on defaults from stop viewer config.
    const queryParams = { ...getStopViewerConfig(getState().otp), ...otherParams }
    // If no start time is provided, pass in the current time. Note: this is not
    // a required param by the back end, but if a value is not provided, the
    // time defaults to the server's time, which can make it difficult to test
    // scenarios when you may want to use a different date/time for your local
    // testing environment.
    if (!queryParams.startTime) {
      const nowInSeconds = Math.floor((new Date()).getTime() / 1000)
      queryParams.startTime = nowInSeconds
    }
    dispatch(createQueryAction(
      `index/stops/${stopId}/stoptimes?${qs.stringify(queryParams)}`,
      findStopTimesForStopResponse,
      findStopTimesForStopError,
      {
        rewritePayload: (stopTimes) => {
          return {
            stopId,
            stopTimes
          }
        },
        noThrottle: true
      }
    ))
  }
}

// Routes lookup query

const findRoutesResponse = createAction('FIND_ROUTES_RESPONSE')
const findRoutesError = createAction('FIND_ROUTES_ERROR')

/* export function findRoutes (params) {
  return createQueryAction(
    'index/routes',
    findRoutesResponse,
    findRoutesError,
    {
      serviceId: 'routes',
      rewritePayload: (payload) => {
        const routes = {}
        payload.forEach(rte => { routes[rte.id] = rte })
        return routes
      }
    }
  )
} */

export function findRoutes (params) {
  const query = `
  query routeQuery($routesIds: [String]) {
    routes(ids: $routesIds) {
      id: gtfsId
      mode
      color
      shortName
      longName
      textColor
    }
  }
  `

  return createGraphQLQueryAction(
    query,
    {},
    findRoutesResponse,
    findRoutesError,
    {
      serviceId: 'routes',
      rewritePayload: (payload) => {
        const routes = {}
        const {routes: responseRoutes} = getResponseData(payload);
        responseRoutes.forEach(rte => { routes[rte.id] = rte })
        return routes
      }
    }
  )
}

// Patterns for Route lookup query
// TODO: replace with GraphQL query for route => patterns => geometry
const findPatternsForRouteResponse = createAction('FIND_PATTERNS_FOR_ROUTE_RESPONSE')
const findPatternsForRouteError = createAction('FIND_PATTERNS_FOR_ROUTE_ERROR')

// Single Route lookup query

export const findRouteResponse = createAction('FIND_ROUTE_RESPONSE')
export const findRouteError = createAction('FIND_ROUTE_ERROR')

// commented because it's substituted with graphql function bellow
/* export function findRoute (params) {
  return createQueryAction(
    `index/routes/${params.routeId}`,
    findRouteResponse,
    findRouteError,
    {
      postprocess: (payload, dispatch) => {
        // load patterns
        dispatch(findPatternsForRoute({ routeId: params.routeId }))
      },
      noThrottle: true
    }
  )
} */

export function findPatternsForRoute (params) {
  return createQueryAction(
    `index/routes/${params.routeId}/patterns`,
    findPatternsForRouteResponse,
    findPatternsForRouteError,
    {
      rewritePayload: (payload) => {
        // convert pattern array to ID-mapped object
        const patterns = {}
        payload.forEach(ptn => { patterns[ptn.id] = ptn })

        return {
          routeId: params.routeId,
          patterns
        }
      },
      postprocess: (payload, dispatch) => {
        // load geometry for each pattern
        batch(() => { // TODO: not sure if it works
          payload.forEach(ptn => {
            dispatch(findGeometryForPattern({
              routeId: params.routeId,
              patternId: ptn.id
            }))
          })
        })
      }
    }
  )
}

// Geometry for Pattern lookup query

const findGeometryForPatternResponse = createAction('FIND_GEOMETRY_FOR_PATTERN_RESPONSE')
const findGeometryForPatternError = createAction('FIND_GEOMETRY_FOR_PATTERN_ERROR')

export function findGeometryForPattern (params) {
  return createQueryAction(
    `index/patterns/${params.patternId}/geometry`,
    findGeometryForPatternResponse,
    findGeometryForPatternError,
    {
      rewritePayload: (payload) => {
        return {
          routeId: params.routeId,
          patternId: params.patternId,
          geometry: payload
        }
      }
    }
  )
}

export function findRoute (params) {
  const query = `query routeQuery($routeId: String!) {
    route (id: $routeId) {
      id: gtfsId
      mode
      longName
      shortName
      color
      desc
      bikesAllowed
      textColor
      patterns {
        id: code
        directionId
        headsign
        name
        geometry
      }
    }
  }`
  return createGraphQLQueryAction(
    query,
    { routeId:params.routeId },
    findPatternsForRouteResponse,
    findPatternsForRouteError,
    {
      rewritePayload: (payload) => {
        // convert pattern array to ID-mapped object
        // note: some params have changed name to keep compatibility with previous code
        const patterns = {}
        const {route} = getResponseData(payload);
        route.patterns.forEach(ptn => {
          patterns[ptn.id] = {
            routeId: params.routeId ,
            id: ptn.id,
            geometry: {'points': ptn?.geometry},
            desc: ptn.name
          }
        })

        return {
          routeId: params.routeId,
          ...route,
          patterns
        }
      }
    }
  )
}

// TNC ETA estimate lookup query

export const transportationNetworkCompanyEtaResponse = createAction('TNC_ETA_RESPONSE')
export const transportationNetworkCompanyEtaError = createAction('TNC_ETA_ERROR')

export function getTransportationNetworkCompanyEtaEstimate (params) {
  const {companies, from} = params
  return createQueryAction(
    `transportation_network_company/eta_estimate?${qs.stringify({
      companies,
      from
    })}`, // endpoint
    transportationNetworkCompanyEtaResponse, // responseAction
    transportationNetworkCompanyEtaError, // errorAction
    {
      rewritePayload: (payload) => {
        return {
          from,
          estimates: payload.estimates
        }
      }
    }
  )
}

// TNC ride estimate lookup query

export const transportationNetworkCompanyRideResponse = createAction('TNC_RIDE_RESPONSE')
export const transportationNetworkCompanyRideError = createAction('TNC_RIDE_ERROR')

export function getTransportationNetworkCompanyRideEstimate (params) {
  const {company, from, rideType, to} = params
  return createQueryAction(
    `transportation_network_company/ride_estimate?${qs.stringify({
      company,
      from,
      rideType,
      to
    })}`, // endpoint
    transportationNetworkCompanyRideResponse, // responseAction
    transportationNetworkCompanyRideError, // errorAction
    {
      rewritePayload: (payload) => {
        return {
          company,
          from,
          rideEstimate: payload.rideEstimate,
          to
        }
      }
    }
  )
}

// Nearby Stops Query

const receivedNearbyStopsResponse = createAction('NEARBY_STOPS_RESPONSE')
const receivedNearbyStopsError = createAction('NEARBY_STOPS_ERROR')

export function findNearbyStops (params) {
  return createQueryAction(
    `index/stops?${qs.stringify({radius: 1000, ...params})}`,
    receivedNearbyStopsResponse,
    receivedNearbyStopsError,
    {
      serviceId: 'stops',
      rewritePayload: stops => {
        if (stops) {
          // Sort the stops by proximity
          stops.forEach(stop => {
            stop.distance = haversine(
              { latitude: params.lat, longitude: params.lon },
              { latitude: stop.lat, longitude: stop.lon }
            )
          })
          stops.sort((a, b) => { return a.distance - b.distance })
          if (params.max && stops.length > params.max) stops = stops.slice(0, params.max)
        }
        return {stops}
      },
      // retrieve routes for each stop
      postprocess: (stops, dispatch, getState) => {
        if (params.max && stops.length > params.max) stops = stops.slice(0, params.max)
        stops.forEach(stop => dispatch(findRoutesAtStop(stop.id)))
      }
    }
  )
}

// Routes at Stop query

const receivedRoutesAtStopResponse = createAction('ROUTES_AT_STOP_RESPONSE')
const receivedRoutesAtStopError = createAction('ROUTES_AT_STOP_ERROR')

export function findRoutesAtStop (stopId) {
  return createQueryAction(
    `index/stops/${stopId}/routes?detail=true`,
    receivedRoutesAtStopResponse,
    receivedRoutesAtStopError,
    {
      serviceId: 'stops/routes',
      rewritePayload: routes => ({ stopId, routes }),
      noThrottle: true
    }
  )
}

// Stops within Bounding Box Query

const receivedStopsWithinBBoxResponse = createAction('STOPS_WITHIN_BBOX_RESPONSE')
const receivedStopsWithinBBoxError = createAction('STOPS_WITHIN_BBOX_ERROR')

/* export function findStopsWithinBBox (params) {

  let type = 'stops';

  if (params.clusters === true) {
    type = 'clusters';
    params.detail = true;
  }

  return createQueryAction(
    `index/${type}?${qs.stringify(params)}`,
    receivedStopsWithinBBoxResponse,
    receivedStopsWithinBBoxError,
    {
      serviceId: 'stops',
      rewritePayload: stops => {
        // make stop clusters unique
        stops = uniqBy(stops, 'id');
        // make stops in cluster unique
        // PATCH: it solves duplicates values but it shouldn't happen client side
        // https://stackoverflow.com/a/36744732
          stops?.forEach((stop)=>{
            if(Array.isArray(stop.stops) && stop.stops.length > 1){
            // if it's a cluster of stops keep only the first occurrence of each stop
            stop.stops = stop?.stops?.filter((currentStop, index, stopsArray) =>
              index === stopsArray.findIndex((s) => (
                s.name === currentStop.name &&
                s.lat === currentStop.lat &&
                s.lon === currentStop.lon
              ))
            )
          }
        })
        return {stops}
      }
    }
  )
} */

export function findStopsWithinBBox (params) {
  let type = 'stops';
  const {
          clusters:useClusters,
          minLat,
          minLon,
          maxLat,
          maxLon
        } = params;

  if (useClusters === true) {
    // type = 'clusters';
  }

  const queries = {
    stops: `query stopsQuery(
      $minLat: Float
      $minLon: Float
      $maxLat: Float
      $maxLon: Float
    ) {
      stopsByBbox(
        minLat: $minLat
        minLon:$minLon
        maxLat: $maxLat
        maxLon: $maxLon
      ) {
        id: gtfsId
        name
        lat
        lon
        code
        desc
        vehicleType
        vehicleMode
        platformCode
      }
    }`,
    clusters: `query clustersQuery(
      $minLat: Float
      $minLon: Float
      $maxLat: Float
      $maxLon: Float
    ) {
        clustersByBbox(
        minLat: $minLat
        minLon:$minLon
        maxLat: $maxLat
        maxLon: $maxLon
      ) {
        id: gtfsId
        name
        lat
        lon
        code
        desc
        vehicleType
        vehicleMode
        platformCode
      }
    }`
  }

  return createGraphQLQueryAction(
    queries[type],
    {
      minLat,
      minLon,
      maxLat,
      maxLon
    },
    receivedStopsWithinBBoxResponse,
    receivedStopsWithinBBoxError,
    {
      serviceId: 'stops',
      rewritePayload: ({data}) => {
        const {stopsByBbox:stops} = data
        console.log(stops);

        // make stop clusters unique
        // stops = uniqBy(stops, 'id');
        // make stops in cluster unique
        // PATCH: it solves duplicates values but it shouldn't happen client side
        // https://stackoverflow.com/a/36744732
          stops?.forEach((stop)=>{
            if(Array.isArray(stop.stops) && stop.stops.length > 1){
            // if it's a cluster of stops keep only the first occurrence of each stop
            stop.stops = stop?.stops?.filter((currentStop, index, stopsArray) =>
              index === stopsArray.findIndex((s) => (
                s.name === currentStop.name &&
                s.lat === currentStop.lat &&
                s.lon === currentStop.lon
              ))
            )
          }
        })
        console.log(stops);
        return {stops}
      }
    }
  )
}

export const clearStops = createAction('CLEAR_STOPS_OVERLAY')
/*
// Clusters within Bounding Box Query

const receivedClustersWithinBBoxResponse = createAction('CLUSTERS_WITHIN_BBOX_RESPONSE')
const receivedClustersWithinBBoxError = createAction('CLUSTERS_WITHIN_BBOX_ERROR')

export function findClustersWithinBBox (params) {
  params.detail=true;
  return createQueryAction(
    `index/clusters?${qs.stringify(params)}`,
    receivedClustersWithinBBoxResponse,
    receivedClustersWithinBBoxError,
    {
      serviceId: 'clusters',
      rewritePayload: clusters => ({clusters})
    }
  )
}

export const clearClusters = createAction('CLEAR_CLUSTERS_OVERLAY')
*/
const throttledUrls = {}

function now () {
  return (new Date()).getTime()
}

const TEN_SECONDS = 10000

// automatically clear throttled urls older than 10 seconds
window.setInterval(() => {
  Object.keys(throttledUrls).forEach(key => {
    if (throttledUrls[key] < now() - TEN_SECONDS) {
      delete throttledUrls[key]
    }
  })
}, 1000)

/**
 * Generic helper for constructing API queries. Automatically throttles queries
 * to url to no more than once per 10 seconds.
 *
 * @param {string} endpoint - The API endpoint path (does not include
 *   '../otp/routers/router_id/')
 * @param {Function} responseAction - Action to dispatch on a successful API
 *   response. Accepts payload object parameter.
 * @param {Function} errorAction - Function to invoke on API error response.
 *   Accepts error object parameter.
 * @param {Options} options - Any of the following optional settings:
 *   - rewritePayload: Function to be invoked to modify payload before being
 *       passed to responseAction. Accepts and returns payload object.
 *   - postprocess: Function to be invoked after responseAction is invoked.
 *       Accepts payload, dispatch, getState parameters.
 *   - serviceId: identifier for TransitIndex service used in
 *       alternateTransitIndex configuration.
 *   - fetchOptions: fetch options (e.g., method, body, headers).
 */

function createQueryAction (endpoint, responseAction, errorAction, options = {}) {
  return async function (dispatch, getState) {
    const otpState = getState().otp
    let url
    if (options.serviceId && otpState.config.alternateTransitIndex &&
      otpState.config.alternateTransitIndex.services.includes(options.serviceId)
    ) {
      console.log('Using alt service for ' + options.serviceId)
      url = otpState.config.alternateTransitIndex.apiRoot + endpoint
    } else if (options.customUrl == true){
      url = endpoint;
    } else {
      const api = otpState.config.api
      url = `${api.host}${api.port ? ':' + api.port : ''}${api.path}/${endpoint}`
    }

    if (!options.noThrottle) {
      // don't make a request to a URL that has already seen the same request
      // within the last 10 seconds
      const throttleKey = options.fetchOptions
        ? `${url}-${hash(options.fetchOptions)}`
        : url
      if (throttledUrls[throttleKey] && throttledUrls[throttleKey] > now() - TEN_SECONDS) {
        // URL already had a request within last 10 seconds, warn and exit
        console.warn(`Request throttled for url: ${url}`)
        return
      } else {
        throttledUrls[throttleKey] = now();
      }
    }
    let payload
    try {
      const response = await fetch(url, options.fetchOptions)
      if (response.status >= 400) {
        const error = new Error('Received error from server')
        error.response = response
        throw error
      }
      payload = await response.json()
    } catch (err) {
      return dispatch(errorAction(err))
    }

    if (typeof options.rewritePayload === 'function') {
      dispatch(responseAction(options.rewritePayload(payload)))
    } else {
      dispatch(responseAction(payload))
    }

    if (typeof options.postprocess === 'function') {
      options.postprocess(payload, dispatch, getState)
    }
  }
}

// TODO: Determine how we might be able to use GraphQL with the alternative
// transit index. Currently this is not easily possible because the alternative
// transit index does not have support for GraphQL and handling both Rest and
// GraphQL queries could introduce potential difficulties for maintainers.
function createGraphQLQueryAction (query, variables, responseAction, errorAction, options) {
  const endpoint = `index/graphql`
  const fetchOptions = {
    method: 'POST',
    body: JSON.stringify({ query, variables }),
    headers: { 'Content-Type': 'application/json' }
  }
  return createQueryAction(
    endpoint,
    responseAction,
    errorAction,
    { ...options, fetchOptions }
  )
}

/**
 * Update the browser/URL history with new parameters
 * NOTE: This has not been tested for profile-based journeys.
 */
export function setUrlSearch (params, replaceCurrent = false) {
  return function (dispatch, getState) {
    const base = getState().router.location.pathname
    const path = `${base}?${qs.stringify(params, { arrayFormat: 'repeat' })}`
    if (replaceCurrent) dispatch(replace(path))
    else dispatch(push(path))
  }
}

/**
 * Update the OTP Query parameters in the URL and ensure that the active search
 * is set correctly. Leaves any other existing URL parameters (e.g., UI) unchanged.
 */
function updateOtpUrlParams (otpState, searchId) {
  const {config, currentQuery} = otpState
  // Get updated OTP params from current query.
  const otpParams = getRoutingParams(currentQuery, config, true)
  return function (dispatch, getState) {
    const params = {}
    // Get all URL params and ensure non-routing params (UI, sessionId) remain
    // unchanged.
    const urlParams = getUrlParams()
    Object.keys(urlParams)
      // If param is non-routing, add to params to keep the same after update.
      .filter(key => key.indexOf('_') !== -1 || key === 'sessionId')
      .forEach(key => { params[key] = urlParams[key] })
    params.ui_activeSearch = searchId
    // Assumes this is a new search and the active itinerary should be reset.
    params.ui_activeItinerary = 0
    // Merge in the provided OTP params and update the URL
    dispatch(setUrlSearch(Object.assign(params, otpParams)))
  }
}
