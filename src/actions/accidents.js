import { createAction } from 'redux-actions'
import {addQueryParams} from '../util/query-params'
if (typeof (fetch) === 'undefined') require('isomorphic-fetch')

export const receivedAccidentsLocationsError = createAction('ACCIDENTS_LOCATIONS_ERROR')
export const receivedAccidentsLocationsResponse = createAction('ACCIDENTS_LOCATIONS_RESPONSE')
export const requestAccidentsLocationsResponse = createAction('ACCIDENTS_LOCATIONS_REQUEST')


export function accidentsLocationsQuery (url,params) {
  return async function (dispatch, getState) {
    dispatch(requestAccidentsLocationsResponse())
    let json
    try {
      const {years,...paramsWithoutYears} = params;
      const newUrl = addQueryParams(url,paramsWithoutYears);

      if(Array.isArray(years) && years.length>0){
        years.forEach( year => newUrl.searchParams.append("years",year))
      }

      const response = await fetch(newUrl)
      if (response.status >= 400) {
        const error = new Error('Received error from server')
        error.response = response
        throw error
      }
      json = await response.json();
    } catch (err) {
      return dispatch(receivedAccidentsLocationsError(err))
    }

    dispatch(receivedAccidentsLocationsResponse(json))
  }
}
