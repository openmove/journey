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
import { getRouteColor } from '../../otp-ui/itinerary-body/util'

class TripViewer extends Component {
  static propTypes = {
    hideBackButton: PropTypes.bool,
    tripData: PropTypes.object,
    viewedTrip: PropTypes.object
  }

  constructor(props){
    super(props);
    this.firstStopRef = React.createRef()
  }

  _backClicked = () => {
    this.props.setViewedTrip(null)
  }

  findTripData(prevViewedTrip){
    const { findTrip, viewedTrip } = this.props
    const { tripId,fromIndex, toIndex } = viewedTrip

    if(prevViewedTrip){
      const { tripId:prevTripId,
              fromIndex:prevFromIndex,
              toIndex:prevToIndex
            } = prevViewedTrip
      if( tripId === prevTripId &&
          fromIndex === prevFromIndex &&
          toIndex === prevToIndex){
            return;
        }
    }
    findTrip({ tripId })
  }

  componentDidMount () {
    this.findTripData(undefined)
  }

  componentDidUpdate(prevProps){
    this.findTripData(prevProps.viewedTrip)
    if (this.props.scrollToView && this.firstStopRef.current) {
      this.firstStopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }

  render () {
    const {
      hideBackButton,
      languageConfig,
      timeFormat,
      tripData,
      viewedTrip,
      showFares,
      t
    } = this.props
    const route = tripData?.route
    let fareUrl = route?.agency?.fareUrl

    // handle starting and destination points for openmove app
    // :hammer: maybe in the future would be useful to implement a parameter server side
    if(fareUrl === "https://app.openmove.com" && tripData?.stopTimes && tripData?.stops){
        // tripData and stops are not valued from the start
        // add starting and destination points
        const {fromIndex,toIndex} = viewedTrip;
        if(fromIndex == null || toIndex == null){
          console.error('fromIndex or toIndex not defined')
        }
        // origin stop
        const {'stopId':originStopId} = tripData.stopTimes.find(({stopIndex})=> stopIndex===fromIndex);
        const originStop = tripData.stops.find(stop => stop.id === originStopId)

        // destination stop
        const {'stopId':destinationStopId} = tripData.stopTimes.find(({stopIndex})=> stopIndex===toIndex);
        const destinationStop = tripData.stops.find(stop => stop.id === destinationStopId)

        const isOriginDefined = originStop.lat && originStop.lon
        const areSameOriginDestination = fromIndex === toIndex
        const isDestinationDefined = destinationStop.lat && destinationStop.lon && !areSameOriginDestination

        const originParameter =  isOriginDefined ? `lat=${originStop.lat}&lng=${originStop.lon}&` : undefined
        const destinationParameter =  isDestinationDefined ? `destinationLat=${destinationStop.lat}&destinationLng=${destinationStop.lon}&destinationLabel=${encodeURIComponent(destinationStop.name)}` : undefined

        const query = `/tickets?${isOriginDefined?originParameter:''}${isDestinationDefined?destinationParameter:''}`
        fareUrl+=query;
      }

    // determine highlight color
    const routeColor =  route?.color
    const mode = route?.type

    const highlightColor = getRouteColor(mode,routeColor)

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
            <div className='trip-header'>
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
              { showFares && fareUrl && (
                  <Button bsStyle="primary" className="mt-1" href={fareUrl} rel="noopener noreferrer" target="_blank" bsSize='small'>
                    {t('buy_ticket')}
                    {/* {logoUrl && (
                    <img alt={`${agencyName} logo`} src={logoUrl} height={20} style={{marginLeft: 8}}/>
                    )} */}
                  </Button>
                )
              }
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
              if (viewedTrip.fromIndex==null && viewedTrip.toIndex==null) highlightClass = '' //TODO: find stops based on time?
              else if (i === viewedTrip.fromIndex && i === viewedTrip.toIndex) highlightClass = 'strip-map-highlight-unique'
              else if (i === viewedTrip.fromIndex) highlightClass = 'strip-map-highlight-first'
              else if (i > viewedTrip.fromIndex && i < viewedTrip.toIndex) highlightClass = 'strip-map-highlight'
              else if (i === viewedTrip.toIndex) highlightClass = 'strip-map-highlight-last'

              return (
                <div
                  key={i}
                  ref={
                        viewedTrip.fromIndex &&
                        i===viewedTrip.fromIndex &&
                        i!==0 ?
                        this.firstStopRef : undefined
                    }
                  style={{scrollMarginTop:'100px'}}
                >
                  {/* the departure time */}
                  <div className='stop-time'>
                    {coreUtils.time.formatSecondsAfterMidnight(tripData.stopTimes[i].scheduledDeparture, timeFormat)}
                  </div>

                  {/* the vertical strip map */}
                  <div className='strip-map-container'>
                    { highlightClass && <div className={highlightClass} style={{backgroundColor:highlightColor}}/> }
                    <div className={stripMapLineClass} />
                    <div className='strip-map-icon'><Icon type='circle' /></div>
                  </div>

                  {/* the stop-viewer button */}
                  <div className='stop-button-container'>
                    <ViewStopButton stopId={stop.id} text={t('view')} />
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
    showFares: state.otp.config.trip.showFares,
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
