import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { withNamespaces } from "react-i18next"

import { setMainPanelContent, setViewedTrip } from '../../actions/ui'

class ViewTripButton extends Component {
  static propTypes = {
    fromIndex: PropTypes.number,
    tripId: PropTypes.string,
    text: PropTypes.string,
    toIndex: PropTypes.number
  }

  _onClick = () => {
    const {setMainPanelContent, tripId, fromIndex, toIndex} = this.props

    this.props.setMainPanelContent(null)
    this.props.setViewedTrip({
      tripId,
      fromIndex,
      toIndex,
    })
  }

  render () {
    const { t } = this.props

    return (
      <Button
        bsSize='xsmall'
        className='view-trip-button'
        onClick={this._onClick}
      >{this.props.text || (t('trip_viewer'))}</Button>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    languageConfig: state.otp.config.language
  }
}

const mapDispatchToProps = {
  setMainPanelContent,
  setViewedTrip
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(ViewTripButton))
