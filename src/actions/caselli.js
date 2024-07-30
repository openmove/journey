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

export const receivedCaselliLocationsError =  createAction('CASELLI_LOCATIONS_ERROR',preparePayload)
export const receivedCaselliLocationsResponse  = createAction('CASELLI_LOCATIONS_RESPONSE',preparePayload)
export const requestCaselliLocationsResponse =  createAction('CASELLI_LOCATIONS_REQUEST',preparePayload)

export function serviceareaLocationsQuery (url, params, overlayName) {
  return async function (dispatch, getState) {

    dispatch(requestCaselliLocationsResponse()) // todo: is this doing something?
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
      return dispatch(receivedCaselliLocationsError({overlayName, data:err}))
    }

    dispatch(receivedCaselliLocationsResponse({overlayName, data:json}))
  }
}
