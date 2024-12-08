import React, { Component } from "react";
import { withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import {
  contextualizedTrailsQuery,
  setViewedTrail,
} from "../../../../src/actions/trails";
import { getActiveSearch } from "../../../util/state";
import {
  areSomePointsContainedInPolylines,
  isMarkerInsidePolygon,
} from "../../../otp-ui/core-utils/itinerary";
import BusDrt from "../../../otp-ui/icons/openmove/BusDrt";
import L from "leaflet";

// truncate to third decimal place
const truncate = (n) => Math.floor(n * 1000) / 1000;
const truncateCoordinate = ({ lat, lon }) => ({
  lat: truncate(lat),
  lon: truncate(lon),
});

function getLegNearbySearchPoint(leg, isLastLeg, contextualizedTrailsConfig) {
  if (contextualizedTrailsConfig?.enabled) {
    const place = !isLastLeg ? leg?.from : leg?.to;

    if (place?.lat && place?.lon) {
      return truncateCoordinate(place);
    }
  }
  return {};
}

class ContextualizedTrails extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const contextualizedTrailsConfig = this.props?.contextualizedTrailsConfig;

    if (!contextualizedTrailsConfig?.enabled) {
      return;
    }

    this.query(
      this.props.legStartingPoint,
      this.props.legName,
      contextualizedTrailsConfig
    );
    /* this.fetchAreas(contextualizedTrailsConfig?.areasUrl).then((areas) => {
      if (!areas?.length) {
        this.setState({ arePointsInDrtArea: false });
        return;
      }

      const arePointsInDrtArea = areSomePointsContainedInPolylines(
        this.points,
        areas.map((area) => area.points)
      );

      this.setState({ arePointsInDrtArea });
    }); */
  }

  query(point, name, contextualizedTrailsConfig) {
    let categories = contextualizedTrailsConfig?.categories
      ? contextualizedTrailsConfig?.categories
      : [];

    if (
      this.props?.currentSearchModes &&
      this.props?.currentSearchModes?.length === 1
    ) {
      const category = this.props?.currentSearchModes[0];
      const walkCategories = contextualizedTrailsConfig?.walkCategories;
      const bikeCategories = contextualizedTrailsConfig?.bikeCategories;

      if (category === "WALK") {
        categories = walkCategories ? walkCategories : [];
      } else if (category === "BICYCLE") {
        categories = bikeCategories ? bikeCategories : [];
      }
    }

    const params = {
      lon: point.lon,
      lat: point.lat,
      radius: contextualizedTrailsConfig?.radius || 1000,
      key: contextualizedTrailsConfig.apiKey,
      lang: this.props.i18n.language,
      sortby: "distance",
      userId: contextualizedTrailsConfig.userId,
      "tag[]": categories.join("&tag[]="),
    };

    this.props.contextualizedTrailsQuery(
      contextualizedTrailsConfig.apiNearby,
      contextualizedTrailsConfig.apiOOIs,
      params,
      name
    );
  }

  render() {
    const { t, isLastLeg, contextualizedTrailsConfig } = this.props;

    if (
      !contextualizedTrailsConfig ||
      !this.props?.contextualizedTrailsConfig?.enabled ||
      !this.props?.trails ||
      !(this.props?.trails?.length > 0)
    ) {
      return <></>;
    }

    return (
      <div
        className={isLastLeg ? "otp-ui-contextualized-trails-destination" : ""}
      >
        {this.props.t("trails_context_message")}
        <ul>
          {this.props?.trails.map((trail) => (
            <li key={trail?.id}>
              {" "}
              <a
                onClick={() => {
                  this.props.setViewedTrail(trail?.id);
                }}
              >
                {trail.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  const contextualizedTrailsConfig =
    state.otp.config?.trip?.contextualizedTrails;
  const activeSearch = getActiveSearch(state.otp);
  const currentSearchModes = activeSearch?.query?.mode?.split(",");

  const legStartingPoint = getLegNearbySearchPoint(
    ownProps.leg,
    ownProps.isLastLeg,
    contextualizedTrailsConfig
  );
  const legName = JSON.stringify(legStartingPoint);

  return {
    legStartingPoint,
    legName,
    trails: state.otp.transitIndex?.trails?.[legName],
    contextualizedTrailsConfig,
    currentSearchModes,
  };
};

const mapDispatchToProps = {
  setViewedTrail,
  contextualizedTrailsQuery,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces()(ContextualizedTrails));
