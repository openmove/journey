import React, { Component } from "react";
import { withNamespaces } from "react-i18next";
import { areSomePointsContainedInPolylines, isMarkerInsidePolygon } from "../../../otp-ui/core-utils/itinerary";
import BusDrt from "../../../otp-ui/icons/openmove/BusDrt";
import L from "leaflet";

// truncate to third decimal place
const truncate = (n) => Math.floor(n * 1000) / 1000;
const truncateCoordinate = ({ lat, lon }) => ({
  lat: truncate(lat),
  lon: truncate(lon),
});


class DrtLocalizedService extends Component {
  constructor(props) {
    super(props);
    if (this.props.itinerary) {
      this.points = this.mapItineraryToPoints(
        this.props.itinerary,
        this.props.localizedDrtConfig
      );
    } else if (this.props.query) {
      this.points = this.mapQueryToPoints(
        this.props.query,
        this.props.localizedDrtConfig
      );
    } else {
      console.error("Missing required prop: provide itinerary or query");
    }
    this.state = { arePointsInDrtArea: false };
  }

   mapItineraryToPoints(itinerary, localizedDrtConfig) {
    const pointsOnItinerary = [];

    if (localizedDrtConfig?.enabled) {
      itinerary?.legs.forEach((leg) => {
        const from = leg?.from;
        if (from?.lat && from?.lon) {
          pointsOnItinerary.push(truncateCoordinate(from));
        }

        const to = leg?.to;
        if (to?.lat && to?.lon) {
          pointsOnItinerary.push(truncateCoordinate(to));
        }
      });
    }
    return pointsOnItinerary;
  }

   mapQueryToPoints(query, localizedDrtConfig) {
    const pointsOnQuery = [];

    if (localizedDrtConfig?.enabled) {
      const from = query?.from;
      if (from?.lat && from?.lon) {
        pointsOnQuery.push(truncateCoordinate(from));
      }

      const to = query?.to;
      if (to?.lat && to?.lon) {
        pointsOnQuery.push(truncateCoordinate(to));
      }
    }
    return pointsOnQuery;
  }


  async fetchAreas(areasUrl) {
    return fetch(areasUrl)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network Error");
      })
      .catch((error) => {
        // just ignore errors
        console.error("Network error while retrieving localized drt areas");
      });
  }

  componentDidMount() {
    const localizedDrtConfig = this.props?.localizedDrtConfig;

    if (!localizedDrtConfig?.enabled || !localizedDrtConfig?.areasUrl) {
      return;
    }

    this.fetchAreas(localizedDrtConfig?.areasUrl).then((areas) => {
      if (!areas?.length) {
        this.setState({ arePointsInDrtArea: false });
        return;
      }

      const arePointsInDrtArea = areSomePointsContainedInPolylines(
        this.points,
        areas.map((area) => area.points)
      );

      this.setState({ arePointsInDrtArea });
    });
  }

  render() {
    const { t,localizedDrtConfig } = this.props;

    if (
      !localizedDrtConfig ||
      !this.state.arePointsInDrtArea ||
      !this.props?.localizedDrtConfig?.enabled
    ) {
      return null;
    }

    if (this.props?.simplified) {
      return (
        <>
          {" " + t(localizedDrtConfig.noPathFoundMessage) + " "}
          {localizedDrtConfig.links.map(({ url, label }) => (
            <>
              <a key={url}  href={url} style={{marginLeft:"10px"}}>{label}</a>{" "}
            </>
          ))}
        </>
      );
    }

    return (
      <div className="localized-drt">
        <BusDrt width={40} height={40} />

        <p> {" " + t(localizedDrtConfig.message) + " "}</p>
        {localizedDrtConfig.links.map(({ url, label }) => (
          <>
            <a key={url} href={url}>{label}</a>{" "}
          </>
        ))}
      </div>
    );
  }
}

export default withNamespaces()(DrtLocalizedService);
