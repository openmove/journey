import { withNamespaces } from "react-i18next";
import currencyFormatter from "currency-formatter";
import { formatDuration, formatTime } from "../../core-utils/time";
import { configType, legType, timeOptionsType } from "../../core-utils/types";
import { isMobile } from "../../core-utils/ui";
import React from "react";
import PropTypes from "prop-types";

import AccessLegSummary from "./access-leg-summary";
import TaxiModal from "./taxiModal";
import { Button } from "react-bootstrap";

class TNCLeg extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isTaxiModalShown: false };
    this.showTaxiModal = this.showTaxiModal.bind(this);
    this.hideTaxiModal = this.hideTaxiModal.bind(this);
  }

  showTaxiModal() {
    this.setState({ isTaxiModalShown: true });
  }

  hideTaxiModal() {
    this.setState({ isTaxiModalShown: false });
  }

  render() {
    const {
      config,
      LYFT_CLIENT_ID,
      UBER_CLIENT_ID,
      followsTransit,
      leg,
      LegIcon,
      onSummaryClick,
      showLegIcon,
      timeOptions,
      t,
    } = this.props;
    const universalLinks = {
      UBER: `https://m.uber.com/${
        isMobile() ? "ul/" : ""
      }?client_id=${UBER_CLIENT_ID}&action=setPickup&pickup[latitude]=${
        leg.from.lat
      }&pickup[longitude]=${leg.from.lon}&pickup[formatted_address]=${encodeURI(
        leg.from.name
      )}&dropoff[latitude]=${leg.to.lat}&dropoff[longitude]=${
        leg.to.lon
      }&dropoff[formatted_address]=${encodeURI(leg.to.name)}`,
      LYFT: `https://lyft.com/ride?id=lyft&partner=${LYFT_CLIENT_ID}&pickup[latitude]=${leg.from.lat}&pickup[longitude]=${leg.from.lon}&destination[latitude]=${leg.to.lat}&destination[longitude]=${leg.to.lon}`,
    };
    const { tncData } = leg;
    console.log(config?.trip?.taxiModal);
    if (!tncData || !tncData.estimatedArrival) return null;
    return (
      <div>
        {config?.trip?.taxiModal?.enabled && config?.trip?.taxiModal?.api != null &&(
          <TaxiModal
            shown={this.state.isTaxiModalShown}
            open={this.showTaxiModal}
            close={this.hideTaxiModal}
            api={config?.trip?.taxiModal?.api}
          />
        )}
        <div>
          <small>
            <strong>
              {t("wait")}{" "}
              {!followsTransit && (
                <span>
                  {Math.round(tncData.estimatedArrival / 60)} {t("minutes")}{" "}
                </span>
              )}
              {t("for_arrival")} {t("of_taxi")}
              {tncData.displayName}
            </strong>
          </small>
        </div>

        <div className="otp-ui-legBody">
          {/* The icon/summary row */}
          <AccessLegSummary
            config={config}
            leg={leg}
            LegIcon={LegIcon}
            onSummaryClick={onSummaryClick}
            showLegIcon={showLegIcon}
          />

          {/* The "Book Ride" button */}
          <div className="otp-ui-bookTNCRideBtnContainer">
            {tncData.company != null && tncData.company != "NOAPI" && (
              <a
                className="otp-ui-TNCBookRideBtn"
                href={universalLinks[tncData.company]}
                target={isMobile() ? "_self" : "_blank"}
              >
                {t("book_ride")}
              </a>
            )}
            {tncData.company != null &&
              tncData.company == "NOAPI" &&
              tncData.productId == "Taxi" && (
                <Button bsStyle="primary" onClick={this.showTaxiModal}>
                  {t("book_ride")}
                </Button>
              )}
            {followsTransit && <div className="otp-ui-bookLaterPointer"></div>}
            {followsTransit && (
              <div className="otp-ui-bookLaterContainer">
                <div className="otp-ui-bookLaterContainer__innerContainer">
                  <div className="otp-ui-bookLaterContainer__text">
                    Wait until{" "}
                    {formatTime(
                      leg.startTime - tncData.estimatedArrival * 1000,
                      timeOptions
                    )}{" "}
                    to book
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* The estimated travel time */}
          <div>
            {t("estimated_time")}: {formatDuration(leg.duration)} ({" "}
            {t("does_not_account_for_traffic")} )
          </div>

          {/* The estimated travel cost */}
          {tncData.minCost != null && tncData.minCost > 0 && (
            <div>
              Estimated cost:{" "}
              {`${currencyFormatter.format(tncData.minCost, {
                code: tncData.currency,
              })} - ${currencyFormatter.format(tncData.maxCost, {
                code: tncData.currency,
              })}`}
            </div>
          )}
        </div>
      </div>
    );
  }
}
TNCLeg.propTypes = {
  config: configType.isRequired,
  LYFT_CLIENT_ID: PropTypes.string,
  UBER_CLIENT_ID: PropTypes.string,
  followsTransit: PropTypes.bool.isRequired,
  leg: legType.isRequired,
  LegIcon: PropTypes.elementType.isRequired,
  onSummaryClick: PropTypes.func.isRequired,
  showLegIcon: PropTypes.bool.isRequired,
  timeOptions: timeOptionsType,
};

TNCLeg.defaultProps = {
  LYFT_CLIENT_ID: "",
  UBER_CLIENT_ID: "",
  timeOptions: null,
};

export default withNamespaces()(TNCLeg);
