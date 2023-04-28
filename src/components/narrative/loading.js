import React, { Component } from 'react'
import Icon from './icon'

export default class Loading extends Component {
  render () {
    const { small, color, fixed } = this.props
    return (
      <p
        style={{ marginTop: '15px', color}}
        className='text-center'>
        <Icon
          className={`${small ? 'fa-3x' : 'fa-5x'} fa-spin`}
          type='refresh' />
      </p>
    )
  }
}
