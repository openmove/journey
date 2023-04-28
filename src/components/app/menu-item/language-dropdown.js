import React, { Component } from "react";
import { withNamespaces } from "react-i18next";
import { NavDropdown ,MenuItem} from "react-bootstrap";
import { connect } from "react-redux";

class LanguageDropDown extends Component{
  _getLanguageLabel = () => {
    const { lng } = this.props;

    if (lng === "it") return "Italiano";
    if (lng === "en") return "English";
    if (lng === "de") return "Deutsch";
  };

  render() {
    const { languageConfig, i18n, t } = this.props;
    const langList = languageConfig?.langList;

    if (!this.props.enabled && langList && Array.isArray(langList) && langList.length > 1 ) {
      return null;
    }

    return(
        <NavDropdown
          id="language-dropdown"
          aria-label="Choose Language"
          title={this._getLanguageLabel()}
        >
          {langList.map((slang, index) => {
            return (
              <MenuItem
                onClick={() => i18n.changeLanguage(slang.lang)}
                key={index}
              >
                {slang.label}
              </MenuItem>
            );
          })}
        </NavDropdown>
      );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    languageConfig: state.otp.config.language,
  };
};

export default withNamespaces()(connect(mapStateToProps)(LanguageDropDown));
