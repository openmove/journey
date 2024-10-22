import { divIcon } from "leaflet";
import memoize from "lodash.memoize";
import AbstractOverlay from '../AbstractOverlay'
import { getCompaniesLabelFromNetworks } from "../../core-utils/itinerary";
import { connect } from 'react-redux'
import {
  companyType,
  vehicleRentalMapOverlaySymbolsType,
  stationType,
} from "../../core-utils/types";
import FromToLocationPicker from "../../from-to-location-picker";
import PropTypes from "prop-types";
import React from "react";
import { withNamespaces } from "react-i18next";
import { setLocation } from '../../../actions/map'
import {
  bikeRentalQuery,
  bikeRentalCustomUrlQuery,
} from "../../../actions/api";
import ReactDOMServer from "react-dom/server";
import {
  LayerGroup,
  Marker,
  MapLayer,
  Popup,
  withLeaflet,
} from "react-leaflet";
import { MapMarkerAlt } from "@styled-icons/fa-solid";
import MarkerBikeSharing from "../../icons/modern/MarkerBikeSharing";
import BikeSharing from "../../icons/modern/BikeSharing";
import BadgeIcon from "../../icons/badge-icon";
import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";
import { filterOverlay } from "../../core-utils/overlays";
import { getItem } from "../../core-utils/storage";
import { distance } from "../../core-utils/distance";


const getMarkerBikeSharing = memoize((badgeCounter, overlayBikeSharingConf) => {
  let badgeType = badgeCounter === 0 ? "danger" : "warning";

  if (badgeCounter > 1) badgeType = "success";

  return divIcon({
    className: "",
    iconSize: [
      overlayBikeSharingConf.iconWidth,
      overlayBikeSharingConf.iconHeight,
    ],
    iconAnchor: [
      overlayBikeSharingConf.iconWidth / 2,
      overlayBikeSharingConf.iconHeight,
    ],
    popupAnchor: [0, -overlayBikeSharingConf.iconHeight],
    html: ReactDOMServer.renderToStaticMarkup(
      <BadgeIcon width={overlayBikeSharingConf.iconWidth} type={badgeType}>
        <MarkerBikeSharing
          width={overlayBikeSharingConf.iconWidth}
          height={overlayBikeSharingConf.iconHeight}
          iconColor={overlayBikeSharingConf.iconColor}
          markerColor={overlayBikeSharingConf.iconMarkerColor}
        />
      </BadgeIcon>
    ),
  });
});

const getStationMarkerByColor = memoize(() =>
  divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
    html: ReactDOMServer.renderToStaticMarkup(
      <MapMarkerAlt width={20} height={20} />
    ),
  })
);

/**
 * This vehicle rental overlay can be used to render vehicle rentals of various
 * types. This layer can be configured to show different styles of markers at
 * different zoom levels.
 */
class BikeSharingOverlay extends AbstractOverlay {

  constructor(props){
    //setup query to be called like query(api,params)
    const query =
      props.overlayBikeSharingConf?.useCustomApi === true
        ? (api, params) =>
            props.bikeRentalCustomUrlQuery(api, params)
        : (api,params) => props.bikeRentalQuery(params);

    super({
      props,
      query,
      api: props?.api,
      config: props.overlayBikeSharingConf
    });

    this.popup = React.createRef();
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  /**
   * Render some popup html for a station. This contains custom logic for
   * displaying rental vehicles in the TriMet MOD website that might not be
   * applicable to other regions.
   */
  renderPopupForStation = (station, stationIsHub = false) => {
    const {
      configCompanies,
      getStationName,
      setLocation,
      overlayBikeSharingConf,
      t,
    } = this.props;
    const stationName = getStationName(configCompanies, station);
    const capacity = station?.capacity;

    const location = {
      lat: station.y || station.lat,
      lon: station.x || station.lon,
      name: stationName,
    };
    return (
      <Popup>
        <div className="otp-ui-mapOverlayPopup">
          <div className="otp-ui-mapOverlayPopup__popupHeader">
            <BikeSharing width={26} height={22} />
            &nbsp;&nbsp;{t("bikesharing")}
          </div>
          <div className="otp-ui-mapOverlayPopup__popupTitle">
            {stationName}
          </div>
          <div className="otp-ui-mapOverlayPopup__popupAvailableInfo">
              {station.bikesAvailable !== null && (
                <>
                  <div className="otp-ui-mapOverlayPopup__popupAvailableInfoValue">
                    {station.bikesAvailable}
                  </div>
                  <div className="otp-ui-mapOverlayPopup__popupAvailableInfoTitle">
                    {t("available_bikes")}
                  </div>
                </>
              )}
              <div className="otp-ui-mapOverlayPopup__popupAvailableInfo--left-aligned" style={{paddingTop: (station.bikesAvailable === null || bikesAvailable === -1) ? '10px' : ''}}>
                {capacity != null && <p>{t('capacity')}: {capacity !== null && capacity !== -1 ? capacity : 'N/A'}</p>}
              </div>
            </div>
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
    if (station.isFloatingBike) return null;
    const { overlayBikeSharingConf } = this.props;
    const icon = getMarkerBikeSharing(
      station.bikesAvailable,
      overlayBikeSharingConf
    );

    return (
      <Marker
        icon={icon}
        key={station.station_id || station.id || index}
        position={[station.y || station.lat, station.x || station.lon]}
        onClick={(e) => {
          e.target.openPopup();
        }}
      >
        {this.renderPopupForStation(station)}
      </Marker>
    );
  };

  render() {
    const { stations, companies, overlayBikeSharingConf, activeFilters } =
      this.props;
    const isMarkClusterEnabled = overlayBikeSharingConf.markerCluster;

    if (!stations || stations.length === 0) return <LayerGroup />;

    let filteredStations = [];
    if (Array.isArray(companies)) {
      filteredStations = stations.filter(
        (station) =>
          station.networks.filter((value) => companies.includes(value)).length >
          0
      );
    } else {
      filteredStations = stations;
    }

    filteredStations = filterOverlay(
      filteredStations,
      activeFilters[overlayBikeSharingConf.type]
    );

    //TODO move in core-utils/overlays.js
    for (let station of filteredStations) {
      if (station.isFloatingBike) {
        let nearest = null;
        let lastDistance = null;
        for (let i = 0; i < filteredStations.length; i++) {
          const mstation = filteredStations[i];
          if (
            mstation.isFloatingBike === false &&
            mstation.networks[0] == station.networks[0]
          ) {
            const dist = distance(station.y, station.x, mstation.y, mstation.x);

            if (lastDistance == null || dist < lastDistance) {
              nearest = i;
              lastDistance = dist;
            }
          }
        }
        if (nearest) {
          filteredStations[nearest].bikesAvailable += 1;
        }
      }
    }

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [
          overlayBikeSharingConf.iconWidth,
          overlayBikeSharingConf.iconHeight,
        ],
        iconAnchor: [
          overlayBikeSharingConf.iconWidth / 2,
          overlayBikeSharingConf.iconHeight,
        ],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayBikeSharingConf.iconMarkerColor}
          />
        ),
      });
    };

    return (
      <LayerGroup>
        <AdvancedMarkerCluster
          enabled={isMarkClusterEnabled}
          showCoverageOnHover={false}
          maxClusterRadius={40}
          disableClusteringAtZoom={16}
          iconCreateFunction={markerClusterIcon}
        >
          {filteredStations.map((station, index) =>
            this.renderStation(station, index)
          )}
        </AdvancedMarkerCluster>
      </LayerGroup>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    configCompanies: state.otp.config.companies,
    overlayBikeSharingConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "bike-rental"
    )[0],
    zoom: state.otp.config.map.initZoom
  };
};

const mapDispatchToProps = {
  setLocation,
  bikeRentalQuery,
  bikeRentalCustomUrlQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(BikeSharingOverlay))
);

 // todo update
BikeSharingOverlay.props = {
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
  zoom: PropTypes.number.isRequired,
};

BikeSharingOverlay.defaultProps = {
  getStationName: (configCompanies, station) => {
    const stationNetworks = getCompaniesLabelFromNetworks(
      station.networks,
      configCompanies
    );

    let stationName = station.name || station.id;

    if (station.isFloatingBike) {
      stationName = `Free-floating bike: ${stationName}`;
    }

    return stationName;
  },
  mapSymbols: null,
  refreshVehicles: null,
  stations: [],
  visible: false,
};
