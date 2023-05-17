import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

function preparePayload(payload) {
  if(!payload){return}

  const {overlayName,data} = payload
  return ({
    overlayName,
    data
  })
}

export const receivedParkingLocationsError =  createAction('PARKING_LOCATIONS_ERROR',preparePayload)
export const receivedParkingLocationsResponse  = createAction('PARKING_LOCATIONS_RESPONSE',preparePayload)
export const requestParkingLocationsResponse =  createAction('PARKING_LOCATIONS_REQUEST',preparePayload)

export function parkingLocationsQuery (overlayName,url,params) {
  return async function (dispatch, getState) {

    dispatch(requestParkingLocationsResponse()) // todo: is this doing something?
    let json
    try {
      const newUrl = addQueryParams(url,params)
      const response = await fetch(newUrl)
      if (response.status >= 400) {
        const error = new Error('Received error from server')
        error.response = response
        throw error
      }
      json = await response.json();
    } catch (err) {
      return dispatch(receivedParkingLocationsError({overlayName, data:err}))
    }

    dispatch(receivedParkingLocationsResponse({overlayName, data:json}))
  }
}
