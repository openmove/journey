import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedAlertsLocationsError = createAction('ALERTS_LOCATIONS_ERROR')
export const receivedAlertsLocationsResponse = createAction('ALERTS_LOCATIONS_RESPONSE')
export const requestAlertsLocationsResponse = createAction('ALERTS_LOCATIONS_REQUEST')

export function alertsLocationsQuery (url,params) {
  return async function (dispatch, getState) {
    dispatch(requestAlertsLocationsResponse())
    let json
    try {
      const newUrl = addQueryParams(url,params)
      const response = await fetch(newUrl)
      if (response.status >= 400) {
        const error = new Error('Received error from server')
        error.response = response
        throw error
      }
      json = await response.json()
    } catch (err) {
      return dispatch(receivedAlertsLocationsError(err))
    }

    dispatch(receivedAlertsLocationsResponse(json))
  }
}
