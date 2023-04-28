import utils from "../../core-utils";
import PropTypes from "prop-types";
import React from "react";
import { FeatureGroup, MapLayer, withLeaflet } from "react-leaflet";

/*
  TODO DEPRECATED MapLayer
  https://github.com/PaulLeCam/react-leaflet/issues/818
  https://github.com/PaulLeCam/react-leaflet/issues/862
*/

/**
 * An overlay to view a collection of stops.
 */
class StopsOverlay extends MapLayer {
  componentDidMount() {
    if(this.props.visible){
      // set up pan/zoom listener
      this.props.leaflet.map.on("moveend", this.refreshStops);
    }
  }

  // TODO: determine why the default MapLayer componentWillUnmount() method throws an error
  componentWillUnmount() {
    // Remove the pan/zoom listener set up above.
    this.removeMoveendListener()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this.addMoveendListener();
    } else if (prevProps.visible && !this.props.visible) {
      this.removeMoveendListener();
    }
  }

  /**
   * this method is used for backporting to React 15
   * v16:  return this.props.leaflet;
   * v15:  return this.context;
   */
  getLeafletContext() {
    return this.props.leaflet;
  }

  addMoveendListener(){
    if(this?.props?.leaflet?.map){
      this.props.leaflet.map.on("moveend", this.refreshStops);
    }
  }

  removeMoveendListener(){
    if(this?.props?.leaflet?.map){
      this.props.leaflet.map.off("moveend", this.refreshStops);
    }
  }

  refreshStops = () => {
    const { leaflet, minZoom, refreshStops, parentStations, minZoomStation } = this.props;
    const { map } = this.props.leaflet;
    let useClusters = false;

    if (parentStations && leaflet.map.getZoom() < minZoomStation) {
      useClusters = true;
    }
    else if (leaflet.map.getZoom() < minZoom) {
      this.forceUpdate();
      return;
    }

    const bounds = leaflet.map.getBounds();
    if (!bounds.equals(this.lastBounds)) {
      setTimeout(() => {
        refreshStops({
          clusters: useClusters,
          minLat: bounds.getSouth(),
          maxLat: bounds.getNorth(),
          minLon: bounds.getWest(),
          maxLon: bounds.getEast()
        });
        this.lastBounds = bounds;
      }, 150);
    }
  };

  createLeafletElement() {}

  updateLeafletElement() {}

  render() {
    const { leaflet, minZoom, StopMarker, stops } = this.props;

    return (
      <FeatureGroup>
        {
          // Don't render if below zoom threshold or no stops visible
          ( leaflet &&
            leaflet.map &&
            leaflet.map.getZoom() >= minZoom &&
            stops &&
            stops.length > 0
          ) && (
            // Otherwise, return FeatureGroup with mapped array of StopMarkers
            stops.map(stop => <StopMarker key={stop.id.toString()} stop={stop} />)
          )
        }
      </FeatureGroup>
    );
  }
}

StopsOverlay.propTypes = {
  /** the leaflet reference as obtained from the withLeaflet wrapper */
  /* eslint-disable-next-line react/forbid-prop-types */
  leaflet: PropTypes.object.isRequired,
  /**
   * The zoom number at which this overlay will begin to show stop markers.
   */
  minZoom: PropTypes.number,
  /**
   * A callback for refreshing the stops in the event of a map bounds or zoom
   * change event.
   */
  refreshStops: PropTypes.func.isRequired,
  /**
   * A react component that can be used to render a stop marker. The component
   * will be sent a single prop of stop which will be a stopLayerStopType.
   */
  StopMarker: PropTypes.elementType.isRequired,
  /**
   * The list of stops to create stop markers for.
   */
  stops: PropTypes.arrayOf(utils.types.stopLayerStopType).isRequired
};

StopsOverlay.defaultProps = {
  minZoom: 15,
  stopMarkerPath: undefined,
  stopMarkerRadius: undefined
};

export default withLeaflet(StopsOverlay);
