import EndpointsOverlay from '../../otp-ui/overlay-endpoints'
import { connect } from 'react-redux'

import {
  clearLocation,
  forgetPlace,
  rememberPlace,
  setLocation
} from '../../actions/map'
import { getActiveSearch, getShowUserSettings } from '../../util/state'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  // Use query from active search (if a search has been made) or default to
  // current query is no search is available.
  const activeSearch = getActiveSearch(state.otp)
  const query = activeSearch ? activeSearch.query : state.otp.currentQuery
  const showUserSettings = getShowUserSettings(state.otp)
  const { from, to } = query
  // Intermediate places doesn't trigger a re-plan, so for now default to
  // current query. FIXME: Determine with TriMet if this is desired behavior.
  const places = state.otp.currentQuery.intermediatePlaces.filter(p => p)
  return {
    fromLocation: from,
    intermediatePlaces: places,
    locations: state.otp.user.locations,
    showUserSettings,
    toLocation: to,
    visible: true
  }
}

const mapDispatchToProps = {
  forgetPlace,
  rememberPlace,
  setLocation,
  clearLocation
}

export default connect(mapStateToProps, mapDispatchToProps)(EndpointsOverlay)
