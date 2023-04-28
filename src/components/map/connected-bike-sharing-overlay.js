import BikeSharingOverlay from '../../otp-ui/overlays/bike-sharing'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { setLocation } from '../../actions/map'

class ConnectedBikeSharingOverlay extends Component {
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
        <BikeSharingOverlay {...this.props} visible={this.state.visible} />
      </>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    configCompanies: state.otp.config.companies,
    overlayBikeSharingConf: state.otp?.config?.map?.overlays?.filter(item => item.type === 'bike-rental')[0],
    zoom: state.otp.config.map.initZoom
  }
}

const mapDispatchToProps = {
  setLocation
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedBikeSharingOverlay)
