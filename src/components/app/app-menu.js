import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { NavDropdown, MenuItem as BMenuItem } from "react-bootstrap";
import { withNamespaces } from "react-i18next";
import MenuItem from "./menu-item/index";

import {
  MainPanelContent,
  setMainPanelContent,
  routeTo,
} from "../../actions/ui";

// TODO: make menu items configurable via props/config

class AppMenu extends Component {
  static propTypes = {
    setMainPanelContent: PropTypes.func,
    routeTo: PropTypes.func,
  };

  constructor(props) {
    super(props);
  }



  render() {
    const { navList = [] , isHeaderEnabled} = this.props;

    return (
      <>
        { isHeaderEnabled && navList.map((item, index) => {
          return (
              <MenuItem
                {...item}
                key={index}
                index={index}
                setMainPanelContent={this.props.setMainPanelContent}
                routeTo={this.props.routeTo}
              />
          );
        })}
      </>
    );
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    currentLocation: state.router.location,
    isHeaderEnabled: state.otp.config.header.enabled,
    navList: state.otp.config.header.navList,
  };
};

const mapDispatchToProps = {
  setMainPanelContent,
  routeTo,
};

export default connect(mapStateToProps, mapDispatchToProps)(AppMenu);
