import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { MenuItem, NavDropdown, NavItem } from 'react-bootstrap'
import styled from 'styled-components'
import { withNamespaces } from "react-i18next"

import { routeTo } from '../../actions/ui'

import LinkMenuItem, { linkType } from './link-menu-item'

const Avatar = styled.img`
  height: 2em;
  margin: -15px 0;
  width: 2em;
`

/**
 * This component displays the sign-in status in the nav bar.
 * - When a user is not logged in: display 'Sign In' as a link or button.
 * - When a user is logged in, display an 'avatar' (retrieved from the profile prop)
 *   and a dropdown button so the user can access more options.
 */
class NavLoginButton extends Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(linkType),
    onSignInClick: PropTypes.func.isRequired,
    onSignOutClick: PropTypes.func.isRequired,
    profile: PropTypes.shape({
      email: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      nickname: PropTypes.string,
      picture: PropTypes.string
    })
  }

  static defaultProps = {
    links: null,
    profile: null
  }

  render () {
    const {
      className,
      id,
      links,
      onSignInClick,
      onSignOutClick,
      profile,
      style,
      t
    } = this.props

    const commonProps = {
      className,
      id,
      style
    }

    // If a profile is passed (a user is logged in), display avatar and drop-down menu.
    if (profile) {
      const displayedName = profile.nickname || profile.name
      return (
        <NavDropdown
          {...commonProps}
          pullRight
          title={<span>
            <Avatar
              alt={displayedName}
              src={profile.picture}
              title={`${displayedName}\n(${profile.email})`}
            />
          </span>
          }>
          <MenuItem header>{displayedName}</MenuItem>

          {links && links.map((link, i) => <LinkMenuItem key={i} link={link} />)}

          <MenuItem divider />

          <MenuItem onSelect={onSignOutClick}>{t('sign_out')}</MenuItem>
        </NavDropdown>
      )
    }

    // Display the sign-in link if no profile is passed (user is not logged in).
    return (
      <NavItem {...commonProps} onClick={onSignInClick}>
        {t('sign_in')}
      </NavItem>
    )
  }
}

// connect to the redux store

const mapStateToProps = (state, ownProps) => {
  return {}
}

const mapDispatchToProps = {
  routeTo
}

export default withNamespaces()(connect(mapStateToProps, mapDispatchToProps)(NavLoginButton))
