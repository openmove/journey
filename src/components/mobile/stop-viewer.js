import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withNamespaces } from 'react-i18next'

import MobileContainer from './container'
import MobileNavigationBar from './navigation-bar'

import StopViewer from '../viewers/stop-viewer'
import DefaultMap from '../map/default-map'

import { setViewedStop } from '../../actions/ui'

class MobileStopViewer extends Component {
  static propTypes = {
    setViewedStop: PropTypes.func
  }

  render () {
    const { t } = this.props

    return (
      <MobileContainer>
        <MobileNavigationBar
          headerText={t('stop')}
          showBackButton
          onBackClicked={() => { this.props.setViewedStop(null) }}
        />

        {/* include map as fixed component */}
        <div className='viewer-map'>
          <DefaultMap />
        </div>

        {/* include StopViewer in embedded scrollable panel */}
        <div className='viewer-container'>
          <StopViewer hideBackButton />
        </div>
      </MobileContainer>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    languageConfig: state.otp.config.language
  }
}

const mapDispatchToProps = {
  setViewedStop
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(MobileStopViewer))
