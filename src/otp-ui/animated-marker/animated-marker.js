// thanks to https://github.com/openplans/Leaflet.AnimatedMarker
import L from 'leaflet'

L.AnimatedMarker = L.Marker.extend({
  options: {
    // meters
    distance: 200,
    // ms
    interval: 500,
    // animate on add?
    autoStart: true,
    // callback onend
    onEnd: function () {},
    clickable: false,
  },

  initialize: function (latlngs, options) {
    this.setLine(latlngs);
    L.Marker.prototype.initialize.call(this, latlngs[0], options);
  },

  // Breaks the line up into tiny chunks (see options) ONLY if CSS3 animations
  // are not supported.
  _chunk: function (latlngs) {
    var i,
      len = latlngs.length,
      chunkedLatLngs = [];

    for (i = 1; i < len; i++) {
      var cur = latlngs[i - 1],
        next = latlngs[i],
        dist = cur.distanceTo(next),
        factor = this.options.distance / dist,
        dLat = factor * (next.lat - cur.lat),
        dLng = factor * (next.lng - cur.lng);

      if (dist > this.options.distance) {
        while (dist > this.options.distance) {
          cur = new L.LatLng(cur.lat + dLat, cur.lng + dLng);
          dist = cur.distanceTo(next);
          chunkedLatLngs.push(cur);
        }
      } else {
        chunkedLatLngs.push(cur);
      }
    }
    chunkedLatLngs.push(latlngs[len - 1]);

    return chunkedLatLngs;
  },

  onAdd: function (map) {
    L.Marker.prototype.onAdd.call(this, map);

    // Start animating when added to the map
    if (this.options.autoStart) {
      this.start();
    }
  },

  onRemove: function (map){
    L.Marker.prototype.onRemove.call(this, map);
    // stop animation
    this.stop();
  },

  animate: function () {
    var self = this,
      len = this._latlngs.length,
      speed = this.options.interval;

    // Normalize the transition speed from vertex to vertex
    if (this._i < len && this.i > 0) {
      speed =
        (this._latlngs[this._i - 1].distanceTo(this._latlngs[this._i]) /
          this.options.distance) *
        this.options.interval;
    }

    // Only if CSS3 transitions are supported
    if (L.DomUtil.TRANSITION) {
      if (this._icon) {
        this._icon.style[L.DomUtil.TRANSITION] = "all " + speed + "ms linear";
      }
      if (this._shadow) {
        this._shadow.style[L.DomUtil.TRANSITION] = "all " + speed + "ms linear";
      }
    }

    // Move to the next vertex
    this.setLatLng(this._latlngs[this._i]);
    this._i++;

    // Queue up the animation to the next next vertex
    this._tid = setTimeout(function () {
      if (self._i === len) {
        self.options.onEnd.apply(self, Array.prototype.slice.call(arguments));
      } else {
        self.animate();
      }
    }, speed);
  },

  // Start the animation
  start: function () {
    this._i=0; // PATCH:
    // when removing and adding layer there's only a point and without this gives error
    // but this causes the animation to start over
    this.animate();
  },

  // Stop the animation in place
  stop: function () {
    if (this._tid) {
      clearTimeout(this._tid);
    }
  },

  setLine: function (latlngs) {
    if (L.DomUtil.TRANSITION) {
      // No need to to check up the line if we can animate using CSS3
      this._latlngs = latlngs;
    } else {
      // Chunk up the lines into options.distance bits
      this._latlngs = this._chunk(latlngs);
      this.options.distance = 10;
      this.options.interval = 30;
    }
    this._i = 0;
  },
  getLine: function () {
    return this._latlngs;
  },
});

L.animatedMarker = function (latlngs, options) {
  return new L.AnimatedMarker(latlngs, options);
};
