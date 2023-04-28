import React, { Component } from "react";
import PropTypes from "prop-types";
import { Checkbox } from 'react-bootstrap';

/**
 * A wrapper that includes an <input type="select" /> control and a <label> for the input control.
 */
class CheckboxSelector extends Component {
  handleChange = evt => {
    const { name, onChange } = this.props;

    if (typeof onChange === "function") {
      onChange({
        [name]: evt.target.checked
      });
    }
  };

  render() {
    const { className, label, name, style } = this.props;
    const id = `id-query-param-${name}`;
    let { value } = this.props;
    if (typeof value === "string") value = value === "true";

    return (
      <Checkbox
        id={id}
        className={className}
        checked={value}
        onChange={this.handleChange}
      >
        {label}
      </Checkbox>
    );
  }
}

CheckboxSelector.propTypes = {
  /**
   * The CSS class name to apply to this element.
   */
  className: PropTypes.string,
  /**
   * A unique name for the setting.
   */
  name: PropTypes.string,
  /**
   * The initial value for the contained <input> control.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  /**
   * The contents of the contained <label> control.
   */
  label: PropTypes.string,
  /**
   * Triggered when the value of the <input> control changes.
   * @param e The data for the HTML checkbox onchange event.
   */
  onChange: PropTypes.func
};

CheckboxSelector.defaultProps = {
  className: null,
  name: null,
  value: null,
  label: null,
  onChange: null
};

export default CheckboxSelector;
