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
    const { userId ,...restParams } = params;

    dispatch(requestTrailsLocationsResponse()); // todo: is this doing something?

    const detailsUrl = addQueryParams(ooisUrl, restParams);

    dispatch(
      createQueryAction(
        detailsUrl,
        receivedTrailsLocationsResponse,
        receivedTrailsLocationsError,
        {
          customUrl: true,
          fetchOptions: {
            headers: {
              Accept: "application/json",
              // "X-Robots-Tag": "noindex",
              "X-User-Id": userId,
            },
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

    let json;
    try {
      const { "tag[]": categoriesParameter,userId ,...restParams } = params;
      // prevent url encoding of brackets
      const categoriesParameterStr =
        categoriesParameter?.length > 0 ? `&tag[]=${categoriesParameter}` : "";

      const detailsUrl =
        addQueryParams(ooisUrl, restParams) + categoriesParameterStr;

      const response = await fetch(detailsUrl, {
        headers: {
          Accept: "application/json",
          // "X-Robots-Tag": "noindex",
          "X-User-Id": userId,
        },
      });

      if (response.status >= 400) {
        const error = new Error("Received error from server");
        error.response = response;
        throw error;
      }

      json = await response.json();
      if (json && Array.isArray(json)) {
        json = json.slice(0, 3); // :hammer keep maxt three results
      }
    } catch (err) {
      return dispatch(
        receivedContextualizedTrailsError({ overlayName, data: err })
      );
    }

    dispatch(receivedContextualizedTrailsResponse({ overlayName, data: json }));
  };
};

export const setViewedTrail = createAction("SET_VIEWED_TRAIL");
