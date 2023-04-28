import coreUtils from '../../otp-ui/core-utils'
import TransitiveCanvasOverlay from '../../otp-ui/overlay-transitive'
import { connect } from 'react-redux'

import { getActiveSearch, getActiveItinerary, getActiveItineraries } from '../../util/state'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const activeSearch = getActiveSearch(state.otp)
  let transitiveData = null
  if (
    activeSearch &&
    activeSearch.query.routingType === 'ITINERARY' &&
    activeSearch.response &&
    activeSearch.response.length > 0
  ) {
    // FIXME: This may need some simplification.
    const itins = getActiveItineraries(state.otp)
    const visibleIndex = activeSearch.visibleItinerary !== undefined && activeSearch.visibleItinerary !== null
      ? activeSearch.visibleItinerary
      : activeSearch.activeItinerary
    // TODO: prevent itineraryToTransitive() from being called more than needed
    const visibleItinerary = itins[visibleIndex] ? itins[visibleIndex] : getActiveItinerary(state.otp)
    if (visibleItinerary) transitiveData = coreUtils.map.itineraryToTransitive(visibleItinerary)
  } else if (
    activeSearch &&
    activeSearch.response &&
    activeSearch.response.otp
  ) {
    transitiveData = activeSearch.response.otp
  }

  return {
    activeItinerary: activeSearch && activeSearch.activeItinerary,
    routingType: activeSearch && activeSearch.query && activeSearch.query.routingType,
    transitiveData,
    visible: true
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(TransitiveCanvasOverlay)
