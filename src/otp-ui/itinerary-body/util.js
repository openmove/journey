import { getMapColor, getContrastYIQ } from "../core-utils/itinerary";
/**
 * the GTFS spec indicates that the route color should not have a leading hash
 * symbol, so add one if the routeColor exists and doesn't start with a hash
 * symbol.
 */
export const toSafeRouteColor = routeColor => {
  return (
    routeColor && (routeColor.startsWith("#") ? routeColor : `#${routeColor}`)
  );
};

export const getRouteColor = (mode, routeColor) => {
  return routeColor ? `#${routeColor}` : getMapColor(mode)  /* || defaultRouteColor  */;
};

export const getRouteTextColor = (mode, backgroundColor, textColor) => {
  const contrastColor = getContrastYIQ(backgroundColor);
  // const defaultRouteTextColor =
  let color = textColor ? textColor : contrastColor /* || defaultRouteTextColor */;
  color = toSafeRouteColor(color);

  return color;
};

export const toModeColor = (mode, routeColor) => {
  switch (mode) {
    case "WALK":
      return `#e9e9e9`;
    case "BICYCLE":
    case "BICYCLE_RENT":
      return `red`;
    case "CAR":
      return `grey`;
    case "MICROMOBILITY":
    case "MICROMOBILITY_RENT":
      return `#f5a729`;
    default:
      return toSafeRouteColor(routeColor) || "#095980";
  }
};

export const toModeBorderColor = (mode, routeColor) => {
  switch (mode) {
    case "WALK":
      return `#484848`;
    case "BICYCLE":
    case "BICYCLE_RENT":
      return `red`;
    case "CAR":
      return `grey`;
    case "MICROMOBILITY":
    case "MICROMOBILITY_RENT":
      return `#f5a729`;
    default:
      return toSafeRouteColor(routeColor) || "#095980";
  }
};

export const toModeBorder = (mode, routeColor) => {
  switch (mode) {
    case "WALK":
    case "BICYCLE":
    case "BICYCLE_RENT":
    case "CAR":
    case "MICROMOBILITY":
    case "MICROMOBILITY_RENT":
      return `dotted 4px ${toModeBorderColor(mode, routeColor)}`;
    default:
      return `solid 8px ${toModeBorderColor(mode, routeColor)}`;
  }
};
