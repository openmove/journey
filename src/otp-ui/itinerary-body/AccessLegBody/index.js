import { formatDuration } from "../../core-utils/time";
import {
  configType,
  legType,
  timeOptionsType
} from "../../core-utils/types";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { VelocityTransitionGroup } from "velocity-react";
import { Button } from 'react-bootstrap'
import { CaretDown, CaretUp } from "@styled-icons/fa-solid";

import AccessLegSteps from "./access-leg-steps";
import AccessLegSummary from "./access-leg-summary";
import LegDiagramPreview from "./leg-diagram-preview";
import RentedVehicleSubheader from "./rented-vehicle-subheader";
import TNCLeg from "./tnc-leg";
import { withNamespaces } from "react-i18next";
import { ExclamationTriangle } from "@styled-icons/fa-solid";
import ContextualizedTrails from "../../../components/narrative/line-itin/contextualized-trails";

/**
 * Component for access (e.g. walk/bike/etc.) leg in narrative itinerary. This
 * particular component is used in the line-itin (i.e., trimet-mod-otp) version
 * of the narrative itinerary.
 */
 class AccessLegBody extends Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  onStepsHeaderClick = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  };

  onSummaryClick = () => {
    const { leg, legIndex, setActiveLeg } = this.props;
    setActiveLeg(legIndex, leg);
  };

  render() {
    const {
      config,
      diagramVisible,
      followsTransit,
      leg,
      LegIcon,
      setLegDiagram,
      showElevationProfile,
      showLegIcon,
      timeOptions,
      isLastLeg,
      t
    } = this.props;
    const { expanded } = this.state;
    const safetyTrailMessage = config?.trip?.safetyTrailMessage;

    if (leg.mode === "CAR" && leg.hailedCar) {
      return (
        <TNCLeg
          config={config}
          followsTransit={followsTransit}
          leg={leg}
          LegIcon={LegIcon}
          onSummaryClick={this.onSummaryClick}
          showLegIcon={showLegIcon}
          timeOptions={timeOptions}
        />
      );
    }

    return (
      <>
        {/* Place subheading: rented vehicle (e.g., scooter, bike, car)
          pickup */}
        {leg && (leg.rentedVehicle || leg.rentedBike || leg.rentedCar) && (
          <RentedVehicleSubheader config={config} leg={leg} />
        )}
        <div className="otp-ui-legBody">
        {(config?.trip?.contextualizedTrails?.enabled  && leg.distance > 100 && leg.mode !== "CAR" )&& (
        <ContextualizedTrails
            leg={leg}
         />
       )}
        {(safetyTrailMessage?.enabled && leg.distance > 1000 && leg.mode !== "CAR" ) && (
            <div className="trails-safety-message">
                 <ExclamationTriangle size={18} />
              <div className="content">
                {t("trails_safety_message")}
                {safetyTrailMessage?.url &&(
                  <a href={safetyTrailMessage?.url} className="more-info-url" target="_blank">
                    {t("trails_safety_url_label")}
                  </a>
                )}
              </div>
          </div>
        )}
          <AccessLegSummary
            config={config}
            leg={leg}
            LegIcon={LegIcon}
            onSummaryClick={this.onSummaryClick}
            showLegIcon={showLegIcon}
          />
          <Button bsStyle="link" bsSize="small" onClick={this.onStepsHeaderClick}>
            {formatDuration(leg.duration)}
            {leg.steps && (
              <span>
                {" "}
                {expanded ? <CaretUp size={15} /> : <CaretDown size={15} />}
              </span>
            )}
          </Button>

          <VelocityTransitionGroup
            enter={{ animation: "slideDown" }}
            leave={{ animation: "slideUp" }}
          >
            {expanded && <AccessLegSteps steps={leg.steps} />}
          </VelocityTransitionGroup>

          <LegDiagramPreview
            diagramVisible={diagramVisible}
            leg={leg}
            setLegDiagram={setLegDiagram}
            showElevationProfile={showElevationProfile}
          />
        </div>
      </>
    );
  }
}

AccessLegBody.propTypes = {
  config: configType.isRequired,
  /**
   * Should be either null or a legType. Indicates that a particular leg diagram
   * has been selected and is active.
   */
  diagramVisible: legType,
  followsTransit: PropTypes.bool,
  leg: legType.isRequired,
  LegIcon: PropTypes.elementType.isRequired,
  legIndex: PropTypes.number.isRequired,
  setActiveLeg: PropTypes.func.isRequired,
  setLegDiagram: PropTypes.func.isRequired,
  showElevationProfile: PropTypes.bool.isRequired,
  showLegIcon: PropTypes.bool.isRequired,
  timeOptions: timeOptionsType
};

AccessLegBody.defaultProps = {
  diagramVisible: null,
  followsTransit: false,
  timeOptions: null
};

export default withNamespaces()(AccessLegBody);
