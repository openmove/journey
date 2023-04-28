import React, { Component } from "react";
import { withNamespaces } from "react-i18next";

import Modal from "./modal";
import NavItem from "./nav-item";
import LanguageDropdown from "./language-dropdown";
class MenuItem extends Component {
  render() {
    const { t } = this.props;

    if (!this.props.enabled) {
      return null;
    }

    switch (this.props.type) {
      case "link":
        return <a href={this.props.linkUrl || "#"}> {t(this.props.name)} </a>;
      case "nav-item":
        return <NavItem {...this.props} />;
      case "nav-modal":
        return (
          <Modal
            MenuItem={(props) => (
              <NavItem {...this.props} onClick={props.onClick} />
            )}
            title={this.props.name}
            name={this.props.name}
            text={this.props.text}
            htmlUrl={this.props.htmlUrl}
          />
        );
      case "link-modal":
        return (
          <Modal
            MenuItem={(props) => (
              <a onClick={props.onClick}>
                {" "}
                {t(this.props.name)}{" "}
              </a>
            )}
            title={this.props.name}
            name={this.props.name}
            text={this.props.text}
            htmlUrl={this.props.htmlUrl}
          />
        );
      case "language-dropdown":
        return <LanguageDropdown {...this.props} />;
      default:
        return null;
    }
  }
}

export default withNamespaces()(MenuItem);
