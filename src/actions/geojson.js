import { createAction } from 'redux-actions'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedGeojsonLocationsError = createAction('GEOJSON_LOCATIONS_ERROR')
export const receivedGeojsonLocationsResponse = createAction('GEOJSON_LOCATIONS_RESPONSE')
export const requestGeojsonLocationsResponse = createAction('GEOJSON_LOCATIONS_REQUEST')

export function geojsonLocationsQuery (url) {
  return async function (dispatch, getState) {
    dispatch(requestGeojsonLocationsResponse())
    let json
    try {
      const response = await fetch(url)
      if (response.status >= 400) {
        const error = new Error('Received error from server')
        error.response = response
        throw error
      }
      json = await response.json();
    } catch (err) {
      return dispatch(receivedGeojsonLocationsError(err))
    }

    dispatch(receivedGeojsonLocationsResponse(json))
  }
}
