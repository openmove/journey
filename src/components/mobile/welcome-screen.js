import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withNamespaces } from 'react-i18next'
import MobileContainer from './container'
import LocationField from '../form/connected-location-field'
import DefaultMap from '../map/default-map'
import MobileNavigationBar from './navigation-bar'
import { MobileScreens, setMobileScreen } from '../../actions/ui'
import { setLocationToCurrent } from '../../actions/map'
import MenuItem from '../app/menu-item';


class MobileWelcomeScreen extends Component {
  static propTypes = {
    map: PropTypes.element,

    setLocationToCurrent: PropTypes.func,
    setMobileScreen: PropTypes.func
  }

  _toFieldClicked = () => {
    this.props.setMobileScreen(MobileScreens.SET_INITIAL_LOCATION)
  }

  /* Called when the user selects a from/to location using the selection
   * popup (invoked in mobile mode via a long tap). Note that BaseMap already
   * takes care of updating the query in the store w/ the selected location */

  _locationSetFromPopup = (selection) => {
    // If the tapped location was selected as the 'from' endpoint, set the 'to'
    // endpoint to be the current user location. (If selected as the 'to' point,
    // no action is needed since 'from' is the current location by default.)
    if (selection.type === 'from') {
      this.props.setLocationToCurrent({ locationType: 'to' })
    }
  }

  render () {
    const { title, t, footer } = this.props

    return (
      <MobileContainer>
        <MobileNavigationBar title={title} />
        <div className='welcome-location p-1'>
          <LocationField
            inputPlaceholder={t('where_go')}
            locationType='to'
            onTextInputClick={this._toFieldClicked}
            showClearButton={false}
          />
        </div>
        <div className='welcome-map'>
          <DefaultMap onSetLocation={this._locationSetFromPopup} />
        </div>

        {footer?.enabled && (
        <div className="mobile-footer">
            <div className="footer-left-container-mobile">
              <div>
              {/*

              TODO include footer by theme directory footer.html

              */}
                <img src="/static/images/trentino-pat.png" />
              </div>
            </div>
            <div className="footer-right-container-mobile">
              <ul>
              {footer?.navLinks &&
                 footer?.navLinks .map((item,index)=>(
                    <li key={index}>
                      <MenuItem {...item}/>
                    </li>
                  ))
              }
              </ul>
            </div>
          </div>)}
      </MobileContainer>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {
    theme: state.otp.config.theme,
    footer : state.otp.config.footer
  }
}

const mapDispatchToProps = {
  setLocationToCurrent,
  setMobileScreen
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(MobileWelcomeScreen))
