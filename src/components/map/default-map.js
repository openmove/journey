import BaseMap from '../../otp-ui/base-map'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { withNamespaces } from "react-i18next";
import { Util } from 'leaflet'

import {
  bikeRentalQuery,
  carRentalQuery,
} from '../../actions/api'
import { updateOverlayVisibility } from '../../actions/config'
import {
  setLocation,
  setMapPopupLocation,
  setMapPopupLocationAndGeocode
} from '../../actions/map'
import {setViewedTrail} from "../../actions/trails"

import BoundsUpdatingOverlay from './bounds-updating-overlay'
import EndpointsOverlay from './connected-endpoints-overlay'
import ParkAndRideOverlay from './connected-park-and-ride-overlay'
import RouteViewerOverlay from './connected-route-viewer-overlay'
//TODO maybe remove import StopViewerOverlay from './connected-stop-viewer-overlay'
import StopsOverlay from './connected-stops-overlay'
import TransitiveOverlay from './connected-transitive-overlay'
import TripViewerOverlay from './connected-trip-viewer-overlay'
import CarSharingOverlay from './connected-car-sharing-overlay'
import BikeSharingOverlay from './connected-bike-sharing-overlay'
//data layers
import TileOverlay from './overlay-tile'
import ParkingOverlay from '../../otp-ui/overlays/parking'
import DrtOverlay from '../../otp-ui/overlays/drt'
import ChargerOverlay from '../../otp-ui/overlays/charger'
import TrafficOverlay from '../../otp-ui/overlays/traffic'
import OverlayWebcam from '../../otp-ui/overlays/webcam'
import VmsOverlay from "../../otp-ui/overlays/vms"
import TrailsOverlay from '../../otp-ui/overlays/trails'
import ServiceareaOverlay from '../../otp-ui/overlays/servicearea'
import TrailsViewerOverlay from '../../otp-ui/overlay-trail-viewer'
import ContextualTrailsOverlay from '../../otp-ui/overlays/contextual-trails'
import LocationFilter from '../../otp-ui/location-filter'
import ElevationPointMarker from './elevation-point-marker'
import PointPopup from './point-popup'

import { storeItem, getItem } from '../../otp-ui/core-utils/storage'

const MapContainer = styled.div`
  height: 100%;
  width: 100%;

  .map {
    height: 100%;
    width: 100%;
  }

  * {
    box-sizing: unset;
  }
`

class DefaultMap extends Component {
  constructor(props) {
    super(props)

    this.state = {
      forceRefresh: false,
      overlayFilters: {},
      activeOverlayFilter: null,
      /*  state to keep track of open popups
      isPopupOpen:false, */
    }
  }

  // variable to keep track of open popups
  static isPopupOpen = false;

  /**
   * Checks whether the modes have changed between old and new queries and
   * whether to update the map overlays accordingly (e.g., to show rental vehicle
   * options on the map).
   */
  _handleQueryChange = (oldQuery, newQuery) => {
    const { overlays } = this.props
    if (overlays && oldQuery.mode) {
      // Determine any added/removed modes
      const oldModes = oldQuery.mode.split(',')
      const newModes = newQuery.mode.split(',')
      const removed = oldModes.filter(m => !newModes.includes(m))
      const added = newModes.filter(m => !oldModes.includes(m))
      const overlayVisibility = {}
      for (const oConfig of overlays) {
        if (!oConfig.modes || oConfig.modes.length !== 1) continue
        // TODO: support multi-mode overlays
        const overlayMode = oConfig.modes[0]

        if (
          (
            overlayMode === 'CAR_RENT' ||
            overlayMode === 'CAR_HAIL' ||
            overlayMode === 'MICROMOBILITY_RENT'
          ) &&
          oConfig.companies
        ) {
          // Special handling for company-based mode overlays (e.g. carshare, car-hail)
          const overlayCompany = oConfig.companies[0] // TODO: handle multi-company overlays
          if (added.includes(overlayMode)) {
            // Company-based mode was just selected; enable overlay iff overlay's company is active
            if (newQuery.companies.includes(overlayCompany)) overlayVisibility[oConfig.name] = true
          } else if (removed.includes(overlayMode)) {
            // Company-based mode was just deselected; disable overlay (regardless of company)
            overlayVisibility[oConfig.name] = false
          } else if (newModes.includes(overlayMode) && oldQuery.companies !== newQuery.companies) {
            // Company-based mode remains selected but companies change
            overlayVisibility[oConfig.name] = newQuery.companies.includes(overlayCompany)
          }
        } else { // Default handling for other modes
          if (added.includes(overlayMode)) overlayVisibility[oConfig.name] = true
          if (removed.includes(overlayMode)) overlayVisibility[oConfig.name] = false
        }
      }
      // Only trigger update action if there are overlays to update.
      if (Object.keys(overlayVisibility).length > 0) {
        this.props.updateOverlayVisibility(overlayVisibility)
      }
    }
  }

  onMapClick = (e) => {
    this.props.setViewedTrail(null);

    if(DefaultMap.isPopupOpen){
      const map = e.sourceTarget
      map.closePopup()
    } else {
      this.props.setMapPopupLocationAndGeocode(e)
    }
  }

  onPopupClose = (e) => {
    DefaultMap.isPopupOpen = false;
  }

  onPointPopupClose = () => {
    this.props.setMapPopupLocation({ location: null })
  }

  onPopupOpen = (e) => {
    DefaultMap.isPopupOpen = true;
  }

  onSetLocationFromPopup = (payload) => {
    const { setLocation, setMapPopupLocation } = this.props
    setMapPopupLocation({ location: null })
    setLocation(payload)
  }

  componentDidUpdate (prevProps) {
    // Check if any overlays should be toggled due to mode change
    this._handleQueryChange(prevProps.query, this.props.query)

    if (this.props.lng!== prevProps.lng) {
      this.setState({ forceRefresh: true })
      setTimeout(() => {
        this.setState({ forceRefresh: false })
      }, 50)
    }
  }

  onLocationFilterLoad = (type, filters) => {
    const overlayFilters = { ...this.state.overlayFilters };

    overlayFilters[type] = filters

    this.setState({ overlayFilters })
  }

  onLocationFilterChange = (overlay, group, name) => {
    const overlayFilters = { ...this.state.overlayFilters };

    overlayFilters[overlay][group].values.map(item => {
      if (item.value === name) {
        item.enabled = !item.enabled
        return
      }
    })

    this.setState({ overlayFilters })
  }

  onLocationFilterReset = overlay => {
    const overlayFilters = { ...this.state.overlayFilters }

    Object.keys(overlayFilters[overlay]).map(key => {
      overlayFilters[overlay][key].values.map(item => item.enabled = true)
    })

    this.setState({ overlayFilters })
  }

  render () {
    const {
      bikeRentalQuery,
      bikeRentalStations,
      carRentalQuery,
      carRentalStations,
      mapConfig,
      mapPopupLocation,
      version,
      hideAllControls,
      t
    } = this.props



    const center = mapConfig && mapConfig.initLat && mapConfig.initLon
      ? [mapConfig.initLat, mapConfig.initLon]
      : null

    const popup = mapPopupLocation && {
      contents: (
        <PointPopup
          mapPopupLocation={mapPopupLocation}
          onSetLocationFromPopup={this.onSetLocationFromPopup}
        />
      ),
      onPointPopupClose: this.onPointPopupClose,
      location: [mapPopupLocation.lat, mapPopupLocation.lon]
    }

    const storedOverlays = getItem('mapOverlayVisible') || []

    if (storedOverlays.length === 0) {
      this.props.mapConfig.overlays.map(item => {
        if (item.visible) {
          storedOverlays.push(this.props.t(item.name))
        }
      })

      storeItem('mapOverlayVisible', storedOverlays)
    }


    return (
      <>
        { !this.state.forceRefresh &&
            <MapContainer>
              <BaseMap
                baseLayers={mapConfig.baseLayers}
                center={center}
                maxZoom={mapConfig.maxZoom}
                onClick={this.onMapClick}
                popup={popup}
                // manually handle popup removal in onMapClick
                closePopupOnClick={false}
                zoomControl={false}
                // TODO zoomControl from config
                onPopupClose={this.onPopupClose}
                onPopupOpen={this.onPopupOpen}
                zoom={mapConfig.initZoom || 13}
                hideAllControls={hideAllControls}
                onLoad={() => {
                  document.querySelectorAll('.leaflet-control-layers-base label span').forEach(item => {
                    item.setAttribute('id', `${item.textContent.toLowerCase().trim().split(' ').join('-')}-layer-image`);
                  })
                }}
                defaultBaseLayerIndex={getItem('mapStyleIndex') || 0}
                onBaseLayerChange={e => {
                  if(e?.index>=0) {
                    storeItem('mapStyleIndex', e.index)
                  }
                }}
                onOverlayAdded={e => {
                  const visibleOverlays = getItem('mapOverlayVisible') || []

                  if (visibleOverlays.indexOf(e.name) === -1) {
                    visibleOverlays.push(e.name)
                    storeItem('mapOverlayVisible', visibleOverlays)
                  }
                }}
                onOverlayRemoved={e => {
                  const visibleOverlays = getItem('mapOverlayVisible') || []
                  const indexElement = visibleOverlays.indexOf(e.name)

                  if (indexElement !== -1) {
                    visibleOverlays.splice(indexElement, 1)
                    storeItem('mapOverlayVisible', visibleOverlays)
                  }
                }}
                onFilterLayerRequest={filterLayer => this.setState({ activeOverlayFilter: filterLayer })}
                onMoveEnd={e => {

                  const bb = e.target.getBounds()
                      , bounds = {
                        minLon: Util.formatNum(bb._southWest.lng, 5),
                        maxLon: Util.formatNum(bb._northEast.lng, 5),
                        minLat: Util.formatNum(bb._southWest.lat, 5),
                        maxLat: Util.formatNum(bb._northEast.lat, 5),
                      };
                  storeItem('mapBounds', bounds);
                  const center = e.target.getCenter();
                  storeItem('mapCenter', {lng:center.lng,lat:center.lat});
                  console.log('center',center.toString())
                }}
                onMoveStart={e => {
                  const cont = e.target.getContainer();
                  const ctrLayer = cont.querySelector('.leaflet-control-layers-expanded')
                  if (ctrLayer) {
                    ctrLayer.classList.remove("leaflet-control-layers-expanded");
                  }
                }}
                appVersionAttribution = {version ? ` | <a href="https://github.com/openmove/journey">App Version ${version}</a>` : ''}
                geocoderAttribution = {` ${t(this.props.geocoderAttribution)} `}
              >
                {/* The default overlays */}
                <BoundsUpdatingOverlay />
                {/*TODO maybe remove <StopViewerOverlay />*/}
                <EndpointsOverlay />
                <RouteViewerOverlay />
                <TrailsViewerOverlay />
                <ContextualTrailsOverlay/>
                <TransitiveOverlay />
                <TripViewerOverlay />
                <ElevationPointMarker />

                {mapConfig.overlays && mapConfig.overlays.map((overlayConfig, k) => {
                  switch (overlayConfig.type) {
                    case 'bike-rental': return (
                      <BikeSharingOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        refreshVehicles={bikeRentalQuery}
                        stations={bikeRentalStations}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'car-rental': return (
                      <CarSharingOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        refreshVehicles={carRentalQuery}
                        stations={carRentalStations}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'park-and-ride':
                      return (
                        <ParkAndRideOverlay
                          key={k}
                          {...overlayConfig}
                          visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                          name={t(overlayConfig.name)}
                          activeFilters={this.state.overlayFilters}
                        />
                      )
                    case 'stops': return (
                      <StopsOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                      />
                    )
                    case 'tile': return (
                      <TileOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                      />
                    )
                    case 'parking': return (
                      <ParkingOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        originalName={overlayConfig.name}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'drt': return (
                      <DrtOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                      />
                    )
                    case 'traffic': return (
                      <TrafficOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                      />

                    )
                    case 'charger': return (
                      <ChargerOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'webcam': return (
                      <OverlayWebcam
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'vms': return (
                      <VmsOverlay
                      key={k}
                      {...overlayConfig}
                      visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                      name={t(overlayConfig.name)}
                    />
                    )
                    case 'trails': return (
                      <TrailsOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    case 'servicearea': return (
                      <ServiceareaOverlay
                        key={k}
                        {...overlayConfig}
                        visible={storedOverlays.indexOf(t(overlayConfig.name)) !== -1}
                        name={t(overlayConfig.name)}
                        activeFilters={this.state.overlayFilters}
                      />
                    )
                    default: return null
                  }
                })}

              </BaseMap>
            </MapContainer>
        }

        {
          mapConfig.overlays && mapConfig.overlays.map((overlayConfig, k) => {
            if ((overlayConfig.filters || overlayConfig?.filtersCustom) && overlayConfig.filtersCustom?.enabled !== false) {
              return (
                <LocationFilter
                  key={k}
                  show={this.state.activeOverlayFilter === overlayConfig.type}
                  title={t(overlayConfig.name)}
                  filters={overlayConfig.filters}
                  filtersCustom={overlayConfig.filtersCustom}
                  onClose={() => this.setState({ activeOverlayFilter: null })}
                  onFiltersLoad={filters => this.onLocationFilterLoad(overlayConfig.type, filters)}
                  onChange={(group, value) => this.onLocationFilterChange(overlayConfig.type, group, value)}
                  onReset={() => this.onLocationFilterReset(overlayConfig.type)}
                />
              )
            }
          })
        }
      </>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  const overlays = state.otp.config.map && state.otp.config.map.overlays
    ? state.otp.config.map.overlays
    : []
  return {
    bikeRentalStations: state.otp.overlay.bikeRental.stations,
    carRentalStations: state.otp.overlay.carRental.stations,
    mapConfig: state.otp.config.map,
    mapPopupLocation: state.otp.ui.mapPopupLocation,
    overlays,
    query: state.otp.currentQuery,
    version: state.otp.config.version,
    geocoderAttribution: state.otp.config.geocoder.attribution
  }
}

const mapDispatchToProps = {
  bikeRentalQuery,
  carRentalQuery,
  setLocation,
  setMapPopupLocation,
  setMapPopupLocationAndGeocode,
  updateOverlayVisibility,
  setViewedTrail
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(DefaultMap))
