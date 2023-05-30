
/**
original from react-leaflet
copied from react-leaflet a part from comment see below

https://github.com/PaulLeCam/react-leaflet/blob/v2.6.1/src/Marker.js

*/

import * as L from 'leaflet';
import React from 'react'

import { LeafletProvider, withLeaflet,MapLayer } from 'react-leaflet'
import './animated-marker'

class Marker extends MapLayer{

  createLeafletElement(props){
    // changed type of marker with the imported one
    const el = new L.animatedMarker([props.position], this.getOptions(props))
    this.contextValue = { ...props.leaflet, popupContainer: el }
    return el
  }

  updateLeafletElement(fromProps, toProps) {

    if ( !fromProps.position || (
        toProps.position[0] !== fromProps.position[0] &&
        toProps.position[1] !== fromProps.position[1]
       )) {
      // changed condition and
      // updated position to use the animation
      const animationLine = [fromProps.position,toProps.position]

      this.leafletElement.setLine(animationLine)
      this.leafletElement.start()
    }
    if (toProps.icon !== fromProps.icon) {
      this.leafletElement.setIcon(toProps.icon)
    }
    if (toProps.zIndexOffset !== fromProps.zIndexOffset) {
      this.leafletElement.setZIndexOffset(toProps.zIndexOffset)
    }
    if (toProps.opacity !== fromProps.opacity) {
      this.leafletElement.setOpacity(toProps.opacity)
    }
    if (toProps.draggable !== fromProps.draggable) {
      if (toProps.draggable === true) {
        this.leafletElement.dragging.enable()
      } else {
        this.leafletElement.dragging.disable()
      }
    }
  }

  render() {
    const { children } = this.props
    return children == null || this.contextValue == null ? null : (
      <LeafletProvider value={this.contextValue}>{children}</LeafletProvider>
    )
  }
}

export default withLeaflet(Marker)
