import {
  isBikeshareStation,
  isCarWalkTransition,
  isEScooterStation
} from "../core-utils/map";
import CONFIG from '../../../src/config.yml'
const stylesConfig = CONFIG.transit.style

const STYLES = {};

function getSegmentStyle(segment) {
  switch (segment.type) {
    case "WALK":
      return 'is-walk';
    case "BICYCLE":
    case "BICYCLE_RENT":
      return 'is-bicycle';
    case "CAR":
      return 'is-car';
    case "MICROMOBILITY":
    case "MICROMOBILITY_RENT":
      return 'is-micromobility';
    default:
      return 'is-transit';
  }
}
/**
 * Transitive style overrides for places (basically any point that isn't a
 * transit stop)
 *
 * This style rule draws nothing except when a bikeshare station or e-scooter
 * station is encountered.
 *
 * The from/to locations are drawn outside of transitive and there are separate
 * renderers for transit stops.
 */
const placeConfig = stylesConfig.places
STYLES.places = {
  display: (display, place) =>
    isBikeshareStation(place) ||
    isEScooterStation(place) ||
    isCarWalkTransition(place)
      ? true
      : "none",
  fill: (display, place) => {
    const placeFill = placeConfig.fill

    if (isBikeshareStation(place)) {
      return placeFill?.bikeshare_station ||  placeFill.default;
    }
    if (isCarWalkTransition(place)) {
      return placeFill?.car_walk_transition || placeFill.default;
    }
    if (isEScooterStation(place)) {
      return placeFill?.e_scooter_station ||  placeFill.default;
    }
    return placeFill.default;
  },
  stroke: placeConfig.fill,
  "stroke-width": placeConfig.stroke_width,
  r: placeConfig.radius
};

/**
 * Transitive style overrides for transit stops. All this does is sets the
 * radius to 6 pixels.
 */
const stopMergedConfig = stylesConfig.stops_merged
STYLES.stops_merged = {
  r() {
    return stopMergedConfig.radius;
  },
  stroke: function() {
    return stopMergedConfig.stroke;
  },
};

const style = {
  fill: [stylesConfig.fill, function(display, segment) {
    if (segment.type ==='TRANSIT'){
      return segment?.patterns?.[0]?.route.getColor();
    }
  }],
  color:[ stylesConfig.color, function(display, segment) {
    if (segment.type ==='TRANSIT'){
      return segment?.patterns?.[0]?.route.getTextColor();
    }
  }],
  stroke: [stylesConfig.stroke, function(display, segment) {

    if (segment.type ==='TRANSIT'){
      return segment?.patterns?.[0]?.route.getColor();
    }else if (segment.type === 'WALK') {
      return '#86cdf9'
    }
  }],
  background: [ stylesConfig.background,function(display, segment) {

    if (segment.type ==='TRANSIT'){
      return segment?.patterns?.[0]?.route.getColor();
    }
  }],
  "stroke-width": function(display, segment) {
    if (segment.type ==='TRANSIT')
      return stylesConfig.stroke_width;
  },
}

STYLES.segments = style;

STYLES.segment_label_containers = style;

STYLES.segment_labels = style;

STYLES.labels = style;

/*

possible customizations

wireframe_edges: wireframeEdges,
wireframe_vertices: wireframeVertices,
stops_merged: stopsMerged,
stops_pattern: stopsPattern,
places,
multipoints_merged: multipointsMerged,
multipoints_pattern: multipointsPattern,
labels,
segments,
segments_front: segmentsFront,
segments_halo: segmentsHalo,
segment_labels: segmentLabels,
segment_label_containers: segmentLabelContainers

DEFAULT VALUES/COLORS https://github.com/conveyal/transitive-demo/blob/master/styles.js
*/

export default STYLES;
