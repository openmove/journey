import { configType, legType } from "../../core-utils/types";
import {
  getCompaniesLabelFromNetworks,
  getModeForPlace
} from "../../core-utils/itinerary";
import React from "react";

/**
 * A component to display vehicle rental data. The word "Vehicle" has been used
 * because a future refactor is intended to combine car rental, bike rental
 * and micromobility rental all within this component. The future refactor is
 * assuming that the leg.rentedCar and leg.rentedBike response elements from OTP
 * will eventually be merged into the leg.rentedVehicle element.
 */
export default function RentedVehicleSubheader({ config, leg }) {
  const configCompanies = config.companies || [];

  // Sometimes rented vehicles can be walked over things like stairs or other
  // ways that forbid the main mode of travel.
  if (leg.mode === "WALK") {
    return (
      <div>
        <small>
          <strong>Walk vehicle along {leg.from.name}</strong>
        </small>
      </div>
    );
  }

  let rentalDescription;
  if (leg.rentedBike) {
    // TODO: Special case for TriMet may need to be refactored.
    rentalDescription = "Pick up shared bike";
  } else {
    // Add company and vehicle labels.
    let companyName = "";
    let vehicleName = "";
    // TODO allow more flexibility in customizing these mode strings
    let modeString = leg.rentedVehicle
      ? "E-scooter"
      : leg.rentedBike
      ? "bike"
      : "car";

    // The networks attribute of the from data will only appear at the very
    // beginning of the rental. It is possible that there will be some forced
    // walking that occurs in the middle of the rental, so once the main mode
    // resumes there won't be any network info. In that case we simply return
    // that the rental is continuing.
    if (leg.from.networks) {
      companyName = getCompaniesLabelFromNetworks(
        leg.from.networks,
        configCompanies
      );
      // Only show vehicle name for car rentals. For bikes and E-scooters, these
      // IDs/names tend to be less relevant (or entirely useless) in this context.
      if (leg.rentedCar && leg.from.name) {
        vehicleName = leg.from.name;
      }
      modeString = getModeForPlace(leg.from);
      rentalDescription = `Pick up ${companyName} ${modeString} ${vehicleName}`;
    } else {
      rentalDescription = "Continue using rental";
    }
  }
  // e.g., Pick up REACHNOW rented car XYZNDB OR
  //       Pick up SPIN E-scooter
  //       Pick up shared bike
  return <small><strong>{rentalDescription}</strong></small>;
}

RentedVehicleSubheader.propTypes = {
  config: configType.isRequired,
  leg: legType.isRequired
};
