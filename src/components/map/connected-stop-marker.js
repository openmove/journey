import DefaultStopMarker from '../../otp-ui/overlays/stops/stop-marker'
import { connect } from 'react-redux'

import { setLocation } from '../../actions/map'
import { setViewedStop } from '../../actions/ui'

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    languageConfig: state.otp.config.language,
    overlayStopConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'stops')[0],
  }
}

const mapDispatchToProps = {
  setLocation,
  setViewedStop
}

export default connect(mapStateToProps, mapDispatchToProps)(DefaultStopMarker)
