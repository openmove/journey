import CarSharingOverlay from '../../otp-ui/overlays/car-sharing'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { setLocation } from '../../actions/map'

class ConnectedCarSharingOverlay extends Component {
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
        <CarSharingOverlay {...this.props} visible={this.state.visible} />
      </>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    configCompanies: state.otp.config.companies,
    overlayCarSharingConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'car-rental')[0],
    zoom: state.otp.config.map.initZoom
  }
}

const mapDispatchToProps = {
  setLocation
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedCarSharingOverlay)
