import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  LayerGroup,
  FeatureGroup,
  MapLayer,
  Marker,
  Popup,
  withLeaflet,
} from "react-leaflet";
import { divIcon, icon } from "leaflet";
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from "react-circular-progressbar";
import FontAwesome from "react-fontawesome";
import "react-circular-progressbar/dist/styles.css";

import { setLocation } from "../../../actions/map";
import { trailsLocationsQuery } from "../../../actions/trails";

import BadgeIcon from "../../icons/badge-icon";
import MarkerCharger from "../../icons/modern/MarkerCharger";
import ReactDOMServer from "react-dom/server";
import Charger from "../../icons/modern/Charger";
import FromToLocationPicker from "../../from-to-location-picker";

import AdvancedMarkerCluster from "../../advanced-marker-cluster";
import MarkerCluster from "../../icons/modern/MarkerCluster";

import { getItem } from "../../core-utils/storage";
import { filterOverlay } from "../../core-utils/overlays";
import { bbToRadiusInMeters } from "../../../util/bbToRadius";
import { Badge, Button } from "react-bootstrap";

class TrailsOverlay extends MapLayer {
  constructor(props) {
    super(props);
    this.popup = React.createRef();
    this._startRefreshing = this._startRefreshing.bind(this);
    this._stopRefreshing = this._stopRefreshing.bind(this);
  }

  static propTypes = {
    api: PropTypes.string,
    locations: PropTypes.array,
    trailsLocationsQuery: PropTypes.func,
    setLocation: PropTypes.func,
  };

  _startRefreshing(launchNow) {
    const getRadiusFromBBInMeters = () => {
      const bb = getItem("mapBounds");

      const radiusInM = bbToRadiusInMeters(bb);
      return radiusInM;
    };

    const center = getItem("mapCenter");
    const radius = getRadiusFromBBInMeters();

    const params = {
      location: center.lng + "," + center.lat,
      radius,
      key: this.props.apiKey,
      lang: this.props.i18n.language,
      limit: 48, // :hammer: there's no way to filter this to a reasonable number // since the next  request has an intrinsic number of ids that could be required doe to the maximum lenght of the url :/
    };

    if (launchNow === true) {
      this.props.trailsLocationsQuery(
        this.props.apiNearby,
        this.props.apiOOIs,
        params
      );
    } else {
      if (this._refreshTimer) clearTimeout(this._refreshTimer);

      this._refreshTimer = setTimeout(() => {
        const center = getItem("mapCenter");
        const radius = getRadiusFromBBInMeters();

        const params = {
          location: center.lng + "," + center.lat,
          radius,
          key: this.props.apiKey,
          lang: this.props.i18n.language,
          limit: 48, // :hammer: there's no way to filter this to a reasonable number // since the next  request has an intrinsic number of ids that could be required doe to the maximum lenght of the url :/
        };

        this.props.trailsLocationsQuery(
          this.props.apiNearby,
          this.props.apiOOIs,
          params
        );
      }, 500);
    }
  }

  _stopRefreshing() {
    if (this._refreshTimer) clearTimeout(this._refreshTimer);
  }

  componentDidMount() {
    this.props.registerOverlay(this);
    if (this.props.visible) {
      this.props.leaflet.map.on("moveend", this._startRefreshing);
      this._startRefreshing();
    }
  }

  onOverlayAdded = () => {
    this.props.leaflet.map.on("moveend", this._startRefreshing);
    this._startRefreshing(true);
    const { locations, overlayTrailsConf } = this.props;
    const { map } = this.props.leaflet;
    const newLoc = [];

    if (overlayTrailsConf.startCenter) {
      map.flyTo(overlayTrailsConf.startCenter);
    }
  };

  onOverlayRemoved = () => {
    this.props.leaflet.map.off("moveend", this._startRefreshing);
    this._stopRefreshing();
  };

  componentWillUnmount() {
    this.props.leaflet.map.off("moveend", this._startRefreshing);
    this._stopRefreshing();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this._startRefreshing();
      this.props.leaflet.map.on("moveend", this._startRefreshing);
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing();
      this.props.leaflet.map.off("moveend", this._startRefreshing);
    }
  }

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const {
      locations,
      t,
      i18n,
      overlayTrailsConf,
      activeFilters,
      leaflet,
      minZoom,
    } = this.props;

    const isMarkClusterEnabled = overlayTrailsConf.markerCluster;
    const lang = i18n?.language;
    console.log(locations.map((station) => station.meta));

    if (
      !locations ||
      locations.length === 0 ||
      leaflet?.map?.getZoom() <= minZoom
    )
      return <LayerGroup />;

    /*
    // todo implement filters
    const bb =  getItem('mapBounds')

    const locationsFiltered = filterOverlay(
      locations.filter(
        (single)=>{
        if( bb.minLon <= single.lon && single.lon <= bb.maxLon && bb.minLat <= single.lat && single.lat <= bb.maxLat ) {
          return true;
        }
      }),
      activeFilters[overlayTrailsConf.type]
    ); */

    const markerIcon = (station) => {
      const iconUrl = station?.category?.iconUrl;
      return icon({
        className: "outdoorActive--categoryIcon",
        iconUrl,
        iconSize: [overlayTrailsConf.iconWidth, overlayTrailsConf.iconHeight],
        iconAnchor: [
          overlayTrailsConf.iconWidth / 2,
          overlayTrailsConf.iconHeight,
        ],
        popupAnchor: [0, -overlayTrailsConf.iconHeight],
      });
    };

    const markerClusterIcon = (cluster) => {
      const text = cluster.getChildCount();
      return L.divIcon({
        className: "marker-cluster-svg",
        iconSize: [overlayTrailsConf.iconWidth, overlayTrailsConf.iconHeight],
        html: ReactDOMServer.renderToStaticMarkup(
          <MarkerCluster
            text={text}
            textColor={"white"}
            markerColor={overlayTrailsConf.iconMarkerColor}
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
          {locations.map((station) => {
            if (station?.opened != null && station?.opened !== true) {
              return null;
            }

            const title =
              lang && station?.meta?.translations?.includes(lang)
                ? station?.localizedTitle?.[lang]
                : station?.title;

            const location = { ...station.startingPoint, name: title };

            const image = station?.images?.image?.filter(
              (img) => img?.primary
            )[0];

            const removeHtmlTags = (str) => {
              return str.replace(/<[^>]*>/g, "");
            };
            const shortDescription =
              station?.shortText != null
                ? removeHtmlTags(station?.shortText)
                : null;
            console.log(station?.images);
            console.log(image);

            let length;
            if (station?.length == null) {
              length = undefined;
            } else if (station.length > 1000) {
              length =
                (Number.parseFloat(station.length) / 1000).toFixed(2) + "km";
            } else {
              length = Number.parseFloat(station.length).toFixed(2) + "m";
            }

            let duration;
            if (station?.time?.min == null) {
              duration = undefined;
            } else if (station.time?.min > 60 * 24) {
              duration = Math.floor(station.time?.min / (60 * 24)) + "d";
            } else if (station.time?.min > 60) {
              const hours = Math.floor(station.time?.min / 60);
              let minutes = station.time?.min - 60 * hours;
              duration = hours + "h";

              if (minutes !== 0) {
                minutes = minutes < 10 ? "0" + minutes : minutes;
                duration = hours + ":" + minutes + "h";
              }
            } else {
              duration = station.time?.min + "'";
            }

            let difficulty;
            switch (station.rating.difficulty) {
              case 1:
                difficulty = "easy";
                break;
              case 2:
                difficulty = "medium";
                break;
              case 3:
                difficulty = "hard";
                break;
            }

            return (
              <Marker
                icon={markerIcon(station)}
                key={station.id}
                position={[
                  station.startingPoint.lat,
                  station.startingPoint.lon,
                ]}
                onClick={(e) => {
                  e.target.openPopup();
                }}
              >
                <Popup>
                  <div className="otp-ui-mapOverlayPopup outdoor-active-popup">
                    <div className="otp-ui-mapOverlayPopup__popupHeader">
                      <img
                        width={24}
                        height={20}
                        className="outdoorActive--categoryIcon"
                        src={station?.category?.iconUrl}
                      />
                      {station?.category?.name}
                      {/*note: name is localized based on the lang passed to the request  */}
                      {difficulty != null && (
                        <Badge className={difficulty}>{difficulty}</Badge>
                      )}
                    </div>

                    <div className="otp-ui-mapOverlayPopup__popupTitle">
                      {title}
                    </div>
                    <div className="source-attribution">
                      <div className="source-attribution-description">
                        <p> Responsible for this content</p>
                        {station.meta.source.name}
                      </div>
                      <a href={station.meta.source.url}>
                        <img
                          className="source-attribution-image"
                          src={
                            "https://img.oastatic.com/img/" +
                            station.meta.source.logo.id +
                            "/.png"
                          }
                        />
                      </a>
                    </div>

                    {image && (
                      <figure>
                        <img
                          className="image"
                          src={
                            "https://img.oastatic.com/img/200/200/" +
                            image.id +
                            "/.png"
                          }
                        />
                        <figcaption>
                          <p className="photos-author">
                            Photo's author: {image.meta.author || "unknown"}
                            {image.meta.licence && (
                              <>
                                {" ,"}
                                <a href={image.meta.licence?.url}>
                                  {image.meta.licence?.name}
                                </a>
                              </>
                            )}
                            , {image.meta.source?.name}
                          </p>
                        </figcaption>
                      </figure>
                    )}
                    <p className="tours-author">
                      Tour's Author {station.meta.author}
                    </p>

                    {!image && shortDescription && (
                      <div className="short-description">
                        {shortDescription}
                      </div>
                    )}

                    <a
                      style={{ marginTop: "10px" }}
                      href={"https://www.outdooractive.com/it/r/" + station.id}
                      target="_blank"
                      className="more-details-link"
                    >
                      More Details
                    </a>

                    <ul className="trail-summary">
                      {duration != null && (
                        <li className="summary-element">
                          {duration}
                          <FontAwesome name=" fa-clock-o" tag="i" />
                        </li>
                      )}
                      {station.elevation?.ascent != null && (
                        <li className="summary-element">
                          {station.elevation?.ascent}m
                          <FontAwesome name="chevron-up" tag="i" />
                        </li>
                      )}
                      {station.elevation?.descent != null && (
                        <li className="summary-element">
                          {station.elevation?.descent}m
                          <FontAwesome name="chevron-down" tag="i" />
                        </li>
                      )}
                      {station.length != null && (
                        <li className="summary-element">
                          {length}
                          <FontAwesome name=" fa-arrows-h" tag="i" />
                        </li>
                      )}
                    </ul>

                    <div className="otp-ui-mapOverlayPopup__popupRow">
                      <FromToLocationPicker
                        location={location}
                        setLocation={this.props.setLocation}
                      />
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </AdvancedMarkerCluster>
      </LayerGroup>
    );
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  return {
    locations: state.otp.overlay.trails && state.otp.overlay.trails.locations,
    overlayTrailsConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "trails"
    )[0],
  };
};

const mapDispatchToProps = {
  setLocation,
  trailsLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(TrailsOverlay))
);
