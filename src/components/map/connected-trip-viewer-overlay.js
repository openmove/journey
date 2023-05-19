import { getRouteColor } from '../../otp-ui/itinerary-body/util'
import TripViewerOverlay from '../../otp-ui/overlay-trip-viewer'
import { connect } from 'react-redux'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const viewedTrip = state.otp.ui?.viewedTrip
  // const routeColor = state.otp.transitIndex?.trips[viewedTrip?.tripId]?.route?.mode?.route?.color

  // const color = getRouteColor(routeColor)
  // TODO: overwrite default color with route specific one if present
  const style = state?.otp?.config?.trip?.style
 /*  if(color){
    style.color = color;
  }
 */
  return {
    style,
    tripData: viewedTrip
      ? state.otp.transitIndex.trips[viewedTrip.tripId]
      : null
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(TripViewerOverlay)
