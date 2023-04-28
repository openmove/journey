/**
original from react-leaflet
Abstract class for layer container, extended by BaseLayer and Overlay
copied from react-leaflet a part from comment see below

https://github.com/PaulLeCam/react-leaflet/blob/v2.6.1/src/LayersControl.js

*/

import { Control, DomUtil } from "leaflet";
import L from "leaflet";
import React, { cloneElement, Component, Children, Fragment } from "react";
import ReactDOM from "react-dom";

import { LeafletProvider, withLeaflet } from "react-leaflet";
import { MapControl } from "react-leaflet";


export class ControlledLayer extends Component {
  contextValue;
  layer;

  componentDidUpdate({ checked }) {
    if (this.props.leaflet.map == null) {
      return;
    }
    // Handle dynamically (un)checking the layer => adding/removing from the map
    if (this.props.checked === true && (checked == null || checked === false)) {
      this.props.leaflet.map.addLayer(this.layer);
    } else if (
      checked === true &&
      (this.props.checked == null || this.props.checked === false)
    ) {
      this.props.leaflet.map.removeLayer(this.layer);
    }
  }

  componentWillUnmount() {
    this.props.removeLayerControl(this.layer);
  }

  addLayer() {
    throw new Error("Must be implemented in extending class");
  }

  removeLayer(layer) {
    this.props.removeLayer(layer);
  }

  render() {
    const { children } = this.props;
    return children ? (
      <LeafletProvider value={this.contextValue}>{children}</LeafletProvider>
    ) : null;
  }
}

// copied from react-leaflet a part from comment see below
class BaseLayer extends ControlledLayer {
  constructor(props) {
    super(props);
    this.contextValue = {
      ...props.leaflet,
      layerContainer: {
        addLayer: this.addLayer.bind(this),
        removeLayer: this.removeLayer.bind(this),
      },
    };
  }

  addLayer = (layer) => {
    this.layer = layer; // Keep layer reference to handle dynamic changes of props
    const { addBaseLayer, checked, name } = this.props;
    addBaseLayer(layer, name, checked);
  };
}

class Overlay extends ControlledLayer {
  constructor(props) {
    super(props);
    this.contextValue = {
      ...props.leaflet,
      layerContainer: {
        addLayer: this.addLayer.bind(this),
        removeLayer: this.removeLayer.bind(this),
      },
    };
  }

  addLayer = (layer) => {
    this.layer = layer; // Keep layer reference to handle dynamic changes of props
    const { addOverlay, checked, name, ...options } = this.props;
    // different from  original
    // now options are passed to addOverlays
    addOverlay(layer, name, checked, options);
  };
}

// -- Custom Leaflet Control --
const DumbControl = Control.Layers.extend({
  options: {
    closeBtn: false,
  },

  initialize: function (baseLayers, overlays, options) {
    Control.Layers.prototype.initialize.call(
      this,
      baseLayers,
      overlays,
      options
    );
    L.setOptions(this, options);
  },

  onAdd(map) {
    const content = (this._buttons = document.createElement("div"));
    content.id = "leaflet-control-content";
    this.contentContainer = content;
    // call super method
    Control.Layers.prototype.onAdd.call(this, map);

    const section = this._section;
    section.prepend(content);

    if (this.options.closeBtn) {
      const close = document.createElement("button");
      close.textContent = "×";
      close.className = "otp-ui-advanced-overlays-controller__close-button";
      close.addEventListener("click", this.collapse.bind(this));
      // add close button as first child of the main container
      section.prepend(close);
    }

    return this._container;
  },

  getContentContainer() {
    return this.contentContainer;
  },
  _addItem(layer) {
    const createWrap = (el, wrapper) => {
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    };

    // call super method
    const label = Control.Layers.prototype._addItem.call(this, layer);
    const wrapper = DomUtil.create(
      "div",
      "otp-ui-advanced-overlays-controller"
    );

    const filterButton = DomUtil.create(
      "button",
      "otp-ui-advanced-overlays-controller__filterButton"
    );

    const options = layer.layer?.options;
    if (!options?.filters) {
      filterButton.setAttribute("disabled", "disabled");
    }
    filterButton.addEventListener("click", options?.onFiltersClick);
    createWrap(label, wrapper);
    wrapper.appendChild(filterButton);
  },
});


// -- Custom React Leaflet Control --
// features added from original react-leaflet code
// removeAll addAll overlays and arrays of layers
// enhanced with custom control component
class LayersControl extends MapControl {
  constructor(props) {
    super(props);
    this.overlays = [];
    this.baseLayers = [];

    this.controlProps = {
      addBaseLayer: this.addBaseLayer.bind(this),
      addOverlay: this.addOverlay.bind(this),
      leaflet: props.leaflet,
      removeLayer: this.removeLayer.bind(this),
      removeLayerControl: this.removeLayerControl.bind(this),
      removeAllOverlays: this.removeAllOverlays.bind(this),
      addAllOverlays: this.addAllOverlays.bind(this),
    };
  }

  createLeafletElement(props) {
    const { children, ...options } = props;
    return new DumbControl(undefined, undefined, options);
  }

  updateLeafletElement(fromProps, toProps) {
    super.updateLeafletElement(fromProps, toProps);
    if (toProps.collapsed !== fromProps.collapsed) {
      if (toProps.collapsed === true) {
        this.leafletElement.collapse();
      } else {
        this.leafletElement.expand();
      }
    }
  }

  componentDidMount() {
    super.componentDidMount();
    // This is needed because the control is only attached to the map in
    // MapControl's componentDidMount, so the container is not available
    // until this is called. We need to now force a render so that the
    // portal and children are actually rendered.
    this.forceUpdate();
  }

  componentWillUnmount() {
    setTimeout(() => {
      super.componentWillUnmount();
    }, 0);
  }

  addBaseLayer(layer, name, checked = false) {
    if (checked && this.props.leaflet.map != null) {
      this.props.leaflet.map.addLayer(layer);
    }
    this.leafletElement.addBaseLayer(layer, name);
    this.baseLayers.push(layer);
  }

  addOverlay(layer, name, checked = false, options) {
    layer.options = { ...layer.options, ...options };

    if (checked && this.props.leaflet.map != null) {
      this.props.leaflet.map.addLayer(layer);
    }
    this.leafletElement.addOverlay(layer, name);
    this.overlays.push(layer);
  }

  removeLayer(layer) {
    if (this.props.leaflet.map != null) {
      this.props.leaflet.map.removeLayer(layer);
    }
  }

  removeLayerControl(layer) {
    this.leafletElement.removeLayer(layer);
  }

  removeAllOverlays() {
    this.overlays.forEach((overlay) => this.removeLayer(overlay));
  }

  addAllOverlays() {
    this.overlays.forEach((overlay) => {
      this.props.leaflet.map.addLayer(overlay);
    });
  }

  render() {
    const children = Children.map(this.props.children, (child) => {
      return child ? cloneElement(child, this.controlProps) : null;
    });

    const overlays = this.props.overlays.map((overlay) => {
      return overlay ? cloneElement(overlay, this.controlProps) : null;
    });

    let content = null;
    if (this.leafletElement && this.leafletElement.getContentContainer()) {
      content = ReactDOM.createPortal(
        children,
        this.leafletElement.getContentContainer()
      );
    }

    return (
      <Fragment>
        {overlays}
        {content}
      </Fragment>
    );
  }
}

const AdvancedLayersControl = withLeaflet(LayersControl);

AdvancedLayersControl.BaseLayer = BaseLayer;
AdvancedLayersControl.Overlay = Overlay;

export default AdvancedLayersControl;
