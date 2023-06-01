import { legType } from "../core-utils/types";
import { formatDuration } from "../core-utils/time";
import { withNamespaces } from "react-i18next";
import PropTypes from "prop-types";
import React from "react";

function TNCLeg({ leg, LegIcon, t }) {
  const { tncData } = leg;
  if (!tncData) return null;

  return (
    <div className="otp-ui-printableItineraryLeg">
      <div className="otp-ui-printableItineraryLeg__icon">
        <LegIcon leg={leg} />
      </div>
      <div className="otp-ui-printableItineraryLeg__body">
        <div className="otp-ui-printableItineraryLeg__header">
          <strong> {t('take')} {tncData.displayName}</strong> {t('to')} <strong>{leg.to.name}</strong>
        </div>
        <div className="otp-ui-printableItineraryLeg__detail">
          <div>
            {t('ETA_for_a_driver')}:{" "}
            <strong>{formatDuration(tncData.estimatedArrival)}</strong>
          </div>
          <div>
            {t('estimated_time')}: <b>{formatDuration(leg.duration)}</b> {t('does_not_account_for_traffic')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withNamespaces()(TNCLeg)

TNCLeg.propTypes = {
  leg: legType.isRequired,
  LegIcon: PropTypes.elementType.isRequired
};
