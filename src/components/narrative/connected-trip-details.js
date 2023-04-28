import coreUtils from '../../otp-ui/core-utils'
import TripDetailsBase from '../../otp-ui/trip-details'
import { connect } from 'react-redux'
import styled from 'styled-components'

const TripDetails = styled(TripDetailsBase)`
  b {
    font-weight: 600;
  }
`

// Connect imported TripDetails class to redux store.

const mapStateToProps = (state, ownProps) => {
  return {
    messages: state.otp.config.language.tripDetails,
    routingType: state.otp.currentQuery.routingType,
    tnc: state.otp.tnc,
    timeOptions: {
      format: coreUtils.time.getTimeFormat(state.otp.config)
    },
    longDateFormat: coreUtils.time.getLongDateFormat(state.otp.config)
  }
}

export default connect(mapStateToProps)(TripDetails)
