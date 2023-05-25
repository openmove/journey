// import React/Redux libraries
import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux'
import { withNamespaces } from "react-i18next";
// import Bootstrap Grid components for layout
import { Navbar, Grid, Row, Col, Nav } from "react-bootstrap";
// import OTP-RR components
import DefaultMainPanel from "./components/app/default-main-panel";
import LineItinerary from "./components/narrative/line-itin/line-itinerary";
import Map from "./components/map/map";
import MobileMain from "./components/mobile/main";
import ResponsiveWebapp from "./components/app/responsive-webapp";
import AppMenu from "./components/app/app-menu";
import Loading from "./components/narrative/loading";
import i18n from "./i18n";

import MenuItem from './components/app/menu-item'

import { setMapCenter, setMapZoom } from "./actions/config";

import mergeDeep from "./util/mergeDeep";

import interreg from "./images/interreg.png";
import openmove from "./images/openmove.png";
import merano from "./images/merano.png";
//import merano from "./images/ComuneMerano.png";
import bolzano from "./images/ComuneBolzano.png";
import MatomoIntegration from "./util/matomo-integration";

const logos = {
  interreg,
  openmove,
  merano,
  bolzano,
};

const JourneyWebapp = (props) => {
  const { t } = props;
  const { getItineraryFooter, LegIcon, ModeIcon } = props.jsConfig;

  if (!LegIcon || !ModeIcon) {
    throw new Error("LegIcon and ModeIcon must be defined in config.js");
  }

  const [loadingState, setLoadingState] = useState(false);

  const theme = useSelector((state) => state.otp.config.theme )
  const brandNavbar = useSelector((state) => state.otp.config?.brandNavbar);
  const brandNavbarLogo = useSelector((state) => state.otp.config?.brandNavbarLogo);
  const footer = useSelector((state) => state.otp.config?.footer)
  const header = useSelector((state) => state.otp.config?.header)
  const documentTitle = useSelector((state) => state.otp.config?.title)

  let brandLogo =  logos[brandNavbarLogo] || brandNavbarLogo;

  const desktopFooter = (
    <div className="footer-container">
      <div className="footer-left-container">
        <div>
        {/*

        TODO include footer by theme directory footer.html

        */}
          <img src="/static/images/trentino-pat.png" />
        </div>
      </div>
      <div className="footer-right-container">
        <ul>
          {footer.navList &&
              footer.navList.map((item,index)=>(
                <li key={index}>
                  <MenuItem {...item}/>
                </li>
              ))
          }
        </ul>
      </div>
    </div>
  )

const desktopNav = (
  <Navbar fluid collapseOnSelect fixedTop>
    <Navbar.Header>
      {brandLogo && <img className="brandLogo" src={brandLogo} />}
      <Navbar.Brand>
        {" "}
        {brandNavbar && (<>{brandNavbar} <span>BETA</span></>)}
      </Navbar.Brand>
      <Navbar.Toggle />
    </Navbar.Header>
    <Navbar.Collapse>
      <Nav pullRight>
        <AppMenu />
      </Nav>
    </Navbar.Collapse>
  </Navbar>
)


  /** desktop view **/
  const desktopView = (
    <>
    <div className="otp">
      {header.enabled && desktopNav}

      <div className={`main-container ${header.enabled ? '' : 'top-positioned'}`}>
        <div className="sidebar">
          {/* <main> is needed for accessibility checks. */}
          <main>
            <DefaultMainPanel
              itineraryClass={LineItinerary}
              itineraryFooter={getItineraryFooter(t)}
              LegIcon={LegIcon}
              ModeIcon={ModeIcon}
            />
          </main>
        </div>

        <div className="map-container">
          <Map />
        </div>
      </div>

      {footer.enabled && desktopFooter }
    </div>
    </>
  );

  /** mobile view **/
  const mobileView = (
    // <main> is needed for accessibility checks.
    <main>
      <MobileMain
        map={<Map />}
        itineraryClass={LineItinerary}
        itineraryFooter={getItineraryFooter(t)}
        LegIcon={LegIcon}
        ModeIcon={ModeIcon}
      />
    </main>
  );
  /** the main webapp **/
  return (
    <>
      <ResponsiveWebapp
        desktopView={desktopView}
        // Pass the LegIcon here for use in the print view.
        LegIcon={LegIcon}
        mobileView={mobileView}
      />
      <MatomoIntegration t={t} />
    </>
  );
}

export default withNamespaces()(JourneyWebapp);
