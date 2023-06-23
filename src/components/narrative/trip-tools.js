import React, {Component} from 'react'
import { connect } from 'react-redux'
import { Button, ButtonGroup } from 'react-bootstrap'
// import { DropdownButton, MenuItem } from 'react-bootstrap'
import copyToClipboard from 'copy-to-clipboard'
import Bowser from 'bowser'
import { withNamespaces } from 'react-i18next'

class TripTools extends Component {
  static defaultProps = {
    buttonTypes: [ 'COPY_URL', 'PRINT', 'REPORT_ISSUE', 'START_OVER' ]
  }

  render () {
    const { buttonTypes, reportConfig, reactRouterConfig, t } = this.props

    const buttonComponents = []
    buttonTypes.forEach((type) => {
      switch (type) {
        case 'COPY_URL':
          buttonComponents.push(<CopyUrlButton labelCopy={t('copied')} labelCopied={t('copy')} />)
          break
        case 'PRINT':
          buttonComponents.push(<PrintButton label={t('print')} />)
          break
        case 'REPORT_ISSUE':
          if (!reportConfig || !reportConfig.mailto) break
          buttonComponents.push(<ReportIssueButton label={t('report_issue')} {...reportConfig} t={t} />)
          break
        case 'START_OVER':
          // Determine "home" URL
          let startOverUrl = '/'
          if (reactRouterConfig && reactRouterConfig.basename) {
            startOverUrl += reactRouterConfig.basename
          }
          buttonComponents.push(<LinkButton icon='undo' text={t('restart')} url={startOverUrl} />)
          break
      }
    })

    return (
      <div className='trip-tools'>
        <ButtonGroup>
          {buttonComponents.map((btn,index) => <div key={index}>{btn}</div>)}
        </ButtonGroup>
      </div>
    )
  }
}

// Share/Save Dropdown Component -- not used currently

/*
class ShareSaveDropdownButton extends Component {
  _onCopyToClipboardClick = () => {
    copyToClipboard(window.location.href)
  }

  render () {
    return (
      <DropdownButton
        className='tool-button'
        title={<span><i className='fa fa-share' /> Share/Save</span>}
        id={'tool-share-dropdown'}
      >
        <MenuItem onClick={this._onCopyToClipboardClick}>
          <i className='fa fa-clipboard' /> Copy Link to Clipboard
        </MenuItem>
      </DropdownButton>
    )
  }
}
*/

// Copy URL Button

class CopyUrlButton extends Component {
  constructor (props) {
    super(props)
    this.state = { showCopied: false }
  }

  _resetState = () => this.setState({ showCopied: false })

  _onClick = () => {
    // If special routerId has been set in session storage, construct copy URL
    // for itinerary with #/start/ prefix to set routerId on page load.
    const routerId = window.sessionStorage.getItem('routerId')
    let url = window.location.href
    if (routerId) {
      const parts = url.split('#')
      if (parts.length === 2) {
        url = `${parts[0]}#/start/x/x/x/${routerId}${parts[1]}`
      } else {
        console.warn('URL not formatted as expected, copied URL will not contain session routerId.', routerId)
      }
    }
    copyToClipboard(url)
    this.setState({ showCopied: true })
    window.setTimeout(this._resetState, 2000)
  }

  render () {
    return (
      <Button
        className='tool-button'
        onClick={this._onClick}
      >
        {this.state.showCopied
          ? <span><i className='fa fa-check' /> { this.props.labelCopy }</span>
          : <span><i className='fa fa-clipboard' /> { this.props.labelCopied }</span>
        }
      </Button>
    )
  }
}

// Print Button Component

class PrintButton extends Component {
  _onClick = () => {
    // Note: this is designed to work only with hash routing.
    const printUrl = window.location.href.replace('#', '#/print')
    window.open(printUrl, '_blank')
  }

  render () {
    return (
      <Button
        className='tool-button'
        onClick={this._onClick}
      >
        <i className='fa fa-print' /> { this.props.label }
      </Button>
    )
  }
}

// Report Issue Button Component

class ReportIssueButton extends Component {
/*   static defaultProps = {
    subject: 'Reporting an Issue with OpenTripPlanner'
  }
 */
  _onClick = () => {
    const { mailto, subject, t } = this.props
    const mailSubject = subject ? t(subject) : t('mail_support_subject')
    const bowser = Bowser.parse(window.navigator.userAgent);
    const {
        browser = {
          name:'',
          version:''
        },
        os = {
          name: '',
          version: ''
        }
      } = bowser

    const bodyLines = [
      `${t('mail_support_user_instruction')}`,
      `${t('mail_support_user_instruction1')}`,
      `${t('mail_support_description')}`,
      '',
      '',
      '',
      '',
      `${t('mail_support_data')}`,
      `${t('mail_support_address')}: ` + window.location.href,
      `${t('mail_support_browser')}: ` + browser.name + ' ' + browser.version,
      `${t('mail_support_os')}: ` + os.name + ' ' + os.version,
      ''
    ]

    window.open(`mailto:${mailto}?subject=${mailSubject}&body=${encodeURIComponent(bodyLines.join('\n'))}`, '_blank')
  }

  render () {
    return (
      <Button
        className='tool-button'
        onClick={this._onClick}
      >
        <i className='fa fa-flag' /> { this.props.label }
      </Button>
    )
  }
}

// Link to URL Button

class LinkButton extends Component {
  _onClick = () => {
    window.location.href = this.props.url
  }

  render () {
    const { icon, text } = this.props
    return (
      <Button
        className='tool-button'
        onClick={this._onClick}
      >
        {icon && <span><i className={`fa fa-${icon}`} /> </span>}
        {text}
      </Button>
    )
  }
}

// Connect main class to redux store

const mapStateToProps = (state, ownProps) => {
  return {
    reportConfig: state.otp.config.reportIssue,
    reactRouterConfig: state.otp.config.reactRouter
  }
}

export default withNamespaces()(connect(mapStateToProps)(TripTools))
