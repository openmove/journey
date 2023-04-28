import React, { Component } from "react";
import { withLeaflet } from "react-leaflet";
import { withNamespaces } from "react-i18next";
import { NavItem as BNavItem } from "react-bootstrap";
import Icon from "../../narrative/icon";
import { MainPanelContent } from "../../../actions/ui";
import { connect } from "react-redux";

class NavItem extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.state = {loading:false}
  }

  showRouteViewer = () => {
    this.props.setMainPanelContent(MainPanelContent.ROUTE_VIEWER);
  };

  setGpsLocation = () => {
    //TODO move this func to global
    this.setState({loading:true})
    const map = this.props.mapRef;
    if(!map){
      console.warn('no map ref')
      return
    }
    // https://leafletjs.com/reference.html#locate-options
    map
      .locate({
        enableHighAccuracy: false,
        setView: true,
      })
      .once("locationfound", (e) => {
        const { latlng } = e;
        map.stopLocate();
        this.setState({loading:false})
      });
  };

  startOver = () => {
    const { reactRouterConfig } = this.props;
    let startOverUrl = "/";
    if (reactRouterConfig && reactRouterConfig.basename) {
      startOverUrl += reactRouterConfig.basename;
    }
    window.location.href = startOverUrl;
  };

  onClick(e) {
    const { onClick, onClickEvent } = this.props;

    if (onClickEvent) {
      if (window.hasOwnProperty(onClickEvent)) {
        //global methods
        window[onClickEvent]();
      } else if (this.hasOwnProperty(onClickEvent)) this[onClickEvent]();
    }
    if (typeof onClick === "function") {
      onClick();
    }

    // remove focus on click
    if(e && e.target){
      e.target.blur()
    }

  }

  render() {
    const { onClickEvent, icon, name, t, index } = this.props;
    return (
      <BNavItem onClick={this.onClick} eventKey={index} className={this.state.loading ? 'loading' : ''}>
        {icon && <Icon type={icon} />}
        {t(name)}
      </BNavItem>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {mapRef: state.otp.config.map.ref}
}

export default withNamespaces()(connect(mapStateToProps)(NavItem));
