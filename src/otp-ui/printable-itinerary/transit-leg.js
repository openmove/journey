import { formatTime } from "../core-utils/time";
import {
  legType,
  timeOptionsType
} from "../core-utils/types";
import PropTypes from "prop-types";
import React from "react";
import { withNamespaces } from "react-i18next";

function TransitLeg({
  leg,
  LegIcon,
  interlineFollows,
  timeOptions,
  t
}) {
  // Handle case of transit leg interlined w/ previous
  if (leg.interlineWithPreviousLeg) {
    return (
      <div className="otp-ui-printableItineraryLeg otp-ui-printableItineraryLeg--noBorder">
        <div className="otp-ui-printableItineraryLeg__body">
          <div className="otp-ui-printableItineraryLeg__header">
            {t('continues_as')}
            <strong>
              {leg.routeShortName} {leg.routeLongName}
            </strong>{" "}
            {t('to')} <strong>{leg.to.name}</strong>
          </div>
          <div className="otp-ui-printableItineraryLeg__detail">
            <div>
              {t('drop_off')} <b>{leg.to.name}</b> {t('at_time')}{" "}
              {formatTime(leg.endTime, timeOptions)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="otp-ui-printableItineraryLeg">
      <div className="otp-ui-printableItineraryLeg__icon">
        <LegIcon leg={leg} />
      </div>
      <div className="otp-ui-printableItineraryLeg__body">
        <div className="otp-ui-printableItineraryLeg__header">
          <strong>
            {leg.routeShortName} {leg.routeLongName}
          </strong>{" "}
          {t('to')} <strong>{leg.to.name}</strong>
        </div>
        <div className="otp-ui-printableItineraryLeg__detail">
          <div>
            {t('board_at')} <b>{leg.from.name}</b> {t('at_time')}{" "}
            {formatTime(leg.startTime, timeOptions)}
          </div>
          <div>
            {interlineFollows ? (
              <span>
                {t('stay_onboard_at')} <b>{leg.to.name}</b>
              </span>
            ) : (
              <span>
                {t('drop_off')} <b>{leg.to.name}</b> {t('at_time')}{" "}
                {formatTime(leg.endTime, timeOptions)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withNamespaces()(TransitLeg)

TransitLeg.propTypes = {
  interlineFollows: PropTypes.bool,
  leg: legType.isRequired,
  LegIcon: PropTypes.elementType.isRequired,
  timeOptions: timeOptionsType
};

TransitLeg.defaultProps = {
  interlineFollows: false,
  timeOptions: null
};
