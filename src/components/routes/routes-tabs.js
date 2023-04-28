import React, { Component } from "react";
import {  /* Pagination */ } from "react-bootstrap";
import { withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import OpenMoveModeIcon from "../../otp-ui/icons/openmove-mode-icon";
import { Tabs, Tab } from "react-bootstrap";
import { setViewedRoute } from "../../actions/ui";
import { findRoute } from "../../actions/api";
import InfinityScroll from "./infinity-scroll";
import RouteRow from "./route-row";
import Search from "./search";
import FontAwesome from "react-fontawesome";

// --- TABS ---
class RoutesTabs extends Component {
  constructor(props) {
    super(props);
    this.state = { activeTab: "search", filteredList: [] };

    this.setFilteredList = this.setFilteredList.bind(this);
  }

  generateRouteRow(route) {
    return (
      // Find operator based on agency_id (extracted from OTP route ID).
      // TODO: re-implement multi-agency logos for route viewer.
      // const operator = operatorForRoute(transitOperators, route) || {}
      <RouteRow
        findRoute={this.props.findRoute}
        isActive={
          this.props.viewedRoute && this.props.viewedRoute.routeId === route.id
        }
        key={route.id}
        // operator={operator}
        route={route}
        setViewedRoute={this.props.setViewedRoute}
        t={this.props.t}
      />
    );
  }

  setFilteredList(filteredList) {
    this.setState({ filteredList });
  }

  render() {
    let modes = this.props.modes;
    const {t} = this.props;
    modes.sort();

    return (
      <Tabs
        activeKey={this.state.activeTab}
        onSelect={(mode) => this.setState({ activeTab: mode, activePage: 0 })}
        justify="true"
        id="routes-tabs"
      >
        <Tab
          eventKey={"search"}
          title={
            <div className="routes-tabs-title">
              {" "}
              <p>{t('search')}</p>{" "}
              <FontAwesome name="search" tag="i" />
            </div>
          }
          eventKey={"search"}
          key={"search"}
          animation={false}
        >
          <Search
            completeList={this.props.routes}
            setFilteredList={this.setFilteredList}
          />
          <InfinityScroll
            postProcess={(route) => this.generateRouteRow(route)}
            completeList={this.state.filteredList}
            increaseStep={40}
            offset={0}
            height={"calc( 100% - 40px)"}
            className={"routes-tabs-infinity-scroll"}
          />
        </Tab>
        {modes.map((mode) => (
          <Tab
            eventKey={mode}
            title={
              <div className="routes-tabs-title">
                {" "}
                <p>{t(mode.toLowerCase())}</p>{" "}
                <OpenMoveModeIcon mode={mode} width={20} height={20} />
              </div>
            }
            eventKey={mode}
            key={mode}
          >
            <InfinityScroll
              postProcess={(route) => this.generateRouteRow(route)}
              completeList={this.props.groupedRoutes[mode]}
              increaseStep={10}
              offset={0}
              className={"routes-tabs-infinity-scroll"}
            />
          </Tab>
        ))}
      </Tabs>
    );
  }
}

// divides routes into pages not used anymore
/* <Pagination>
  {tabs[mode] &&
    tabs[mode].length &&
    Array.from(Array(tabs[mode].length).keys()).map((pageIndex) => (
      <Pagination.Item
        onClick={() => {
          this.setState({ activePage: pageIndex });
        }}
        active={this.state.activePage === pageIndex}
        key={pageIndex}
      >
        {pageIndex}
      </Pagination.Item>
  ))}
</Pagination > */

// connect to redux store
const mapStateToProps = (state, ownProps) => {
  return {
    // transitOperators: state.otp.config.transitOperators,
    viewedRoute: state.otp.ui.viewedRoute,
  };
};

const mapDispatchToProps = {
  setViewedRoute,
  findRoute,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(RoutesTabs)
);
