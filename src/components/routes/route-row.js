import React, { Component } from "react";
import { Button } from "react-bootstrap";
import OpenMoveModeIcon from "../../otp-ui/icons/openmove-mode-icon";
// import { getMapColor,getContrastYIQ } from "../../otp-ui/core-utils/itinerary";
import { getRouteColor, getRouteTextColor} from "../../otp-ui/itinerary-body/util";
class RouteRow extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    const { isActive, route } = this.props;
    if (nextProps.route.id === route.id && nextProps.isActive === isActive) {
      return false;
    }
    return true;
  }

  _onClick = () => {
    const { findRoute, isActive, route, setViewedRoute } = this.props;
    if (isActive) {
      // Deselect current route if active.
      setViewedRoute({ routeId: null });
    } else {
      // Otherwise, set active and fetch route patterns.
      findRoute({ routeId: route.id });
      setViewedRoute({ routeId: route.id });
    }
  };

  render() {
    const { isActive, route, operator, t } = this.props;
    const { defaultRouteColor, defaultRouteTextColor, longNameSplitter } =
      operator || {};
    // const backgroundColor = `#${defaultRouteColor || route.color || "ffffff"}`;
    const backgroundColor = getRouteColor(route?.mode,route?.color)

    // NOTE: text color is not a part of short response route object, so there
    // is no way to determine from OTP what the text color should be if the
    // background color is, say, black. Instead, determine the appropriate
    // contrast color and use that if no text color is available.
    /* const contrastColor = getContrastYIQ(backgroundColor);
    const color = route.textColor ? `#${
      route.textColor}` :  contrastColor || defaultRouteTextColor; */

    const color = getRouteTextColor(route?.mode, backgroundColor, route?.textColor)


    // Default long name is empty string (long name is an optional GTFS value).
    let longName = "";
    if (route.longName) {
      // Attempt to split route name if splitter is defined for operator (to
      // remove short name value from start of long name value).
      const nameParts = route.longName.split(longNameSplitter);
      longName =
        longNameSplitter && nameParts.length > 1
          ? nameParts[1]
          : route.longName;
      // If long name and short name are identical, set long name to be an empty
      // string.
      if (longName === route.shortName) longName = "";
    }
    return (
      <div className={"route-row"}>
        <div onClick={this._onClick} block className={`btn ${isActive ? 'active' : ''}`}>
          {/* <div style={{display: 'inline-block'}}>
            // TODO: re-implement multi-agency logos for route viewer.
              // Currently, the agency object is not nested within the get all
              // routes endpoint and causing this to only display transitOperators for
              // the selected route.
              // operator && <img src={operator.logo} style={{marginRight: '5px'}} height={25} />

          </div> */}
          <div style={{backgroundColor:backgroundColor,borderRadius:'8px',padding:'3px',color}}>
            <OpenMoveModeIcon mode={route.mode} width={20} height={20} />
            <strong className="shortname" style={{color:color}}> {route.shortName} </strong>
           </div>
          <p className="longname">{longName}</p>
        </div>
      </div>
    );
  }
}

export default RouteRow
