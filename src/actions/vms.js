import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedVmsLocationsError = createAction('VMS_LOCATIONS_ERROR')
export const receivedVmsLocationsResponse = createAction('VMS_LOCATIONS_RESPONSE')
export const requestVmsLocationsResponse = createAction('VMS_LOCATIONS_REQUEST')

export function vmsLocationsQuery (url,params) {
  return async function (dispatch, getState) {
    dispatch(requestVmsLocationsResponse())
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
      return dispatch(receivedVmsLocationsError(err))
    }

    dispatch(receivedVmsLocationsResponse(json))
  }
}
