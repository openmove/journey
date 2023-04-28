import coreUtils from '../../otp-ui/core-utils'
import LocationIcon from '../../otp-ui/location-icon'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { Button, Col, Row, Grid } from 'react-bootstrap'
import { connect } from 'react-redux'
import { withNamespaces } from 'react-i18next'
import styled from 'styled-components'

import DefaultMap from '../map/default-map'
import ErrorMessage from '../form/error-message'
import ItineraryCarousel from '../narrative/itinerary-carousel'

import MobileContainer from './container'
import MobileNavigationBar from './navigation-bar'

import { MobileScreens, setMobileScreen } from '../../actions/ui'
import { setUseRealtimeResponse } from '../../actions/narrative'
import { clearActiveSearch } from '../../actions/form'
import { getActiveItineraries, getActiveSearch, getRealtimeEffects } from '../../util/state'

class MobileResultsScreen extends Component {
  static propTypes = {
    activeItineraryIndex: PropTypes.number,
    map: PropTypes.element,
    query: PropTypes.object,
    resultCount: PropTypes.number,

    setMobileScreen: PropTypes.func
  }

  constructor () {
    super()
    this.state = {
      expanded: false
    }
  }

  componentDidMount () {
    // Get the target element that we want to persist scrolling for
    // FIXME Do we need to add something that removes the listeners when
    // component unmounts?
    coreUtils.ui.enableScrollForSelector('.mobile-narrative-container')
  }

  componentDidUpdate (prevProps) {
    // Check if the active leg changed
    if (this.props.activeLeg !== prevProps.activeLeg) {
      this._setExpanded(false)
    }
  }

  _setExpanded (expanded) {
    this.setState({ expanded })
    this.refs['narrative-container'].scrollTop = 0
  }

  _editSearchClicked = () => {
    this.props.clearActiveSearch()
    this.props.setMobileScreen(MobileScreens.SEARCH_FORM)
  }

  _optionClicked = () => {
    this._setExpanded(!this.state.expanded)
  }

  _toggleRealtime = () => this.props.setUseRealtimeResponse({useRealtime: !this.props.useRealtime})

  render () {
    const {
      activeItineraryIndex,
      error,
      itineraryClass,
      itineraryFooter,
      LegIcon,
      query,
      realtimeEffects,
      resultCount,
      useRealtime,
      t
    } = this.props
    const { expanded } = this.state

    const narrativeContainerStyle = expanded
      ? { top: 140, overflowY: 'auto' }
      : { height: 80, overflowY: 'hidden' }

    // Ensure that narrative covers map.
    narrativeContainerStyle.backgroundColor = 'white'

    let headerAction = null
    const showRealtimeAnnotation = realtimeEffects.isAffectedByRealtimeData && (
      realtimeEffects.exceedsThreshold ||
      realtimeEffects.routesDiffer ||
      !useRealtime
    )

    /* Old navbar alert
    if (showRealtimeAnnotation) {
      headerAction = (
        <RealtimeAnnotation
          componentClass='popover'
          toggleRealtime={this._toggleRealtime}
          realtimeEffects={realtimeEffects}
          useRealtime={useRealtime}
        />
      )
    */

    const locationsSummary = (
      <div className="location-summary-container">
        <Grid>
          <Row>
            <Col xs={8} sm={11}>
              <div className="location-summary-item">
                <LocationIcon type='from' /> { query.from ? query.from.name : '' }
              </div>
              <div className="location-summary-item">
                <LocationIcon type='to' /> { query.to ? query.to.name : '' }
              </div>
            </Col>
            <Col xs={4} sm={1}>
              <div className="text-right">
                <Button
                  bsStyle="link"                
                  onClick={this._editSearchClicked}
                >{t('edit')}</Button>
              </div> 
            </Col>
          </Row>
        </Grid>
      </div>
    )

    if (error) {
      return (
        <MobileContainer>
          <MobileNavigationBar headerText='Nessun viaggio trovato' />
          {locationsSummary}
          <div className='results-error-map'><DefaultMap /></div>
          <div className='results-error-message'>
            <ErrorMessage error={error} />
            <div className='options-lower-tray p-1'>
              <Button className='back-to-search-button' onClick={this._editSearchClicked} style={{ width: '100%' }}>
                <i className='fa fa-arrow-left' /> {t('back_to_search')}
              </Button>
            </div>
          </div>
        </MobileContainer>
      )
    }

    // Construct the 'dots'
    const dots = []
    for (let i = 0; i < resultCount; i++) {
      dots.push(<div key={i} className={`dot${activeItineraryIndex === i ? ' active' : ''}`} />)
    }

    return (
      <MobileContainer>
        <MobileNavigationBar
          headerText={resultCount
            ? `${t('found')} ${resultCount} ${t(resultCount > 1 ? 'options' : 'option')}`
            : `${t('wait')}...`
          }
          headerAction={headerAction}
        />
        {locationsSummary}

        <div className='results-map'>
          {this.props.map}
        </div>

        <div
          className='mobile-narrative-header'
          style={{ bottom: expanded ? null : 100, top: expanded ? 100 : null }}
          onClick={this._optionClicked}
        >
          {t('option')} {activeItineraryIndex + 1}
          <i className={`fa fa-caret-${expanded ? 'down' : 'up'}`} style={{ marginLeft: 8 }} />
        </div>

        <div
          ref='narrative-container'
          className='mobile-narrative-container'
          style={narrativeContainerStyle}
        >
          <ItineraryCarousel
            itineraryClass={itineraryClass}
            itineraryFooter={itineraryFooter}
            hideHeader
            expanded={this.state.expanded}
            onClick={this._optionClicked}
            showRealtimeAnnotation={showRealtimeAnnotation}
            LegIcon={LegIcon}
          />
        </div>

        <div className='dots-container' style={{ padding: 'none' }}>{dots}</div>
      </MobileContainer>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const activeSearch = getActiveSearch(state.otp)
  const {useRealtime} = state.otp
  const response = !activeSearch
    ? null
    : useRealtime ? activeSearch.response : activeSearch.nonRealtimeResponse

  const realtimeEffects = getRealtimeEffects(state.otp)
  const itineraries = getActiveItineraries(state.otp)
  return {
    query: state.otp.currentQuery,
    realtimeEffects,
    error: response && response.error,
    resultCount:
      response
        ? activeSearch.query.routingType === 'ITINERARY'
          ? itineraries.length
          : response.otp.profile.length
        : null,
    useRealtime,
    activeItineraryIndex: activeSearch ? activeSearch.activeItinerary : null,
    activeLeg: activeSearch ? activeSearch.activeLeg : null
  }
}

const mapDispatchToProps = {
  clearActiveSearch,
  setMobileScreen,
  setUseRealtimeResponse
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(MobileResultsScreen))
