import React from "react";
import PropTypes from "prop-types";
import Icon from "../../components/narrative/icon";

const BadgeIcon = ({ counter, type, paid, children, width }) => {

  return (
    <div className="otp-ui-badge-icon" style={{ width }}>
      <span className={`otp-ui-badge-icon__badge otp-ui-badge-icon__badge--${type}`}>
        {/*{(counter && parseInt(counter) >= 100) ? '+99' : counter}*/}
      </span>
      {paid && (
        <div className={`otp-ui-badge-icon__badge otp-ui-badge-icon__badge--paid`}>
          <Icon type='eur'/>
        </div>
      )}
      { children }
    </div>
  )
}

BadgeIcon.props = {
  counter: PropTypes.integer,
  children: PropTypes.node,
  type: PropTypes.oneOf(['default', 'success', 'warning', 'danger']),
  width: PropTypes.any
}

BadgeIcon.defaultProps = {
  width: null,
  counter: null,
  type: 'default',
  children: <></>,
}

export default BadgeIcon;
