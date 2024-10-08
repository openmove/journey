import { createAction } from "redux-actions";
import { addQueryParams } from "../util/query-params";
import { createQueryAction } from "./api";
if (typeof fetch === "undefined") require("isomorphic-fetch");

async function fetchNearbyToursIds(url, params) {
  const newUrl = addQueryParams(url, params);
  const response = await fetch(newUrl, {
    headers: { Accept: "application/json", "X-Robots-Tag": "noindex" },
  });

  if (response.status >= 400) {
    const error = new Error("Received error from server");
    error.response = response;
    throw error;
  }

  const idsResponse = await response.json();
  let ids = [];
  if (
    idsResponse?.status === "OK" &&
    Array.isArray(idsResponse?.result) &&
    idsResponse?.result?.length > 0
  ) {
    ids = idsResponse.result.map((obj) => obj.id);
  }
  return ids;
}

export const receivedTrailsLocationsError = createAction(
  "TRAILS_LOCATIONS_ERROR"
);
export const receivedTrailsLocationsResponse = createAction(
  "TRAILS_LOCATIONS_RESPONSE"
);
export const requestTrailsLocationsResponse = createAction(
  "TRAILS_LOCATIONS_REQUEST"
);

export function trailsLocationsQuery(nearbyUrl, ooisUrl, params, overlayName) {
  return async function (dispatch, getState) {
    dispatch(requestTrailsLocationsResponse()); // todo: is this doing something?

    let ids = [];
    try {
      ids = await fetchNearbyToursIds(nearbyUrl, params);
      if (ids?.length <= 0) {
        return;
      }
    } catch (err) {
      return dispatch(receivedTrailsLocationsError({ overlayName, data: err }));
    }

    const detailsUrl = addQueryParams(ooisUrl + "/" + ids.join(","), params);
    dispatch(
      createQueryAction(
        detailsUrl,
        receivedTrailsLocationsResponse,
        receivedTrailsLocationsError,
        {
          customUrl: true,
          fetchOptions: {
            headers: { Accept: "application/json", "X-Robots-Tag": "noindex" },
          },
        }
      )
    );
    // dispatch(receivedTrailsLocationsResponse({overlayName, data:json}))
  };
}

export const receivedContextualizedTrailsError = createAction(
  "CONTEXTUALIZED_TRAILS_ERROR"
);
export const receivedContextualizedTrailsResponse = createAction(
  "CONTEXTUALIZED_TRAILS_RESPONSE"
);
export const requestContextualizedTrailsResponse = createAction(
  "CONTEXTUALIZED_TRAILS_REQUEST"
);

export const contextualizedTrailsQuery = (
  nearbyUrl,
  ooisUrl,
  params,
  overlayName
) => {
  return async function (dispatch, getState) {
    dispatch(requestContextualizedTrailsResponse()); // todo: is this doing something?

    let ids = [];
    try {
      ids = await fetchNearbyToursIds(nearbyUrl, params);
      if (ids?.length <= 0) {
        return;
      }
    } catch (err) {
      return dispatch(
        receivedContextualizedTrailsError({ overlayName, data: err })
      );
    }

    let json;
    try {
      const detailsUrl = addQueryParams(ooisUrl + "/" + ids.join(","), params);
      const response = await fetch(detailsUrl, {
        headers: { Accept: "application/json", "X-Robots-Tag": "noindex" },
      });

      if (response.status >= 400) {
        const error = new Error("Received error from server");
        error.response = response;
        throw error;
      }

      json = await response.json();
    } catch (err) {
      return dispatch(
        receivedContextualizedTrailsError({ overlayName, data: err })
      );
    }

    dispatch(receivedContextualizedTrailsResponse({ overlayName, data: json }));
  };
};

export const setViewedTrail = createAction("SET_VIEWED_TRAIL");
