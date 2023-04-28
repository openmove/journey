import StopViewerOverlay from '../../otp-ui/selected-stop-viewer'
import DefaultStopMarker from '../../otp-ui/selected-stop-viewer/default-stop-marker'
import { connect } from 'react-redux'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const viewedStop = state.otp.ui.viewedStop
  return {
    stop: viewedStop
      ? state.otp.transitIndex.stops[viewedStop.stopId]
      : null,
    StopMarker: DefaultStopMarker
  }
}

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(StopViewerOverlay)
