import { divIcon } from "leaflet";
import memoize from "lodash.memoize";
import { getCompaniesLabelFromNetworks } from "../../core-utils/itinerary";
import { companyType, vehicleRentalMapOverlaySymbolsType, stationType} from "../../core-utils/types";
import FromToLocationPicker from "../../from-to-location-picker";
import PropTypes from "prop-types";
import React from "react";
import { withNamespaces } from "react-i18next"
import ReactDOMServer from "react-dom/server";
import { LayerGroup, Marker, MapLayer, Popup, withLeaflet} from "react-leaflet";

import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";
import {
  getCarModelImage,
  MapMarkerAlt,
  MarkerCarSharing,
  CarSharingIcon,
  BadgeIcon,
} from './assets'

import { addQueryParams } from "../../../util/query-params";
import { filterOverlay } from "../../core-utils/overlays";
import { getItem } from "../../core-utils/storage";

const getMarkerCarSharing = memoize((badgeCounter, overlayCarSharingConf ) => {
  let badgeType = (badgeCounter === 0) ? 'danger' : 'warning';

  if (badgeCounter > 1)
    badgeType = 'success';

  return divIcon({
    className: "",
    iconSize: [overlayCarSharingConf.iconWidth, overlayCarSharingConf.iconHeight],
    iconAnchor: [overlayCarSharingConf.iconWidth/2, overlayCarSharingConf.iconHeight],
    popupAnchor: [0, -overlayCarSharingConf.iconHeight],
    html: ReactDOMServer.renderToStaticMarkup(
      <BadgeIcon width={overlayCarSharingConf.iconWidth} type={badgeType}>
        <MarkerCarSharing
          width={overlayCarSharingConf.iconWidth}
          height={overlayCarSharingConf.iconHeight}
          iconColor={overlayCarSharingConf.iconColor}
          markerColor={overlayCarSharingConf.iconMarkerColor}
        />
      </BadgeIcon>
    )
  })
});

const getStationMarkerByColor = memoize(() =>
  divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
    html: ReactDOMServer.renderToStaticMarkup(
      <MapMarkerAlt width={20} height={20} />
    )
  })
);

/**
 * This vehicle rental overlay can be used to render vehicle rentals of various
 * types. This layer can be configured to show different styles of markers at
 * different zoom levels.
 */
class CarSharingOverlay extends MapLayer {
  createLeafletElement() {}

  updateLeafletElement() {}

  startRefreshing() {
    const { refreshVehicles, overlayCarSharingConf } = this.props;
    const bb =  getItem('mapBounds')
    const { map } = this.props.leaflet;
    // add query parameters to url
    const ApiUrl = this.props.api;
    const params = bb
    const url = addQueryParams(ApiUrl,params)

    // Create the timer only if refreshVehicles is a valid function.
    if (typeof refreshVehicles === "function") {
      // initial station retrieval
      refreshVehicles(url);
      if(overlayCarSharingConf.startCenter){
        map.flyTo(overlayCarSharingConf.startCenter);
      }
      // set up timer to refresh stations periodically
      this.refreshTimer = setInterval(() => {
        const ApiUrl = this.props.api;
        const params = bb
        const url = addQueryParams(ApiUrl,params)
        refreshVehicles(url);
      }, 30000); // defaults to every 30 sec. TODO: make this configurable?
    }
  }

  stopRefreshing() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  componentDidMount() {
    const { companies, mapSymbols, name, visible } = this.props;
    if (visible) this.startRefreshing();
    if (!mapSymbols)
      console.warn(`No map symbols provided for layer ${name}`, companies);
  }

  componentWillUnmount() {
    this.stopRefreshing();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.startRefreshing();
    } else if (prevProps.visible && !this.props.visible) {
      this.stopRefreshing();
    }
  }

  /**
   * Render some popup html for a station. This contains custom logic for
   * displaying rental vehicles in the TriMet MOD website that might not be
   * applicable to other regions.
   */
  renderPopupForStation = (station, stationIsHub = false) => {
    const { configCompanies, getStationName, setLocation, overlayCarSharingConf, t } = this.props;
    const stationName = getStationName(configCompanies, station);
    const location = {
      lat: station.y || station.lat,
      lon: station.x || station.lon,
      name: stationName
    };
    return (
      <Popup>
        <div className="otp-ui-mapOverlayPopup">
          {
            typeof station.isFloatingCar === 'boolean' &&
              <>
                <div className="otp-ui-mapOverlayPopup__popupHeader">
                  <CarSharingIcon width={26} height={22} />&nbsp;&nbsp;{t('carsharing')}
                </div>
                <div className="otp-ui-mapOverlayPopup__popupTitle">{stationName}</div>
                {
                  station.carsAvailable !== null &&
                    <>
                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoValue">{station.carsAvailable}</div>
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">{t('available_cars')}</div>
                      </div>
                    </>
                }
              </>
          }
          {
            station.type === 'carsharing-hub' &&
              <>
                <div className="otp-ui-mapOverlayPopup__popupHeader">
                  <CarSharingIcon width={26} height={22} />&nbsp;&nbsp;{t('carsharing')}
                </div>

                <div className="otp-ui-mapOverlayPopup__popupTitle">{stationName}</div>

                {
                  station.free !== null &&
                    <>
                      <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoValue">{station.free}</div>
                        <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">{t('available_cars')}</div>
                      </div>

                      <div className="otp-ui-mapOverlayPopup__popupAvailableSlots">
                      {
                        station.groupVehicles && station.groupVehicles.map( (groupVehicle, index) => {
                          if (groupVehicle.modelId) {

                            const ava = groupVehicle.free > 0 ? 'bg-success': 'bg-danger';

                            return (
                            <div className="otp-ui-mapOverlayPopup__popupAvailableSlotItem" key={index}>
                              <div>
                                <span className={ava}></span>
                                <strong>{groupVehicle.modelName}</strong>
                                <br />
                                <img src={getCarModelImage(groupVehicle.modelId)} />
                                <small>{t('availability')} {groupVehicle.free}</small>
                              </div>
                            </div>
                            )
                          }
                        })
                      }
                      </div>

                      <div className="otp-ui-mapOverlayPopup__popupRow">
                        <a className="btn btn-link btn-small" href="https://www.carsharing.bz.it">{t('book')}</a>
                      </div>
                    </>
                }
              </>
          }
          <div className="otp-ui-mapOverlayPopup__popupRow">
            <FromToLocationPicker
              location={location}
              setLocation={setLocation}
            />
          </div>
        </div>
      </Popup>
    );
  };

  renderStation = (station, index) => {

    let icon = null

    if (typeof station.isFloatingCar === 'boolean' || station.type === "carsharing-hub") {
      icon = getMarkerCarSharing(station.free, this.props.overlayCarSharingConf)
    } else {
      icon = getStationMarkerByColor()
    }

    return (
      <Marker
        icon={icon}
        key={station.station_id || station.id || index}
        position={[station.y || station.lat, station.x || station.lon]}
        onClick={(e)=>{ e.target.openPopup()}}>
        {this.renderPopupForStation(station)}
      </Marker>
    );
  };



  render() {
    const { stations, companies, activeFilters, overlayCarSharingConf } = this.props;
    const isMarkClusterEnabled = overlayCarSharingConf.markerCluster

    if (!stations || stations.length === 0) return <LayerGroup />;

    let filteredStations = [];
    if (Array.isArray(companies)) {
      filteredStations = stations.filter(station =>
          station.networks.filter(value => companies.includes(value)).length > 0
      );
    }
    else {
      filteredStations = stations;
    }

    filteredStations = filterOverlay(filteredStations, activeFilters[ overlayCarSharingConf.type ]);

    const markerClusterIcon = cluster => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: 'marker-cluster-svg',
        iconSize: [overlayCarSharingConf.iconWidth, overlayCarSharingConf.iconHeight],
        iconAnchor: [overlayCarSharingConf.iconWidth/2, overlayCarSharingConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
              text={text}
              textColor={'white'}
              markerColor={overlayCarSharingConf.iconMarkerColor}
            />
          )
      });
    }

    return (
      <LayerGroup>
        <AdvancedMarkerCluster
          enabled={isMarkClusterEnabled}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={16}
          iconCreateFunction={markerClusterIcon}
        >
          {
            filteredStations.map((station,index)=>this.renderStation(station,index))
          }
        </AdvancedMarkerCluster>
      </LayerGroup>
    );
  }
}

CarSharingOverlay.props = {
  /**
   * The entire companies config array.
   */
  configCompanies: PropTypes.arrayOf(companyType.isRequired).isRequired,
  /**
   * A list of companies that are applicable to just this instance of the
   * overlay.
   */
  companies: PropTypes.arrayOf(PropTypes.string.isRequired),
  /**
   * An optional custom function to create a string name of a particular vehicle
   * rental station. This function takes two arguments of the configCompanies
   * prop and a vehicle rental station. The function must return a string.
   */
  getStationName: PropTypes.func,
  /**
   * A configuration of what map markers or symbols to show at various zoom
   * levels.
   */
  mapSymbols: vehicleRentalMapOverlaySymbolsType,
  /**
   * If specified, a function that will be triggered every 30 seconds whenever this layer is
   * visible.
   */
  refreshVehicles: PropTypes.func,
  /**
   * A callback for when a user clicks on setting this stop as either the from
   * or to location of a new search.
   *
   * This will be dispatched with the following argument:
   *
   * ```js
   *  {
   *    location: {
   *      lat: number,
   *      lon: number,
   *      name: string
   *    },
   *    locationType: "from" or "to"
   *  }
   * ```
   */
  setLocation: PropTypes.func.isRequired,
  /**
   * A list of the vehicle rental stations specific to this overlay instance.
   */
  stations: PropTypes.arrayOf(stationType),
  /**
   * Whether the overlay is currently visible.
   */
  visible: PropTypes.bool,
  /**
   * The current map zoom level.
   */
  zoom: PropTypes.number.isRequired
};

CarSharingOverlay.defaultProps = {
  getStationName: (configCompanies, station) => {
    const stationNetworks = getCompaniesLabelFromNetworks(
      station.networks,
      configCompanies
    );

    let stationName = station.name || station.id;

    if (station.isFloatingCar) {
      stationName = `${stationNetworks} ${stationName}`;
    }

    return stationName;
  },
  mapSymbols: null,
  refreshVehicles: null,
  stations: [],
  visible: false
};

export default withNamespaces()(withLeaflet(CarSharingOverlay));
