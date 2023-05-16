import React from 'react'
import { connect } from 'react-redux'
import {  MapLayer } from 'react-leaflet'

class AbstractOverlay extends MapLayer {

  constructor({props,api,query,config}){
    super(props);
    this._startRefreshing = this._startRefreshing.bind(this)
    this._stopRefreshing = this._stopRefreshing.bind(this)
    this._setupInterval = this._setupInterval.bind(this)

    console.log(config);
    this.config = config
    this.api = api
    this.query = query
  }


  _setupInterval(){
    if(!this.config.pollingUpdate){
      return
    }
    console.log('setup interval');
    // set up interval to refresh stations periodically
    this._refreshInterval = setInterval(() => {
      console.log('interval call');
      this._startRefreshing()
    }, Number(this.config?.pollingInterval || 3000)) // defaults to every 30 sec.
  }

  _startRefreshing(launchNow) {
    console.log('refreshing', 'query:', this.query);
    const bb =  getItem('mapBounds')
    const params = bb
    if(launchNow === true){
      this.query(this.api , params);
    }else{
      if (this._refreshTimer) clearTimeout(this._refreshTimer);

      this._refreshTimer =  setTimeout(()=>{
        const bb =  getItem('mapBounds')
        const params = bb
        this.query(this.api, params);
      },500)

    }
  }

  addMoveEndEventListener(){
    if(!this.config.updateBBox){
      return
    }
    console.log('added move event listener');
    this.props.leaflet.map.on("moveend", this._startRefreshing);
  }

  removeMoveEndEventListener(){
    if(!this.config.updateBBox){
      return
    }
    console.log('removed move event listener');
    this.props.leaflet.map.off("moveend", this._startRefreshing)
  }

  _stopRefreshing() {
    console.log('stop refreshing');
    if (this._refreshTimer){
      console.log('cleared timer');
      clearTimeout(this._refreshTimer);
    }

    if(this._refreshInterval){
      console.log('cleared interval');
      clearInterval(this._refreshInterval)
    }
  }

  componentDidMount() {
    this.props.registerOverlay(this)

    if (this.props.visible) {
        this._setupInterval()
        this._startRefreshing()
    }
  }

  componentWillUnmount() {
    console.log('unmounting');
    this.removeMoveEndEventListener()
    this._stopRefreshing()
  }


  onOverlayAdded = (e) => {
    console.log('overlay added');
    this.addMoveEndEventListener()
    this._setupInterval()
    this._startRefreshing(true);
    const { map } = this.props.leaflet;
    if(this.config?.startCenter){
      map.flyTo(this.config.startCenter);
    }
  }

  onOverlayRemoved = () => {
    console.log('overlay removed');
    this.removeMoveEndEventListener();
    this._stopRefreshing()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.visible && this.props.visible) {
      this._startRefreshing()
      this.addMoveEndEventListener()
    } else if (prevProps.visible && !this.props.visible) {
      this._stopRefreshing()
      this.removeMoveEndEventListener()
    }
  }

  createLeafletElement() { }

  updateLeafletElement() { }

  render() {
    console.error('Abstract Class must be extended')
  }
}


export default AbstractOverlay
