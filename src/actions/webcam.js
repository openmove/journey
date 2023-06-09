import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedWebcamLocationsError = createAction('WEBCAM_LOCATIONS_ERROR')
export const receivedWebcamLocationsResponse = createAction('WEBCAM_LOCATIONS_RESPONSE')
export const requestWebcamLocationsResponse = createAction('WEBCAM_LOCATIONS_REQUEST')

export function webcamLocationsQuery (url, params) {
  return async function (dispatch, getState) {
    dispatch(requestWebcamLocationsResponse())
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
      return dispatch(receivedWebcamLocationsError(err))
    }

    dispatch(receivedWebcamLocationsResponse(json))
  }
}
