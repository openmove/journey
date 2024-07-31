import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedCaselliLocationsError = createAction('CASELLI_LOCATIONS_ERROR')
export const receivedCaselliLocationsResponse = createAction('CASELLI_LOCATIONS_RESPONSE')
export const requestCaselliLocationsResponse = createAction('CASELLI_LOCATIONS_REQUEST')

export function caselliLocationsQuery (url,params) {
  return async function (dispatch, getState) {
    dispatch(requestCaselliLocationsResponse())
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
      return dispatch(receivedCaselliLocationsError(err))
    }

    dispatch(receivedCaselliLocationsResponse(json))
  }
}
