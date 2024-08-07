import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedServiceareaLocationsError = createAction('SERVICEAREA_LOCATIONS_ERROR')
export const receivedServiceareaLocationsResponse = createAction('SERVICEAREA_LOCATIONS_RESPONSE')
export const requestServiceareaLocationsResponse = createAction('SERVICEAREA_LOCATIONS_REQUEST')

export function serviceareaLocationsQuery (url,params) {
  return async function (dispatch, getState) {
    dispatch(requestServiceareaLocationsResponse())
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
      return dispatch(receivedServiceareaLocationsError(err))
    }

    dispatch(receivedServiceareaLocationsResponse(json))
  }
}
