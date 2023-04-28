import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button } from 'react-bootstrap'
import { connect } from 'react-redux'
import { withNamespaces } from "react-i18next"

import { setMainPanelContent, setViewedStop } from '../../actions/ui'

class ViewStopButton extends Component {
  static propTypes = {
    stopId: PropTypes.string,
    text: PropTypes.string
  }

  _onClick = () => {
    this.props.setMainPanelContent(null)
    this.props.setViewedStop({stopId: this.props.stopId})
  }

  render () {
    const { t } = this.props

    return (
      <Button
        bsSize='xsmall'
        className='view-stop-button'
        onClick={this._onClick}
      >{this.props.text || t('stop')}</Button>
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
  setViewedStop
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(ViewStopButton))
