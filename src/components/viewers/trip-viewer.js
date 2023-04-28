import coreUtils from '../../otp-ui/core-utils'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Button, Label } from 'react-bootstrap'
import { connect } from 'react-redux'
import { withNamespaces } from "react-i18next"

import Icon from '../narrative/icon'
import ViewStopButton from './view-stop-button'

import { setViewedTrip } from '../../actions/ui'
import { findTrip } from '../../actions/api'
import { setLocation } from '../../actions/map'

class TripViewer extends Component {
  static propTypes = {
    hideBackButton: PropTypes.bool,
    tripData: PropTypes.object,
    viewedTrip: PropTypes.object
  }

  _backClicked = () => {
    this.props.setViewedTrip(null)
  }

  componentDidMount () {
    const { findTrip, viewedTrip } = this.props
    const { tripId } = viewedTrip
    findTrip({ tripId })
  }

  render () {
    const {
      hideBackButton,
      languageConfig,
      timeFormat,
      tripData,
      viewedTrip,
      t
    } = this.props

    return (
      <div className='trip-viewer'>
        {/* Header Block */}
        <div className='trip-viewer-header'>
          {/* Back button */}
          {!hideBackButton && (
            <div className='back-button-container'>
              <Button
                bsSize='small'
                onClick={this._backClicked}
              ><Icon type='arrow-left' />{t('back')}</Button>
            </div>
          )}

          {/* Header Text */}
          <div className='header-text'>
            {t('trip_viewer')}
          </div>
          <div style={{ clear: 'both' }} />
        </div>

        <div className='trip-viewer-body'>
          {/* Basic Trip Info */}
          {tripData && (
            <div>
              {/* Route name */}
              <div>{t('route')}: <b>{tripData.route.shortName}</b> {tripData.route.longName}</div>

              {/* Wheelchair/bike accessibility badges, if applicable */}
              <h4>
                {tripData.wheelchairAccessible === 1 &&
                  <Label bsStyle='primary'>
                    <Icon type='wheelchair-alt' /> {t('available')}
                  </Label>
                }
                {' '}
                {tripData.bikesAllowed === 1 &&
                  <Label bsStyle='success'>
                    <Icon type='bicycle' /> {t('allowed')}
                  </Label>
                }
              </h4>
            </div>
          )}

          {/* Stop Listing */}
          {tripData && tripData.stops && tripData.stopTimes && (
            tripData.stops.map((stop, i) => {
              // determine whether to use special styling for first/last stop
              let stripMapLineClass = 'strip-map-line'
              if (i === 0) stripMapLineClass = 'strip-map-line-first'
              else if (i === tripData.stops.length - 1) stripMapLineClass = 'strip-map-line-last'

              // determine whether to show highlight in strip map
              let highlightClass
              if (i === viewedTrip.fromIndex) highlightClass = 'strip-map-highlight-first'
              else if (i > viewedTrip.fromIndex && i < viewedTrip.toIndex) highlightClass = 'strip-map-highlight'
              else if (i === viewedTrip.toIndex) highlightClass = 'strip-map-highlight-last'

              return (
                <div key={i}>
                  {/* the departure time */}
                  <div className='stop-time'>
                    {coreUtils.time.formatSecondsAfterMidnight(tripData.stopTimes[i].scheduledDeparture, timeFormat)}
                  </div>

                  {/* the vertical strip map */}
                  <div className='strip-map-container'>
                    { highlightClass && <div className={highlightClass} /> }
                    <div className={stripMapLineClass} />
                    <div className='strip-map-icon'><Icon type='circle' /></div>
                  </div>

                  {/* the stop-viewer button */}
                  <div className='stop-button-container'>
                    <ViewStopButton stopId={stop.id} text='View' />
                  </div>

                  {/* the main stop label */}
                  <div className='stop-name'>
                    {stop.name}
                  </div>

                  <div style={{ clear: 'both' }} />

                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const viewedTrip = state.otp.ui.viewedTrip
  return {
    languageConfig: state.otp.config.language,
    timeFormat: coreUtils.time.getTimeFormat(state.otp.config),
    tripData: state.otp.transitIndex.trips[viewedTrip.tripId],
    viewedTrip
  }
}

const mapDispatchToProps = {
  setViewedTrip,
  findTrip,
  setLocation
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(TripViewer))
