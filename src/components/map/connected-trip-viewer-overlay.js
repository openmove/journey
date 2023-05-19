import { getRouteColor } from '../../otp-ui/itinerary-body/util'
import TripViewerOverlay from '../../otp-ui/overlay-trip-viewer'
import { connect } from 'react-redux'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const viewedTrip = state.otp.ui?.viewedTrip
  const route = state.otp.transitIndex?.trips[viewedTrip?.tripId]?.route
  const routeColor =  route?.color
  const mode = route?.type

  const color = getRouteColor(mode,routeColor)
  // overwrite default color with route specific one if present
  const style = state?.otp?.config?.trip?.style
  if(color){
    style.color = color;
  }

  return {
    style,
    tripData: viewedTrip
      ? state.otp.transitIndex.trips[viewedTrip.tripId]
      : null
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(TripViewerOverlay)
