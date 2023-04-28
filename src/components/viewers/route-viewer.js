import coreUtils from "../../otp-ui/core-utils";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";
import { connect } from "react-redux";
import { withNamespaces } from "react-i18next";
import RoutesTabs from "../routes/routes-tabs";
import Icon from "../narrative/icon";
import { setMainPanelContent } from "../../actions/ui";
import { findRoutes } from "../../actions/api";

function operatorIndexForRoute(transitOperators, route) {
  if (!route.agency) return 0;
  const index = transitOperators.findIndex(
    (o) => o.id.toLowerCase() === route.agency.id.split(":")[0].toLowerCase()
  );
  if (index !== -1 && typeof transitOperators[index].order !== "undefined")
    return transitOperators[index].order;
  else return 0;
}

class RouteViewer extends Component {
  static propTypes = {
    hideBackButton: PropTypes.bool,
    routes: PropTypes.object,
  };

  _backClicked = () => this.props.setMainPanelContent(null);

  componentDidMount() {
    this.props.findRoutes();
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#grouping_objects_by_a_property
  groupBy(objectArray, property, defaultProp = 'not-specified') {

    return objectArray.reduce((acc, obj) => {
      const key = obj[property] ?  obj[property] : defaultProp;

      const curGroup = acc[key] ?? [];

      return { ...acc, [key]: [...curGroup, obj] };
    }, {});
  }

  render() {
    const {
      hideBackButton,
      languageConfig,
      transitOperators,
      routes,
      t,
    } = this.props;

    const sortedRoutes = routes
      ? Object.values(routes).sort(coreUtils.route.routeComparator)
      : [];

    const agencySortedRoutes =
      transitOperators.length > 0
        ? sortedRoutes.sort((a, b) => {
            return (
              operatorIndexForRoute(transitOperators, a) -
              operatorIndexForRoute(transitOperators, b)
            );
          })
        : sortedRoutes;

    const groupedRoutes = this.groupBy(agencySortedRoutes, "mode");

    return (
      <div className="route-viewer">
        {/* Header Block */}
        <div className="route-viewer-header">
          {/* Back button */}
          {!hideBackButton && (
            <div className="back-button-container">
              <Button bsSize="small" onClick={this._backClicked}>
                <Icon type="arrow-left" />
                {t("back")}
              </Button>
            </div>
          )}

          {/* Header Text */}
          <div className="header-text">
            {t(languageConfig.routeViewer || "route_viewer")}
          </div>
          <div className="">{t(languageConfig.routeViewerDetails)}</div>
          <div style={{ clear: "both" }} />
        </div>

        <div className="route-viewer-body">
          <RoutesTabs
            groupedRoutes={groupedRoutes}
            routes={agencySortedRoutes}
            modes={Object.keys(groupedRoutes)}
          />
        </div>
      </div>
    );
  }
}

// connect to redux store

const mapStateToProps = (state, ownProps) => {
  return {
    transitOperators: state.otp.config.transitOperators,
    routes: state.otp.transitIndex.routes,
    languageConfig: state.otp.config.language,
  };
};

const mapDispatchToProps = {
  findRoutes,
  setMainPanelContent,
};

export default withNamespaces()(
  connect(mapStateToProps, mapDispatchToProps)(RouteViewer)
);
