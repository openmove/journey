import React, { Component } from "react";
import { withNamespaces } from 'react-i18next'
import PropTypes from "prop-types";
import { LayersControl, Map, TileLayer, Popup } from "react-leaflet";
import utils from "../core-utils";
import AdvancedOverlaysController from "../advanced-overlays-controller";
import { connect } from "react-redux";
import { setMapRef } from '../../actions/map'
import L from "leaflet";

import callIfValid from "./util";

/**
 * panToOffset will allow you to pan the map and adjust for something like a floating
 * left nav bar, or a page header with an offset center
 *
 * @note adapted from Peter's code: https://gist.github.com/missinglink/7620340
 *
 * @param latlng
 * @param offsetX & offsetY: defaults to [0, 0] ([X, Y] pixel offsets center) a positive x
 * offset to shift the center to the right, and a positive y offset to shift the center to the
 * bottom. Negatives will move to the center point left and top.
 * @param options: pan options https://leafletjs.com/reference.html#pan-options
 * @return return value from a call to https://leafletjs.com/reference.html#map-panto
 */
L.Map.prototype.panToOffset = function(latlng, offsetX, offsetY, options) {
  const x =
    this.latLngToContainerPoint(latlng).x - (parseInt(offsetX, 10) || 0);
  const y =
    this.latLngToContainerPoint(latlng).y - (parseInt(offsetY, 10) || 0);
  const point = this.containerPointToLatLng([x, y]);
  /* eslint-disable-next-line no-underscore-dangle */
  return this.setView(point, this._zoom, { pan: options });
};

// eslint-disable-next-line func-names
L.Evented.addInitHook(function() {
  if (this) this.singleClickTimeout = null;
  this.on("click", this.scheduleSingleClick, this);
  this.on("dblclick dragstart zoomstart", this.cancelSingleClick, this);
  this.on("zoomend", e => {
      console.log('zoom',this.getZoom())
  })
  //this.on("moveend", this.handleMoveEnd, this);
});

L.Evented.include({
  cancelSingleClick() {
    // This timeout is key to workaround an issue where double-click events
    // are fired in this order on some touch browsers: ['click', 'dblclick', 'click']
    // instead of ['click', 'click', 'dblclick']
    setTimeout(this.clearSingleClickTimeout.bind(this), 0);
  },

  scheduleSingleClick(e) {
    this.clearSingleClickTimeout();

    this.singleClickTimeout = setTimeout(
      this.fireSingleClick.bind(this, e),
      this.options.singleClickTimeout || 500
    );
  },

  fireSingleClick(e) {
    // eslint-disable-next-line no-underscore-dangle
    if (!e.originalEvent._stopped) {
      this.fire("singleclick", L.Util.extend(e, { type: "singleclick" }));
    }
  },

  clearSingleClickTimeout() {
    if (this.singleClickTimeout !== null) {
      clearTimeout(this.singleClickTimeout);
      this.singleClickTimeout = null;
    }
  }
});

/**
 * The base OpenTripPlanner map on which everything else is rendered.
 */
class BaseMap extends Component {
  overlays = [];

  constructor(props) {
    super(props);

    this.state = {
      layerIndex: props.defaultBaseLayerIndex
    };
  }

  updateControlVisibility(){
    const { hideAllControls } = this.props;
    const visible = !(hideAllControls === true);
    const styleVisibility = visible ? 'visible' : 'hidden'
    const allLayersControls = document.getElementsByClassName('leaflet-control-layers');

    for (let lc of allLayersControls) {
      if( lc.style.visibility  !== styleVisibility){
        lc.style.visibility = styleVisibility
      }
    }
  }

  componentDidMount() {
    // hide controls if needed
    this.updateControlVisibility();

    // register single click event
    const lmap = this.refs.map.leafletElement;
    lmap.options.singleClickTimeout = 250;
    lmap.on("singleclick", this.onLeftClick);

    // set map ref in state
    this.props.setMapRef(lmap)
  }

  componentDidUpdate() {
      // update control visibility
      this.updateControlVisibility();
  }

  // remove custom overlays on unmount
  // TODO: Is this needed? It may have something to do with mobile vs desktop views
  componentWillUnmount() {
    const lmap = this.refs.map.leafletElement;
    lmap.eachLayer(layer => {
      // Do not inline, there is a 'this' implied.
      lmap.removeLayer(layer);
    });
  }

  /**
   * Returns whether to show the Mapbox wordmark (if the current layer's URL is
   * a Mapbox url).
   */
  showMapboxWordmark = () => {
    const { baseLayers } = this.props;
    const { layerIndex } = this.state;
    // Get current layer and check its URL.
    const activeLayer = baseLayers[layerIndex];
    return activeLayer && activeLayer.url.startsWith("//api.mapbox.com");
  };

  onLeftClick = e => {
    const { onClick } = this.props;
    callIfValid(onClick)(e);
  };

  forwardOne = (eventName, e) => {
    // Call the event handler, if implemented, on the layer for which this event applies.
    const layer = this.overlays.find(child => child.props.name === e.name);
    if (layer) callIfValid(layer[eventName])(e);

    // Call the event handler on this control's parent element.
    // eslint-disable-next-line react/destructuring-assignment
    callIfValid(this.props[eventName])(e);
  };

  forwardAll = (eventName, e) => {
    // Call the event handler, if implemented, on each registered overlay.
    this.overlays.forEach(layer => {
      callIfValid(layer[eventName])(e);
    });

    // Call the event handler on this control's parent element.
    // eslint-disable-next-line react/destructuring-assignment
    callIfValid(this.props[eventName])(e);
  };

  handleBaseLayerChange = e => {
    const { baseLayers, onBaseLayerChange } = this.props;
    // Find layer index
    const index = baseLayers.findIndex(l => l.name === e.name);
    const layer = baseLayers[index];


    // Call prop if exists.
    if (typeof onBaseLayerChange === "function") {
      onBaseLayerChange({ index, layer });
    }
    // Update active index in state.
    this.setState({ layerIndex: index });
  };

  handleOverlayAdded = e => {
    this.forwardOne("onOverlayAdded", e);
  };

  handleOverlayRemoved = e => {
    this.forwardOne("onOverlayRemoved", e);
  };

  handleViewportChanged = e => {
    this.forwardAll("onViewportChanged", e);
  };

  handleMoveEnd = e => {
    this.forwardAll("onMoveEnd", e);
  };

  handleMoveStart = e => {
    this.forwardAll("onMoveStart", e);
  }

  registerOverlay = overlay => {
    this.overlays.push(overlay);
  };

  render() {
    const {
      //TODO t,
      baseLayers,
      center,
      children,
      maxZoom,
      zoomControl,
      popup,
      onContextMenu,
      onPopupClose,
      onMoveEnd,
      onLoad,
      onFilterLayerRequest,
      appVersionAttribution,
      zoom,
      hideAllControls
    } = this.props;
    const { layerIndex } = this.state;

    // Separate overlay layers into user-controlled (those with a checkbox in
    // the layer control) and those that are needed by the app (e.g., stop viewer
    // and itinerary overlay).
    const userControlledOverlays = [];
    const fixedOverlays = [];
    React.Children.toArray(children).forEach(child => {
      if (child.props.name) {
        const newChild = React.cloneElement(child, {
          // Inject registerOverlay prop to each custom overlay.
          registerOverlay: this.registerOverlay
        });
        userControlledOverlays.push(newChild);
      } else fixedOverlays.push(child);
    });

    return (
      <Map
        ref="map"
        className="map noneselect"
        center={center}
        zoom={zoom}
        maxZoom={maxZoom}
        zoomControl={zoomControl}
        // onClick={this.onLeftClick}
        // Note: Map-click is handled via single-click plugin, set up in componentDidMount()
        onContextMenu={onContextMenu}
        onOverlayAdd={this.handleOverlayAdded}
        onBaseLayerChange={this.handleBaseLayerChange}
        onOverlayRemove={this.handleOverlayRemoved}
        onViewportChanged={this.handleViewportChanged}
        onMoveEnd={this.handleMoveEnd}
        onMoveStart={this.handleMoveStart}
        whenReady={onLoad}
        onPopupOpen={this.props.onPopupOpen}
        onPopupClose={this.props.onPopupClose}
        closePopupOnClick={this.props.closePopupOnClick}
      >
        {/* Add the mapbox wordmark if the current base layer's URL appears to
          be a Mapbox URL. The implementing application must include CSS that
          properly displays the wordmark. See Mapbox website for example CSS:
          https://docs.mapbox.com/help/how-mapbox-works/attribution/#other-mapping-frameworks */}
        {this.showMapboxWordmark() && (
          <a
            href="http://mapbox.com/about/maps"
            className="mapbox-wordmark"
            target="_blank noopener noreferrer"
          >
            Mapbox
          </a>
        )}

        <AdvancedOverlaysController
          overlays={userControlledOverlays}
          onFilterRequest={filterName => onFilterLayerRequest(filterName)}
        />

        <LayersControl position="bottomright">
          {/* base layers */}
          {baseLayers &&
            baseLayers.map((layer, i) => {
              return (
                <LayersControl.BaseLayer
                  name={layer.name}
                  checked={i === layerIndex}
                  key={i}
                >
                  {
                    // Fix tile size/zoom offset: https://stackoverflow.com/a/37043490/915811
                    // Also, split the declaration between the two
                    // outcomes to avoid error 'attempted to load an infinite number of tiles'
                    // if the tiles cannot be loaded for any reason.
                  }
                  {layer.retina ? (
                    <TileLayer
                      url={layer.url}
                      attribution={this.props.t(layer.attribution)}
                      retina={layer.retina}
                      maxZoom={layer.maxZoom}
                      tileSize={512}
                      zoomOffset={-1}
                      detectRetina={layer.detectRetina}

                    />
                  ) : (
                    <TileLayer
                      url={layer.url}
                      attribution={this.props.t(layer.attribution) + appVersionAttribution}
                      maxZoom={layer.maxZoom}
                      detectRetina={layer.detectRetina}

                    />
                  )}
                </LayersControl.BaseLayer>
              );
            })}
        </LayersControl>

        {/* Add the fixed, i.e. non-user-controllable, overlays (e.g., itinerary overlay) */}
        {fixedOverlays}

        {/* Add the location selection popup and content, if both are set. */}
        {popup && popup.location && popup.contents && (
          <Popup position={popup.location} onClose={popup.onPointPopupClose}>
            {popup.contents}
          </Popup>
        )}
      </Map>
    );
  }
}

BaseMap.propTypes = {
  /**
   * Zero, one, or multiple components that extend { MapLayer } from 'react-leaflet'.
   * Children can be overlays or loose markers.
   */
  children: PropTypes.oneOfType([
    // Ideally, the types below should be MapLayer,
    // however, during type validation in the browser,
    // MapLayer components all seem to resolve to Object.
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  /**
   * The base (background) layers for the map.
   */
  baseLayers: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      subdomains: PropTypes.string,
      attribution: PropTypes.string,
      maxZoom: PropTypes.number,
      hasRetinaSupport: PropTypes.bool
    })
  ),
  /**
   * The center of the map, as a [lat, lng] array.
   */
  center: utils.types.latlngType.isRequired,
  /**
   * The maximum zoom level allowed on the map.
   */
  maxZoom: PropTypes.number,
  /**
   * Triggered when the user changes the active base layer.
   * See https://leafletjs.com/reference-1.7.1.html#map-baselayerchange
   */
  onBaseLayerChange: PropTypes.func,
  /**
   * Triggered when the user clicks on the map.
   * See https://leafletjs.com/reference-1.6.0.html#map-click for details.
   */
  onClick: PropTypes.func,
  /**
   * Triggered when the user right-clicks on the map or, on a mobile device, presses the map for a second ("long-press").
   * See https://leafletjs.com/reference-1.6.0.html#map-contextmenu for details.
   */
  onContextMenu: PropTypes.func,
  /**
   * Triggered when the user makes an overlay visible using the map's layers control.
   * See https://leafletjs.com/reference-1.6.0.html#map-overlayadd for details.
   */
  // eslint-disable-next-line react/no-unused-prop-types
  onOverlayAdded: PropTypes.func,
  /**
   * Triggered when the user hides an overlay using the map's layers control.
   * See https://leafletjs.com/reference-1.6.0.html#map-overlayremove for details.
   */
  // eslint-disable-next-line react/no-unused-prop-types
  onOverlayRemoved: PropTypes.func,
  /**
   * Triggered when the user closes the popup (if `popupLocation` and `popupContent` have been set).
   */
  onPopupClose: PropTypes.func,
  /**
   * Triggered when the user pans the map or changes zoom level.
   * See https://github.com/PaulLeCam/react-leaflet/blob/master/example/components/viewport.js for more details.
   */
  // eslint-disable-next-line react/no-unused-prop-types
  onViewportChanged: PropTypes.func,

  onFilterLayerRequest: PropTypes.func,

  onMoveEnd: PropTypes.func,

  /**
   * The contents and location (in [lat, lng] format) of the popup to display, or null if no popup is displayed.
   */
  popup: PropTypes.shape({
    contents: PropTypes.node.isRequired,
    location: utils.types.latlngType.isRequired
  }),
  /**
   * The zoom level of the map.
   */
  zoom: PropTypes.number,

  defaultBaseLayerIndex: PropTypes.number
};

BaseMap.defaultProps = {
  children: null,
  baseLayers: [
    {
      name: "Streets",
      url:
        "//cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}@2x.png",
      attribution:
        'Map tiles: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20

      // FIXME?? CartoDB displays characters proportionally too large
      // on regular monitors (1080p or lower) when using the "retina" parameters below.
      // (That does not happen on "retina" displays such as Macbook or mobile phones.)
      // url:
      //  "//cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{retina}.png",
      // retina: "@2x",
      // detectRetina: true
    }
  ],
  maxZoom: 20,
  onBaseLayerChange: null,
  onClick: null,
  onContextMenu: null,
  onOverlayAdded: null,
  onOverlayRemoved: null,
  onPopupClose: null,
  onViewportChanged: null,
  onFilterLayerRequest: null,
  onLoad: null,
  popup: null,
  zoom: 13,
  defaultBaseLayerIndex: 0
};

const mapDispatchToProps = {
  setMapRef
};
export default withNamespaces()(connect(undefined,mapDispatchToProps)(BaseMap));
