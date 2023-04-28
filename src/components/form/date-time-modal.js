import coreUtils from '../../otp-ui/core-utils'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { setQueryParam } from '../../actions/form'
import { DateTimeSelector } from '../../otp-ui/trip-form'

class DateTimeModal extends Component {
  static propTypes = {
    setQueryParam: PropTypes.func
  }

  render () {
    const {
      date,
      dateFormatLegacy,
      departArrive,
      setQueryParam,
      time,
      timeFormatLegacy
    } = this.props

    return (
      <DateTimeSelector
        className='date-time-selector'
        date={date}
        departArrive={departArrive}
        onQueryParamChange={setQueryParam}
        time={time}
        // These props below are for Safari on MacOS, and legacy browsers
        // that don't support `<input type="time|date">`.
        // These props are not relevant in modern browsers,
        // where `<input type="time|date">` already
        // formats the time|date according to the OS settings.
        dateFormatLegacy={dateFormatLegacy}
        timeFormatLegacy={timeFormatLegacy}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { departArrive, date, time } = state.otp.currentQuery
  const config = state.otp.config
  return {
    config,
    departArrive,
    date,
    time,
    // These props below are for legacy browsers (see render method above).
    timeFormatLegacy: coreUtils.time.getTimeFormat(config),
    dateFormatLegacy: coreUtils.time.getDateFormat(config)
  }
}

const mapDispatchToProps = {
  setQueryParam
}

export default connect(mapStateToProps, mapDispatchToProps)(DateTimeModal)
