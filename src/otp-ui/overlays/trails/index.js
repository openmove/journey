import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  LayerGroup,
  FeatureGroup,
  MapLayer,
  Marker,
  Popup,
  Polyline,
  withLeaflet,
} from "react-leaflet";
import { divIcon, icon } from "leaflet";
import { withNamespaces } from "react-i18next";
import { CircularProgressbar } from "react-circular-progressbar";
import FontAwesome from "react-fontawesome";
import "react-circular-progressbar/dist/styles.css";
import coreUtils from "../../core-utils"

import { setLocation } from "../../../actions/map";
import { trailsLocationsQuery, setViewedTrail } from "../../../actions/trails";

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

  filterContextualTrails(){
    const { contextualTrails,  unfilteredLocations} = this.props;

    const contextualTrailsIds = [];
    Object.values(contextualTrails)?.forEach((trails) => {
      const newTrailsIds = trails
      .map((trail) => trail.id)
      .filter((trailId) => !contextualTrailsIds.includes(trailId));
      contextualTrailsIds.push(...newTrailsIds);
    });

    const filteredTrails = unfilteredLocations?.filter((location)=>!(location.id in contextualTrailsIds))
    return filteredTrails;
  }

  _startRefreshing(launchNow) {
    const getRadiusFromBBInMeters = () => {
      const bb = getItem("mapBounds");

      const radiusInM = bbToRadiusInMeters(bb);
      return radiusInM;
    };

    const bb =  getItem('mapBounds')

    const params = {
      ...bb,
      lang: this.props.i18n.language,
      userId: this.props.overlayTrailsConf.userId
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
        const bb =  getItem('mapBounds')
        const params = {
          ...bb,
          lang: this.props.i18n.language,
          userId: this.props.overlayTrailsConf.userId
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

   /*  this.generateOutdoorActiveTrackingScript(
      this.props.overlayTrailsConf.trackScriptUrl
    ); */
  }

  generateOutdoorActiveTrackingScript(scriptUrl) {
    // called by back-end so it's unused rn
    const script = document.createElement("script");

    script.src = scriptUrl;
    script.async = true;

    document.body.appendChild(script);
  }

  track(station, event = "teaser"){

    const {apiTrack, userId} = this.props.overlayTrailsConf;

    const id = station.tgpId;
    const location = station.location.coordinates;

    fetch(apiTrack, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "X-User-Id": userId,
      },
      body: JSON.stringify({
        id,
        event,
        location
        } )
      })

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
      t,
      i18n,
      overlayTrailsConf,
      activeFilters,
      leaflet,
      minZoom,
    } = this.props;
    const isMobile = coreUtils.ui.isMobile();
    const isMarkClusterEnabled = overlayTrailsConf.markerCluster;
    const lang = i18n?.language;

    const locations = this.filterContextualTrails()

    if (
      !locations ||
      locations.length === 0 ||
      leaflet?.map?.getZoom() <= minZoom
    )
      return <LayerGroup />;

    // todo implement filters
    const bb = getItem("mapBounds");

    const locationsFiltered = filterOverlay(
      locations.filter((single) => {
        if (
          bb.minLon <= single.startingPoint.lon &&
          single.startingPoint.lon <= bb.maxLon &&
          bb.minLat <= single.startingPoint.lat &&
          single.startingPoint.lat <= bb.maxLat
        ) {
          return true;
        }
      }),
      activeFilters[overlayTrailsConf.type]
    );

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
          disableClusteringAtZoom={null}
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
                  this.props.setViewedTrail(station.id);
                  this.track(station)
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
                        <Badge className={difficulty}>{t(difficulty)}</Badge>
                      )}
                    </div>

                    <div className="otp-ui-mapOverlayPopup__popupTitle">
                      {title}
                    </div>
                    <div className="source-attribution">
                      <div className="source-attribution-description">
                        <p> {t("responsible_content")}</p>
                        {station.meta.source.name}
                      </div>
                      <a href={station.meta.source.url} target="_blank">
                        <img
                          className="source-attribution-image"
                          src={
                            overlayTrailsConf.outdoorActiveTrailImageUrl +
                            "/" +
                            station.meta.source.logo.id +
                            "/.png"
                          }
                        />
                      </a>
                    </div>

                    {(image && !isMobile ) && (
                      <figure>
                        <img className="image" src={  image.id } />
                        <figcaption>
                          <p className="photos-author">
                            {t("photo_author")}: {image.meta.author}
                            {image.meta.license && (
                              <>
                                {", "}
                                <a
                                  href={image.meta.license?.url}
                                  target="_blank"
                                >
                                  {image.meta.license?.short}
                                </a>
                              </>
                            )}
                            {image.meta.source?.name && (
                              <>
                                {", "}
                                {image.meta.source?.name}
                              </>
                            )}
                          </p>
                        </figcaption>
                      </figure>
                    )}
                    <p className="tours-author">
                      {t("tour_author")}: {station.meta.author}
                    </p>

                    {(!image && !isMobile) && shortDescription && (
                      <div className="short-description">
                        {shortDescription}
                      </div>
                    )}

                    <a
                      style={{ marginTop: "10px" }}
                      href={
                        overlayTrailsConf.outdoorActiveTrailUrl +
                        `\\${lang}\\r\\` +
                        station.id
                      }
                      target="_blank"
                      className="more-details-link"
                    >
                      {t("more_details")}
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
  const viewedTrail = state.otp.ui.viewedTrail;
  return {
    contextualTrails:state.otp.transitIndex?.trails,
    unfilteredLocations: state.otp.overlay.trails && state.otp.overlay.trails.locations,
    overlayTrailsConf: state.otp?.config?.map?.overlays?.filter(
      (item) => item.type === "trails"
    )[0],
  };
};

const mapDispatchToProps = {
  setLocation,
  setViewedTrail,
  trailsLocationsQuery,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(withLeaflet(TrailsOverlay))
);
