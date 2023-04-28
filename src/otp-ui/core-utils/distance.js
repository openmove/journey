

export function distance(lat1, lon1, lat2, lon2) {
  const deg2rad = deg => deg * (Math.PI/180);
  let R = 6371 * 1000
    , dLat = deg2rad(lat2-lat1)
    , dLon = deg2rad(lon2-lon1)
    , a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon/2) * Math.sin(dLon/2)
    , c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    , d = R * c;
  return d;
}

export function humanizeDistanceStringImperial(meters, abbreviate) {
  const feet = meters * 3.28084;
  if (feet < 528) {
    return Math.round(feet) + (abbreviate === true ? " ft" : " feet");
  }
  return Math.round(feet / 528) / 10 + (abbreviate === true ? " mi" : " miles");
}

export function humanizeDistanceStringMetric(meters) {
  let km = meters / 1000;
  if (km > 100) {
    // 100 km => 999999999 km
    km = km.toFixed(0);
    return `${km} km`;
  }
  if (km > 1) {
    // 1.1 km => 99.9 km
    km = km.toFixed(1);
    return `${km} km`;
  }
  // 1m => 999m
  return `${meters.toFixed(0)} m`;
}

export function humanizeDistanceString(meters, outputMetricUnits = true) {
  return outputMetricUnits
    ? humanizeDistanceStringMetric(meters)
    : humanizeDistanceStringImperial(meters);
}

export function polylineLength(locs = []) {
  var len = 0;
  for (var i = 0; i < locs.length - 1; i++) {
    len += distance(locs[i][0],locs[i][1], locs[i + 1][0], locs[i + 1][1]);
  }
  return len;
}
