import React, { Component } from 'react'
import { connect } from 'react-redux'
import StopsOverlay from '../../otp-ui/overlays/stops'
import StopMarker from './connected-stop-marker'

import { findStopsWithinBBox } from '../../actions/api'

class ConnectedStopsOverlay extends Component {
  constructor (props) {
    super(props)
    this.state = { visible: props.visible }
  }

  componentDidMount () {
    this.props.registerOverlay(this)
  }

  onOverlayAdded = () => {
    this.setState({ visible: true })
  }

  onOverlayRemoved = () => {
    this.setState({ visible: false })
  }

  render () {
    return (
      <>
        <StopsOverlay {...this.props} visible={this.state.visible} />
      </>
    )
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  return {
    StopMarker,
    stops: state.otp.overlay.transit.stops
  }
}

const mapDispatchToProps = {
  refreshStops: findStopsWithinBBox
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedStopsOverlay)
