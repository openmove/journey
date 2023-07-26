import React, { Component } from "react";
import PropTypes from "prop-types";
import AdvancedLayersControl  from "./AdvancedLayersControl";
import { withNamespaces } from 'react-i18next';
import { Button } from "react-bootstrap";
import { connect } from 'react-redux'

const ButtonRemoveAll = (props) =>  <Button onClick={props.removeAllOverlays} className="btn btn-xs remove-all-btn"> {props.children}</Button>
const ButtonAddAll = (props) =>  <Button onClick={props.addAllOverlays} className="btn btn-xs add-all-btn"> {props.children} </Button>

class ControlButtons extends Component{

  render(){

  const {t} = this.props

  return (
    <div className="filters-buttons">
      <div className="btn-group">
        <ButtonAddAll {...this.props} >{t('control-add-all')}</ButtonAddAll >
        <ButtonRemoveAll {...this.props} > {t('control-remove-all')}</ButtonRemoveAll>
      </div>
    </div>
  )}
}


const ControlButtonsTranslated = withNamespaces()(ControlButtons)

class AdvancedOverlaysController extends Component {
    render() {
      const {
          overlaysConf,
          overlays,
          onFilterRequest
      } = this.props;

      const  {collapsed, closeBtn, allBtn} = overlaysConf;

      const overlaysArray = overlays.map((child, i) => {

          return (
              <AdvancedLayersControl.Overlay
                  key={i}
                  name={child.props.name}
                  checked={child.props.visible}
                  filters={child.props.filters}
                  onFiltersClick={(e) => onFilterRequest(child.props.type)}
              >
                  {child}
              </AdvancedLayersControl.Overlay>
          );
      })

        return (
            <AdvancedLayersControl
              collapsed={collapsed}
              closeBtn={closeBtn}
              overlays={overlaysArray}
            >
             { allBtn && <ControlButtonsTranslated />}
            </AdvancedLayersControl>
        )
    }
}

AdvancedOverlaysController.propTypes = {
    overlays: PropTypes.array,
    onFilterRequest: PropTypes.func
}

AdvancedOverlaysController.defaultProps = {
    overlays: [],
    onFilterRequest: () => {}
}

//export default AdvancedOverlaysController

const mapStateToProps = (state, ownProps) => {
  return {
    overlaysConf: state.otp.config.map.controls.overlays
  }
}

export default connect(mapStateToProps)(AdvancedOverlaysController)
