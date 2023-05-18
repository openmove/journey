import { encodedPolylineType, leafletPathType } from "../core-utils/types";
import { polylineLength, humanizeDistanceStringMetric } from "../core-utils/distance";
// import { getMapColor } from "../core-utils/itinerary";
import { getRouteColor } from "../itinerary-body/util";
import OpenMoveModeIcon from "../../otp-ui/icons/openmove-mode-icon";

import PropTypes from "prop-types";
import React from "react";
import {
  FeatureGroup,
  MapLayer,
  Polyline,
  withLeaflet,
  Tooltip,
} from "react-leaflet";

import polyline from "@mapbox/polyline";

// helper fn to check if geometry has been populated for all patterns in route
const isGeomComplete = (routeData) => {
  return (
    routeData &&
    routeData.patterns &&
    Object.values(routeData.patterns).every(
      (ptn) => typeof ptn.geometry !== "undefined"
    )
  );
};

/**
 * An overlay that will display all polylines of the patterns of a route.
 */
class RouteViewerOverlay extends MapLayer {
  componentDidMount() {}

  // TODO: determine why the default MapLayer componentWillUnmount() method throws an error
  componentWillUnmount() {}

  componentDidUpdate(prevProps) {
    // if pattern geometry just finished populating, update the map points
    if (
      !isGeomComplete(prevProps.routeData) &&
      isGeomComplete(this.props.routeData)
    ) {
      // if (!this.props.routeData?.patterns) return; // todo: is this needed?
      const allPoints = Object.values(this.props.routeData.patterns).reduce(
        (acc, ptn) => {
          return acc.concat(polyline.decode(ptn.geometry.points));
        },
        []
      );
      this.props.leaflet.map.fitBounds(allPoints);
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const { path, routeData } = this.props;

    if (!routeData || !routeData.patterns) return <FeatureGroup />;

   /*  let routeColor
    if(routeData.color){
      routeColor = `#${routeData.color}`
    }else if( routeData.mode){
      routeColor =getMapColor(routeData.mode)
    }
    routeColor =  routeColor || path.color; */

    const routeColor = getRouteColor(routeData?.mode, routeData?.color )

    const text = routeData.longName !== routeData.shortName ? routeData.longName : null
        , desc = routeData?.desc
        , mode = routeData.mode
        , bikesAllowed = routeData?.bikesAllowed
        , segments = [];

    Object.values(routeData.patterns).forEach( pattern => {
      if (!pattern?.geometry?.points) return;

      const pts = polyline.decode(pattern.geometry.points);

      const humanLength = humanizeDistanceStringMetric(polylineLength(pts))

      segments.push(
        <Polyline
          /* eslint-disable-next-line react/jsx-props-no-spreading */
          {...path}
          color={routeColor}
          // className="is-walk"
          key={pattern.id}
          positions={pts}
        >
          <Tooltip
            sticky={true}
          >
            <div className="leaflet-tooltip-content">

            <h4>
              <OpenMoveModeIcon mode={mode} width={20} height={20} /> &nbsp;
              {routeData.shortName} <small>{routeData.id}</small>
            </h4>
            <p>{text}</p>
            <p>{humanLength}</p>
            {desc && <p>{desc}</p>}
            {bikesAllowed && bikesAllowed!=='NO_INFORMATION' && <p>bikesAllowed: {bikesAllowed}</p>}
            </div>
          </Tooltip>
        </Polyline>
      );
    });

    return segments.length > 0 ? (
      <FeatureGroup>
        <div>{segments}</div>
      </FeatureGroup>
    ) : (
      <FeatureGroup />
    );
  }
}

RouteViewerOverlay.propTypes = {
  /**
   * Leaflet path properties to use to style each polyline that represents a
   * pattern of the route. Only a few of the items are actually used.
   *
   * See https://leafletjs.com/reference-1.6.0.html#path
   */
  path: leafletPathType,
  /**
   * This represents data about a route as obtained from a transit index.
   * Typically a route has more data than these items, so this is only a list of
   * the properties that this component actually uses.
   */
  routeData: PropTypes.shape({
    color: PropTypes.string,
    patterns: PropTypes.objectOf(
      PropTypes.shape({
        geometry: encodedPolylineType,
        id: PropTypes.string.isRequired,
      }).isRequired
    ),
  }),
};

RouteViewerOverlay.defaultProps = {
  path: {
    color: "#00bfff",
    opacity: 1,
    weight: 4,
  },
};

export default withLeaflet(RouteViewerOverlay);
