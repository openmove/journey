import clone from 'lodash/cloneDeep'
import memoize from 'lodash.memoize'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { withNamespaces } from "react-i18next"
import {
  ControlLabel,
  FormControl,
  FormGroup,
  InputGroup
} from 'react-bootstrap'
import FontAwesome from 'react-fontawesome'
import styled from 'styled-components'

// Styles.
const fancyAddLocationCss = `
  background-color: #337ab7;
  color: #fff;
`
const StyledAddon = styled(InputGroup.Addon)`
  min-width: 40px;
`
const NewLocationAddon = styled(StyledAddon)`
  ${fancyAddLocationCss}
`
const NewLocationFormControl = styled(FormControl)`
  ${fancyAddLocationCss}
  ::placeholder {
    color: #fff;
  }
  &:focus {
    background-color: unset;
    color: unset;
    ::placeholder {
      color: unset;
    }
  }
`

// Helper filter functions.
const isHome = loc => loc.type === 'home'
const isWork = loc => loc.type === 'work'
const notHomeOrWork = loc => loc.type !== 'home' && loc.type !== 'work'

/**
 * User's saved locations editor.
 */
class FavoriteLocationsPane extends Component {
  static propTypes = {
    onUserDataChange: PropTypes.func.isRequired,
    userData: PropTypes.object.isRequired
  }

  _handleAddNewLocation = e => {
    const value = e.target.value || ''
    if (value.trim().length > 0) {
      const { userData, onUserDataChange } = this.props
      // FIXME: remove assigning [] when null.
      const { savedLocations = [] } = userData

      // Create a copy of savedLocations and add the new location to the copied array.
      const newLocations = clone(savedLocations)
      newLocations.push({
        address: value.trim(),
        icon: 'map-marker',
        type: 'custom'
      })

      // Event onChange will trigger after this and before rerender,
      // so DO empty the input box value so the user can enter their next location.
      e.target.value = null

      onUserDataChange({ savedLocations: newLocations })
    }
  }

  _handleAddressChange = memoize(
    location => e => {
      const { userData, onUserDataChange } = this.props
      // FIXME: remove assigning [] when null.
      const { savedLocations = [] } = userData
      const value = e.target.value
      const isValueEmpty = !value || value === ''
      const nonEmptyLocation = isValueEmpty ? null : location

      // Update location address, ohterwise it stalls the input box.
      location.address = value

      // Create a new array for savedLocations.
      let newLocations = []

      // Add home/work as first entries to the new state only if
      // - user edited home/work to non-empty, or
      // - user edited another location and home/work is in savedLocations.
      const homeLocation = (isHome(location) && nonEmptyLocation) || savedLocations.find(isHome)
      if (homeLocation) newLocations.push(homeLocation)

      const workLocation = (isWork(location) && nonEmptyLocation) || savedLocations.find(isWork)
      if (workLocation) newLocations.push(workLocation)

      // Add the rest if it is not home or work
      // and if the new address of this one is not null or empty.
      newLocations = newLocations.concat(savedLocations
        .filter(notHomeOrWork)
        .filter(loc => loc !== location || !isValueEmpty)
      )

      onUserDataChange({ savedLocations: newLocations })
    }
  )

  render () {
    const { userData, t } = this.props
    // FIXME: remove assigning [] when null.
    const { savedLocations = [] } = userData

    // Build an 'effective' list of locations for display,
    // where at least one 'home' and one 'work', are always present even if blank.
    // In theory there could be multiple home or work locations.
    // Just pick the first one.
    const homeLocation = savedLocations.find(isHome) || {
      address: null,
      icon: 'home',
      type: 'home'
    }
    const workLocation = savedLocations.find(isWork) || {
      address: null,
      icon: 'briefcase',
      type: 'work'
    }

    const effectiveLocations = [
      homeLocation,
      workLocation,
      ...savedLocations.filter(notHomeOrWork)
    ]

    return (
      <div>
        <ControlLabel>{t('add_the_places_you_frequent_often_to_save_time_planning_trips')}</ControlLabel>

        {effectiveLocations.map((loc, index) => (
          <FormGroup key={index}>
            <InputGroup>
              <StyledAddon title={loc.type}>
                <FontAwesome name={loc.icon} />
              </StyledAddon>
              <FormControl
                onChange={this._handleAddressChange(loc)}
                placeholder={t('add_location', { location: loc.type })}
                type='text'
                value={loc.address} />
            </InputGroup>
          </FormGroup>
        ))}

        {/* For adding a location. */}
        <FormGroup>
          <InputGroup>
            <NewLocationAddon>
              <FontAwesome name='plus' />
            </NewLocationAddon>
            <NewLocationFormControl
              onBlur={this._handleAddNewLocation}
              placeholder={t('add_another_place')}
              type='text'
            />
          </InputGroup>
        </FormGroup>
      </div>
    )
  }
}

export default withNamespaces()(FavoriteLocationsPane)
