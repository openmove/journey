import { getElevationProfile } from "../../core-utils/itinerary";
import { legType } from "../../core-utils/types";
import PropTypes from "prop-types";
import React, { Component } from "react";
import ReactResizeDetector from "react-resize-detector";
import { withNamespaces } from "react-i18next"

const METERS_TO_FEET = 1;

function generateSvg(profile, width) {
  const height = 30;
  const { points: ptArr, traversed } = profile;
  let { minElev, maxElev } = profile;
  // Pad the min-max range by 25m on either side
  minElev -= 25;
  maxElev += 25;

  // Transform the point array and store it as an SVG-ready string
  const pts = ptArr
    .map(pt => {
      const x = (pt[0] / traversed) * width;
      const y = height - (height * (pt[1] - minElev)) / (maxElev - minElev);
      return `${x},${y}`;
    })
    .join(" ");

  // Render the SVG
  return (
    <svg height={height} width={width}>
      <polyline points={pts} fill="none" stroke="black" strokeWidth={1.3} />
    </svg>
  );
}

class LegDiagramPreview extends Component {
  constructor(props) {
    super(props);
    this.state = { width: null };
  }

  onResize = width => {
    if (width > 0) {
      this.setState({ width });
    }
  };

  /**
   * Determine if the diagram currently visible is for this leg (based on start
   * time).
   */
  isActive = () => {
    const { diagramVisible, leg } = this.props;
    return diagramVisible && diagramVisible.startTime === leg.startTime;
  };

  onExpandClick = () => {
    const { leg, setLegDiagram } = this.props;
    if (this.isActive()) setLegDiagram(null);
    else setLegDiagram(leg);
  };

  /** Round elevation to whole number and add symbol. */
  formatElevation = elev => `${Math.round(elev)}m`;

  render() {
    const { leg, showElevationProfile, t } = this.props;
    const { width } = this.state;
    if (!showElevationProfile) return null;
    const profile = getElevationProfile(leg.steps);
    // Don't show for very short legs
    if (leg.distance < 500 || leg.mode === "CAR") return null;

    return (
      <div className={`otp-ui-chartPreview ${this.isActive() ? 'is-active' : ''}`}>
        {/* The preview elevation SVG */}
        {/* eslint-disable-next-line */}
        <button
          className="otp-ui-chartPreview__diagram"
          tabIndex="0"
          title={t('toggle_elevation_chart')}
          role="button"
          onClick={this.onExpandClick}
        >
          <div className="otp-ui-chartPreview__diagramTitle">
            {t('altimetry')}{" "}
            <span className="otp-ui-chartPreview__diagramElevationGain">
              ↑{this.formatElevation(profile.gain)}
              {"  "}
            </span>
            <span className="otp-ui-chartPreview__diagramElevationLoss">
              ↓{this.formatElevation(-profile.loss)}
            </span>
          </div>
          {profile.points.length > 0
            ? generateSvg(profile, width)
            : t("altimetry_unavailable")}
          <ReactResizeDetector handleWidth onResize={this.onResize} />
        </button>
      </div>
    );
  }
}

LegDiagramPreview.propTypes = {
  diagramVisible: legType,
  leg: legType.isRequired,
  setLegDiagram: PropTypes.func.isRequired,
  showElevationProfile: PropTypes.bool.isRequired
};

LegDiagramPreview.defaultProps = {
  diagramVisible: null
};

export default withNamespaces()(LegDiagramPreview);
