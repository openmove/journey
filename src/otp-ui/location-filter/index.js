import React, { Component } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { withNamespaces } from "react-i18next";
import FontAwesome from 'react-fontawesome'
import mergeDeep from '../../util/mergeDeep.js'
import { Button } from 'react-bootstrap'
import { isMobile } from "../core-utils/ui.js";

import ToggleSwitch from "../toggle-switch"

class LocationFilter extends Component {
    constructor(props) {
        super(props)

        this.state = {
          error: false,
          loading: false,
          filters: null,
          containerElement: null,
        }
    }

    async componentDidUpdate(prevProps, prevState) {
      const { filters, filtersCustom, show, onFiltersLoad } = this.props

      if (show && (this.state.filters === null && !this.state.loading) && !this.state.error) {
        if (typeof filters === "string") {
          try {
            this.setState({ loading: true })

            const response = await fetch(filters);
            const json = await response.json(); //extract JSON from the http response
            // overwrite filters with custom ones
            const customizedFilters = mergeDeep(json.filters,filtersCustom)
            this.setState({
              filters: customizedFilters,
              loading: false,
              error: false
            })

            onFiltersLoad(customizedFilters)
          } catch (e) {
            this.setState({
              loading: false,
              error: true
            })
          }
        } else if (typeof filters === "object") {
          // overwrite filters with custom ones
          const customizedFilters = mergeDeep(filters,filtersCustom)
          this.setState({ customizedFilters })
          onFiltersLoad(customizedFilters)
        }
      }
    }

    componentDidMount(){
      if(isMobile()){
        this.setState({'containerElement': document.getElementById('filters-container')})
      }
    }

    render() {
        const {
            t,
            title,
            show,
            onClose,
            onChange,
            onReset
        } = this.props

        const filters = (
            <div className={`otp-ui-locationFilter ${show ? 'is-visible' : ''}`}>
                <div className="otp-ui-locationFilter__header">
                    <h4 className="otp-ui-locationFilter__title">{title}</h4>
                    <button className="otp-ui-locationFilter__close" onClick={onClose}></button>
                </div>
                {
                  (!this.state.error && !this.state.loading) &&
                    <button className="otp-ui-locationFilter__activeAll" onClick={onReset}>{t('reset_filters')}</button>
                }
                <div className="otp-ui-locationFilter__container">
                    {
                      (!this.state.error && !this.state.loading) && this.state.filters && Object.keys(this.state.filters).map((key, index) => {
                            const filterGroup = this.state.filters[key]

                            if (!filterGroup.enabled) return false

                            return (
                                <div className="otp-ui-locationFilter__group" key={index}>
                                    <div className="otp-ui-locationFilter__label">{t(filterGroup.label)}</div>
                                    <div className="otp-ui-locationFilter__panel">
                                        {
                                            filterGroup.values.map((item, i) => {
                                                const label = t(item.label||item.value.toString());
                                                return (
                                                    <ToggleSwitch
                                                        title={label}
                                                        key={`${filterGroup.label}-${i}`}
                                                        label={label}
                                                        value={item.value.toString()}
                                                        checked={item.enabled}
                                                        onChange={() => onChange(key, item.value)}
                                                    />
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                    {
                      this.state.loading &&
                        <div className="otp-ui-locationFilter__loader">
                          <FontAwesome
                            name='circle-o-notch'
                            spin={true}
                            size='2x'
                          />
                        </div>
                    }
                    {
                      this.state.error &&
                        <div className="otp-ui-locationFilter__error">
                          <p>{t('error_network')}</p>
                          <Button
                            onClick={() => this.setState({error:false})}
                          >
                            <span><i className={`fa fa-undo`} /> </span>
                            {t('reload')}
                          </Button>
                        </div>
                    }
                </div>
            </div>
        )
        if(this.state.containerElement){
          // show filters full screen

          return createPortal(filters,this.state.containerElement)
        }

        return filters;
    }
}

LocationFilter.propTypes = {
    title: PropTypes.string,
    filters: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object,
    ]),
    show: PropTypes.bool,
    onClose: PropTypes.func,
    onChange: PropTypes.func,
    onReset: PropTypes.func,
    onFiltersLoad: PropTypes.func,
}

LocationFilter.defaultProps = {
    title: '',
    filters: {},
    show: false,
    onClose: () => {},
    onChange: () => {},
    onReset: () => {},
    onFiltersLoad: () => {}
}

export default withNamespaces()(LocationFilter)
