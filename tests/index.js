
const config = {
  port: 7000
}

const {'features': p10k} = require(`${__dirname}/10k_points.json`)
const {'features': p100k} = require(`${__dirname}/10k_points.json`)
//RANDOM DATA POINTS in ITALY

const https = require('https');
//TODO replace with something else or undici

const _ = require('lodash')
    , yaml = require('js-yaml')
    , express = require('express')
    , cors = require('cors')
    , dotenv = require('dotenv').config()

const datasets = {
  carsharing: require(`${__dirname}/carsharing/stations.json`),
  charger: require(`${__dirname}/charger/stations.json`),
  parking: require(`${__dirname}/parking/all.json`),
  vms: require(`${__dirname}/vms/stations.json`),
  webcam: require(`${__dirname}/webcam/stations.json`),
}

for (const dataset in datasets) {

  let {data: {stations} } = datasets[ dataset ];

  stations = _.uniqBy(stations, 'station_id')

  const mixedStations = p10k.map(point => {

    const [lon, lat] = point.geometry.coordinates


    const station = _.sample(stations)
      , rnd = _.random(1,1000)+_.random(1,1000)

    let {station_id, name} = station;

    station_id += `::${rnd}`;
    name += `::${rnd}`;

    return {
          ...station,
          station_id,
          name,
          lon,
          lat
        };
  });

  datasets[ dataset ] = {data: {stations: mixedStations }};

  console.log(mixedStations.slice(0,1),'SAMPLES MIXED STATIONS', dataset)
}


function isInBbox(bb, p){
    //ix, iy are the bottom left coordinates
    //ax, ay are the top right coordinates
    if(!bb){
        return true;
    }
    if( bb.minLon <= p.lon && p.lon <= bb.maxLon && bb.minLat <= p.lat && p.lat <= bb.maxLat ) {
     return true;
    }
    return false;
}

const serviceName = 'datatest';
var last_updated = Math.trunc((new Date()).getTime() / 1000 );

const app = express();

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200
}));

app.set('json spaces', 2);

// /charger/stations.json?minLon=10.501870618149423&maxLon=11.684960828110361&minLat=46.45654196795479&maxLat=46.8181500450607

app.get('/parking/all.json', function (req, res) {
  const url = new URL(`http://localhost:${config.port}{req.url}`);
  res.redirect(`/parking/stations.json${url.search}`);
});

app.get('/:dataset/stations.json', function (req, res) {

    const {dataset} = req.params;
    const {minLon, maxLon, minLat, maxLat} = req.query;

    let filterStations;

console.log('GET', dataset )

    if(minLon && maxLon && minLat && maxLat) {
        let bbox = {
            minLon,
            minLat,
            maxLon,
            maxLat
        }
console.log('filter')
      filterStations = datasets[ dataset ].data.stations.filter(station => {
        const ret = isInBbox(bbox, station)
        return ret
      })

    }else{
        filterStations = datasets[ dataset ].data.stations.slice(0,10)
    }

console.log('filtered', filterStations.length)


    res.json({
        last_updated,
        ttl: 0,
        version: 1,
        data: {
            stations: filterStations
        }
    });
});

app.get(['/','/charger'], async (req, res) => {
  res.send({
    status: 'OK',
    version
  });
});

app.listen(config.port, function() {
    console.log('listen paths', app._router.stack.filter(r => r.route).map(r => `${Object.keys(r.route.methods)[0]} ${r.route.path}`) );
    console.log(`${serviceName} listening at http://localhost:${this.address().port}/charger/stations.json`);
});
